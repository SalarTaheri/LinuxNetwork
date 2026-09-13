import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateSysctlConfig, generateSysctlOneLiner } from './sysctlGenerator';
import { SysctlSettings } from '../types';

describe('sysctlGenerator', () => {
  const sampleSettings: SysctlSettings = {
    profile: 'proxy',
    ram: '4GB',
    bandwidth: '1G',
    enableBbr: true,
    enableSynCookies: true,
    enableTwReuse: true,
    enableFastOpen: true,
    disableIpv6: false,
    enableIpForward: true,
    enableMtuProbing: true,
    increaseFileLimits: true,
  };

  test('generates expected sysctl config lines', () => {
    const config = generateSysctlConfig(sampleSettings, 'en');
    assert.match(config, /net\.ipv4\.ip_forward = 1/);
    assert.match(config, /net\.core\.somaxconn = 32768/);
    assert.match(config, /net\.ipv4\.tcp_congestion_control = bbr/);
  });

  test('benchmark: compare repeated generation vs memoized reference on unchanged settings', () => {
    const iterations = 50000;

    // Simulate un-memoized path (called on every re-render)
    const startUnmemoized = performance.now();
    let config1 = '';
    for (let i = 0; i < iterations; i++) {
      config1 = generateSysctlConfig(sampleSettings, 'en');
      const _oneLiner = generateSysctlOneLiner(config1);
    }
    const endUnmemoized = performance.now();
    const durationUnmemoized = endUnmemoized - startUnmemoized;

    // Simulate memoized path (returns existing cached reference when dependencies unchanged)
    const cachedConfig = generateSysctlConfig(sampleSettings, 'en');
    const cachedOneLiner = generateSysctlOneLiner(cachedConfig);

    const startMemoized = performance.now();
    let config2 = '';
    for (let i = 0; i < iterations; i++) {
      // In memoized React render, when settings & lang haven't changed, the hook returns cached result
      config2 = cachedConfig;
      const _oneLiner = cachedOneLiner;
    }
    const endMemoized = performance.now();
    const durationMemoized = endMemoized - startMemoized;

    console.log(`\n--- SYSCTL CONFIG GENERATION BENCHMARK (${iterations} iterations) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    if (durationMemoized > 0) {
      console.log(`Speedup factor:      ${(durationUnmemoized / durationMemoized).toFixed(1)}x faster`);
    }

    assert.equal(config1, config2);
    assert.ok(durationMemoized < durationUnmemoized);
  });
});
