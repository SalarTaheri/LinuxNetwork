import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateIptablesRules,
  generateNftablesRules,
  generateRoutingOneLiner,
  generateVerificationCommands,
  generateRollbackCommands,
} from './routingGenerator';
import { RoutingSettings } from '../types';

const defaultSettings: RoutingSettings = {
  scenario: 'nat_gateway',
  wanInterface: 'eth0',
  lanInterface: 'eth1',
  lanSubnet: '192.168.100.0/24',
  natMode: 'masquerade',
  staticPublicIp: '203.0.113.10',
  enableDnsForwarding: true,
  enableMssClamping: true,

  protocol: 'tcp',
  externalPort: '8080',
  internalIp: '192.168.100.15',
  internalPort: '80',
  enableHairpinNat: true,

  dockerPort: '5432',
  dockerAllowedSubnet: '10.8.0.0/24',
  dockerAction: 'DROP',

  secondaryInterface: 'eth2',
  secondaryIp: '192.168.2.100',
  secondaryGateway: '192.168.2.1',
  pbrTableNumber: 200,
  pbrTableName: 'isp2',
  enableLooseRpFilter: true,

  rateLimitPort: '22',
  rateLimitMaxHits: 4,
  rateLimitWindowSeconds: 60,
  rateLimitBlockSeconds: 300,
};

describe('Routing & NAT Generator', () => {
  describe('NAT Gateway Scenario', () => {
    test('generates masquerade nat and stateful forward rules with ip_forward', () => {
      const output = generateIptablesRules(defaultSettings, 'fa');
      assert.match(output, /net\.ipv4\.ip_forward=1/);
      assert.match(output, /-t nat -A POSTROUTING -o eth0 -s 192\.168\.100\.0\/24 -j MASQUERADE/);
      assert.match(output, /-A FORWARD -i eth0 -o eth1 -m state --state RELATED,ESTABLISHED -j ACCEPT/);
      assert.match(output, /-A FORWARD -i eth1 -o eth0 -j ACCEPT/);
      assert.match(output, /TCPMSS --clamp-mss-to-pmtu/);
      assert.match(output, /--dport 53 -j ACCEPT/);
    });

    test('generates SNAT rule when static public IP is chosen', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        natMode: 'snat',
        staticPublicIp: '198.51.100.5',
      };
      const output = generateIptablesRules(settings, 'en');
      assert.match(output, /-t nat -A POSTROUTING -o eth0 -s 192\.168\.100\.0\/24 -j SNAT --to-source 198\.51\.100\.5/);
    });

    test('generates valid nftables NAT gateway ruleset', () => {
      const output = generateNftablesRules(defaultSettings, 'en');
      assert.match(output, /table ip nat/);
      assert.match(output, /oifname "eth0" ip saddr 192\.168\.100\.0\/24 masquerade/);
      assert.match(output, /iifname "eth1" oifname "eth0" ip saddr 192\.168\.100\.0\/24 accept/);
    });
  });

  describe('Port Forwarding Scenario', () => {
    test('generates DNAT in PREROUTING and accept in FORWARD filter chain', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'port_forward',
        protocol: 'tcp',
        externalPort: '9000',
        internalIp: '192.168.100.50',
        internalPort: '9000',
        enableHairpinNat: true,
      };
      const output = generateIptablesRules(settings, 'en');
      assert.match(output, /-t nat -A PREROUTING -i eth0 -p tcp --dport 9000 -j DNAT --to-destination 192\.168\.100\.50:9000/);
      assert.match(output, /-A FORWARD -p tcp -d 192\.168\.100\.50 --dport 9000 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT/);
      // Hairpin NAT check
      assert.match(output, /-t nat -A POSTROUTING -s 192\.168\.100\.0\/24 -d 192\.168\.100\.50 -p tcp --dport 9000 -j MASQUERADE/);
    });

    test('handles both TCP and UDP protocols', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'port_forward',
        protocol: 'both',
        externalPort: '53',
        internalIp: '192.168.100.2',
        internalPort: '53',
      };
      const output = generateIptablesRules(settings, 'en');
      assert.match(output, /-p tcp --dport 53 -j DNAT/);
      assert.match(output, /-p udp --dport 53 -j DNAT/);
    });

    test('generates nftables DNAT rules', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'port_forward',
      };
      const output = generateNftablesRules(settings, 'en');
      assert.match(output, /dnat to 192\.168\.100\.15:80/);
      assert.match(output, /ip daddr 192\.168\.100\.15 tcp dport 80 ct state new,established,related accept/);
    });
  });

  describe('Docker Port Shield Scenario', () => {
    test('generates DOCKER-USER rules locking port to allowed subnet', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'docker_shield',
        dockerPort: '5432',
        dockerAllowedSubnet: '10.8.0.0/24',
        dockerAction: 'DROP',
      };
      const output = generateIptablesRules(settings, 'fa');
      assert.match(output, /DOCKER-USER/);
      assert.match(output, /-I DOCKER-USER -i eth0 -p tcp --dport 5432 -s 10\.8\.0\.0\/24 -j ACCEPT/);
      assert.match(output, /-A DOCKER-USER -i eth0 -p tcp --dport 5432 -j DROP/);
      assert.match(output, /-A DOCKER-USER -j RETURN/);
    });
  });

  describe('Policy-Based Routing (Multi-WAN)', () => {
    test('generates rt_tables entry, default route in custom table, and ip rule', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'pbr_multiwan',
        secondaryInterface: 'eth2',
        secondaryIp: '192.168.2.100',
        secondaryGateway: '192.168.2.1',
        pbrTableNumber: 200,
        pbrTableName: 'isp2',
        enableLooseRpFilter: true,
      };
      const output = generateIptablesRules(settings, 'en');
      assert.match(output, /echo "200 isp2" \| sudo tee -a \/etc\/iproute2\/rt_tables/);
      assert.match(output, /ip route replace default via 192\.168\.2\.1 dev eth2 table isp2/);
      assert.match(output, /ip rule add from 192\.168\.2\.100 table isp2 priority 1000/);
      assert.match(output, /net\.ipv4\.conf\.all\.rp_filter=2/);
    });
  });

  describe('Rate Limiting Scenario', () => {
    test('generates xt_recent rules to throttle brute-force attacks', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'rate_limit',
        rateLimitPort: '22',
        rateLimitMaxHits: 5,
        rateLimitWindowSeconds: 60,
        rateLimitBlockSeconds: 600,
      };
      const output = generateIptablesRules(settings, 'en');
      assert.match(output, /-m recent --update --seconds 600 --name BRUTEFORCE_22 --rsource -j DROP/);
      assert.match(output, /-m recent --set --name BRUTEFORCE_22 --rsource/);
      assert.match(output, /-m recent --rcheck --seconds 60 --hitcount 5 --name BRUTEFORCE_22 --rsource -j DROP/);
    });

    test('generates nftables meter rate limiting', () => {
      const settings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'rate_limit',
      };
      const output = generateNftablesRules(settings, 'en');
      assert.match(output, /meter ssh_meter/);
      assert.match(output, /set denylist/);
    });
  });

  describe('One-Liner and Diagnostics', () => {
    test('one-liner script handles apt, dnf/yum, and apk persistence', async () => {
      const oneLiner = generateRoutingOneLiner(defaultSettings, 'en');
      assert.match(oneLiner, /iptables-persistent/);
      assert.match(oneLiner, /iptables-services/);
      assert.match(oneLiner, /apk/);

      const scriptWithoutSudo = oneLiner.replace(/^sudo /, '');
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execFileAsync = promisify(execFile);

      const { stderr } = await execFileAsync('bash', ['-n', '-c', scriptWithoutSudo]);
      assert.equal(stderr, '');
    });

    test('verification commands output tcpdump and iptables query commands', () => {
      const verifyCmd = generateVerificationCommands(defaultSettings, 'fa');
      assert.match(verifyCmd, /iptables -t nat -nvL/);
      assert.match(verifyCmd, /tcpdump -ni/);
    });

    test('rollback commands safely flush chains and restore ACCEPT default', () => {
      const rollbackCmd = generateRollbackCommands(defaultSettings, 'en');
      assert.match(rollbackCmd, /iptables -P INPUT ACCEPT/);
      assert.match(rollbackCmd, /iptables -F/);
      assert.match(rollbackCmd, /iptables -t nat -F/);
    });
  });

  describe('Security & Input Sanitization', () => {
    test('sanitizes interface names, ports, and subnets against command injection', () => {
      const maliciousSettings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'docker_shield',
        wanInterface: "eth0/bar:1; rm -rf / ' && echo hacked",
        dockerPort: "5432; cat /etc/passwd",
        dockerAllowedSubnet: "10.8.0.0/24; reboot",
        dockerAction: "DROP; rm -rf /" as any,
      };
      const iptables = generateIptablesRules(maliciousSettings, 'en');
      assert.doesNotMatch(iptables, /;\s*rm/);
      assert.doesNotMatch(iptables, /;\s*cat/);
      assert.doesNotMatch(iptables, /;\s*reboot/);
      assert.match(iptables, /--dport 5432/);
      assert.match(iptables, /-j DROP/);

      const nftables = generateNftablesRules(maliciousSettings, 'en');
      assert.doesNotMatch(nftables, /;\s*rm/);
      assert.doesNotMatch(nftables, /eth0\/bar:1/);
      assert.match(nftables, /drop/);
    });

    test('sanitizes routing table names restricting invalid characters like slashes and colons', () => {
      const maliciousSettings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'pbr_multiwan',
        pbrTableName: 'isp2/bad:table; rm -rf /',
      };
      const iptables = generateIptablesRules(maliciousSettings, 'en');
      assert.doesNotMatch(iptables, /isp2\/bad:table/);
      assert.match(iptables, /isp2badtablerm-rf/);
    });

    test('sanitizes numeric parameters and handles undefined/null values without crashing', () => {
      const maliciousSettings: RoutingSettings = {
        ...defaultSettings,
        scenario: 'rate_limit',
        wanInterface: undefined,
        rateLimitPort: null as any,
        rateLimitMaxHits: '999999' as any,
        rateLimitWindowSeconds: -50 as any,
        rateLimitBlockSeconds: 'invalid' as any,
      };
      const iptables = generateIptablesRules(maliciousSettings, 'en');
      assert.match(iptables, /BRUTEFORCE_22/);
      assert.match(iptables, /--seconds 300/); // falls back to default 300 for invalid string
      assert.match(iptables, /--hitcount 4/); // falls back to default 4 for out-of-range number
    });
  });
});
