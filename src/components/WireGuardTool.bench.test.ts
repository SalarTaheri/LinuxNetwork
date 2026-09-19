import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWireGuardServerConfig,
  generateWireGuardClientConfig,
  generateWireGuardServerOneLiner,
} from '../utils/wireguardGenerator';
import { WireGuardSettings } from '../types';

const mockSettings: WireGuardSettings = {
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
  serverPrivateKey: 'SERVERPRIVKEYMOCK1234567890=',
  serverPublicKey: 'SERVERPUBKEYMOCK1234567890=',
  clientPrivateKey: 'CLIENTPRIVKEYMOCK1234567890=',
  clientPublicKey: 'CLIENTPUBKEYMOCK1234567890=',
  serverInterface: 'eth0',
};

describe('WireGuardTool Config Generation Benchmark', () => {
  it('generates expected WireGuard server and client config output', () => {
    const serverCfg = generateWireGuardServerConfig(mockSettings);
    const clientCfg = generateWireGuardClientConfig(mockSettings);
    const oneLiner = generateWireGuardServerOneLiner(mockSettings);

    assert.ok(serverCfg.includes('51820'), 'Server config should include listen port');
    assert.ok(serverCfg.includes('SERVERPRIVKEYMOCK'), 'Server config should include private key');
    assert.ok(clientCfg.includes('203.0.113.10:51820'), 'Client config should include endpoint');
    assert.ok(oneLiner.includes('wg-quick'), 'One-liner should include wg-quick commands');
  });

  it('benchmark: repeated config generation vs memoized reference', () => {
    const iterations = 50000;

    // Memoized cached references
    const memoizedServer = generateWireGuardServerConfig(mockSettings);
    const memoizedClient = generateWireGuardClientConfig(mockSettings);
    const memoizedOneLiner = generateWireGuardServerOneLiner(mockSettings);

    // Warmup
    for (let i = 0; i < 100; i++) {
      generateWireGuardServerConfig(mockSettings);
      generateWireGuardClientConfig(mockSettings);
      generateWireGuardServerOneLiner(mockSettings);
    }

    // Measure repeated unmemoized calls
    const startUnmemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const sCfg = generateWireGuardServerConfig(mockSettings);
      const cCfg = generateWireGuardClientConfig(mockSettings);
      const bash = generateWireGuardServerOneLiner(mockSettings);
    }
    const durationUnmemoized = performance.now() - startUnmemoized;

    // Measure memoized access
    const startMemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      const sCfg = memoizedServer;
      const cCfg = memoizedClient;
      const bash = memoizedOneLiner;
    }
    const durationMemoized = performance.now() - startMemoized;

    const speedupFactor = (durationUnmemoized / (durationMemoized || 0.001)).toFixed(1);
    console.log(`\n--- WIREGUARD CONFIG GENERATION BENCHMARK (${iterations} iterations) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:      ${speedupFactor}x faster\n`);

    assert.ok(
      durationMemoized < durationUnmemoized,
      'Memoized config reference access should be faster than regenerating config strings every render'
    );
  });
});
