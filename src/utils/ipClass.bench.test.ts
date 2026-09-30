import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getIpClass } from './subnetCalculator';

function getIpClassConditional(firstOctet: number): string {
  if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
  if (firstOctet === 127) return 'Class A (Loopback)';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Experimental)';
  return 'Unknown';
}

describe('getIpClass Optimization & Benchmark', () => {
  it('O(1) static lookup table matches conditional function for all octet values 0..255', () => {
    for (let octet = -10; octet <= 270; octet++) {
      assert.equal(
        getIpClass(octet),
        getIpClassConditional(octet),
        `Mismatch for octet: ${octet}`
      );
    }
  });

  it('benchmark: compare repeated conditional checks vs O(1) static array lookup', () => {
    const iterations = 1000000;
    const testOctets: number[] = [];
    for (let i = 0; i < 256; i++) {
      testOctets.push(i);
    }

    // Warmup
    for (const oct of testOctets) {
      getIpClassConditional(oct);
      getIpClass(oct);
    }

    const startConditional = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const oct = testOctets[iter % 256];
      getIpClassConditional(oct);
    }
    const durationConditional = performance.now() - startConditional;

    const startTable = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const oct = testOctets[iter % 256];
      getIpClass(oct);
    }
    const durationTable = performance.now() - startTable;

    const speedupFactor = (durationConditional / durationTable).toFixed(2);
    console.log(`\n--- GET_IP_CLASS BENCHMARK (${iterations} iterations) ---`);
    console.log(`Conditional duration: ${durationConditional.toFixed(3)} ms`);
    console.log(`O(1) Table duration:  ${durationTable.toFixed(3)} ms`);
    console.log(`Speedup factor:       ${speedupFactor}x faster\n`);

    assert.ok(
      durationTable <= durationConditional + 5,
      'O(1) lookup table should perform equal to or faster than conditional checks'
    );
  });
});
