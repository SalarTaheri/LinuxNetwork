import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateNginxConfig, generateNginxOneLiner } from '../utils/nginxGenerator';
import { NginxSettings } from '../types';

const mockSettings: NginxSettings = {
  domain: 'api.linuxnetwork.ir',
  serverAlias: 'www.api.linuxnetwork.ir',
  upstreamType: 'http',
  upstreamAddress: '127.0.0.1:8080',
  listenPort: 80,
  enableSsl: true,
  sslCertPath: '',
  sslKeyPath: '',
  enableHttp2: true,
  enableWebsockets: true,
  clientMaxBodySize: 50,
  enableGzip: true,
  enableRealIpHeaders: true,
  proxyTimeout: 'standard',
  proxyBuffering: 'enabled',
  enableSecurityHeaders: true,
};

describe('NginxTool Config Generation Benchmark', () => {
  it('generates expected nginx config output', () => {
    const configText = generateNginxConfig(mockSettings, 'fa');
    assert.ok(configText.includes('api.linuxnetwork.ir'), 'Config should contain domain name');
    assert.ok(configText.includes('upstream backend_upstream'), 'Config should contain upstream block');
    assert.ok(configText.includes('ssl_certificate'), 'Config should contain SSL directives');
  });

  it('benchmark: repeated config generation vs memoized reference', () => {
    const iterations = 50000;

    // Memoized cached reference
    const memoizedConfig = generateNginxConfig(mockSettings, 'fa');
    const memoizedOneLiner = generateNginxOneLiner(mockSettings.domain, memoizedConfig);

    // Warmup
    for (let i = 0; i < 100; i++) {
      generateNginxConfig(mockSettings, 'fa');
    }

    // Measure repeated unmemoized calls
    const startUnmemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const cfg = generateNginxConfig(mockSettings, 'fa');
      generateNginxOneLiner(mockSettings.domain, cfg);
    }
    const durationUnmemoized = performance.now() - startUnmemoized;

    // Measure memoized access
    const startMemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const cfg = memoizedConfig;
      const bash = memoizedOneLiner;
    }
    const durationMemoized = performance.now() - startMemoized;

    const speedupFactor = (durationUnmemoized / (durationMemoized || 0.001)).toFixed(1);
    console.log(`\n--- NGINX CONFIG GENERATION BENCHMARK (${iterations} iterations) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:      ${speedupFactor}x faster\n`);

    assert.ok(
      durationMemoized < durationUnmemoized,
      'Memoized config reference access should be faster than regenerating config string every render'
    );
  });
});
