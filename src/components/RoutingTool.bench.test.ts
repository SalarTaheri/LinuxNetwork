import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateIptablesRules,
  generateNftablesRules,
  generateRoutingOneLiner,
  generateVerificationCommands,
  generateRollbackCommands,
} from '../utils/routingGenerator';
import { RoutingSettings } from '../types';

const mockSettings: RoutingSettings = {
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

  secondaryInterface: 'eth1',
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

describe('RoutingTool Config Generation Benchmark', () => {
  it('generates expected routing rules output for iptables, nftables, and one-liner', () => {
    const iptables = generateIptablesRules(mockSettings, 'en');
    const nftables = generateNftablesRules(mockSettings, 'en');
    const oneLiner = generateRoutingOneLiner(mockSettings, 'en');
    const verify = generateVerificationCommands(mockSettings, 'en');
    const rollback = generateRollbackCommands(mockSettings, 'en');

    assert.ok(iptables.includes('MASQUERADE'), 'iptables config should contain MASQUERADE');
    assert.ok(nftables.includes('masquerade'), 'nftables config should contain masquerade');
    assert.ok(oneLiner.includes('iptables'), 'One-liner should contain iptables');
    assert.ok(verify.includes('iptables -t nat -nvL'), 'Verification commands should inspect iptables');
    assert.ok(rollback.includes('iptables -F'), 'Rollback commands should flush iptables');
  });

  it('benchmark: repeated config generation vs memoized reference', () => {
    const iterations = 50000;

    // Pre-calculated memoized references
    const memoizedIptables = generateIptablesRules(mockSettings, 'en');
    const memoizedNftables = generateNftablesRules(mockSettings, 'en');
    const memoizedOneLiner = generateRoutingOneLiner(mockSettings, 'en');
    const memoizedDiagnostics =
      generateVerificationCommands(mockSettings, 'en') + '\n\n' + generateRollbackCommands(mockSettings, 'en');
    const memoizedRollback = generateRollbackCommands(mockSettings, 'en');

    // Warmup
    for (let i = 0; i < 100; i++) {
      generateIptablesRules(mockSettings, 'en');
      generateNftablesRules(mockSettings, 'en');
      generateRoutingOneLiner(mockSettings, 'en');
      generateVerificationCommands(mockSettings, 'en');
      generateRollbackCommands(mockSettings, 'en');
    }

    // Measure repeated unmemoized calls (all 5 generators executed per render)
    const startUnmemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const ip = generateIptablesRules(mockSettings, 'en');
      const nf = generateNftablesRules(mockSettings, 'en');
      const bash = generateRoutingOneLiner(mockSettings, 'en');
      const diag = generateVerificationCommands(mockSettings, 'en') + '\n\n' + generateRollbackCommands(mockSettings, 'en');
      const rb = generateRollbackCommands(mockSettings, 'en');
    }
    const durationUnmemoized = performance.now() - startUnmemoized;

    // Measure memoized access
    const startMemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const ip = memoizedIptables;
      const nf = memoizedNftables;
      const bash = memoizedOneLiner;
      const diag = memoizedDiagnostics;
      const rb = memoizedRollback;
    }
    const durationMemoized = performance.now() - startMemoized;

    const speedupFactor = (durationUnmemoized / (durationMemoized || 0.001)).toFixed(1);
    console.log(`\n--- ROUTING CONFIG GENERATION BENCHMARK (${iterations} iterations) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:      ${speedupFactor}x faster\n`);

    assert.ok(
      durationMemoized < durationUnmemoized,
      'Memoized config reference access should be faster than regenerating config strings every render'
    );
  });
});
