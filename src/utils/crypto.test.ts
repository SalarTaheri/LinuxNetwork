import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateWireGuardKeyPair, uint8ToBase64 } from './crypto';

describe('Crypto Utils', () => {
  it('generates a valid WireGuard key pair', () => {
    const keyPair = generateWireGuardKeyPair();
    assert.ok(keyPair.privateKey, 'privateKey should be present');
    assert.ok(keyPair.publicKey, 'publicKey should be present');
    assert.equal(typeof keyPair.privateKey, 'string');
    assert.equal(typeof keyPair.publicKey, 'string');

    // WireGuard 32-byte keys encoded in Base64 are 44 characters ending with '='
    assert.equal(keyPair.privateKey.length, 44);
    assert.equal(keyPair.publicKey.length, 44);
    assert.ok(keyPair.privateKey.endsWith('='));
    assert.ok(keyPair.publicKey.endsWith('='));
  });

  it('generates unique key pairs on each call', () => {
    const kp1 = generateWireGuardKeyPair();
    const kp2 = generateWireGuardKeyPair();
    assert.notEqual(kp1.privateKey, kp2.privateKey);
    assert.notEqual(kp1.publicKey, kp2.publicKey);
  });

  it('correctly encodes Uint8Array to base64 for small and large arrays', () => {
    const bytesSmall = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    assert.equal(uint8ToBase64(bytesSmall), 'SGVsbG8=');

    // Array larger than chunk size (0x8000 = 32768)
    const largeSize = 40000;
    const bytesLarge = new Uint8Array(largeSize);
    for (let i = 0; i < largeSize; i++) {
      bytesLarge[i] = i % 256;
    }
    const result = uint8ToBase64(bytesLarge);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
});
