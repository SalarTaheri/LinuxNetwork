/**
 * Pure TypeScript Curve25519 / X25519 implementation according to RFC 7748
 * Used for in-browser client-side WireGuard key generation without any external backend.
 */

// Field prime P = 2^255 - 19
const P = (1n << 255n) - 19n;
const A24 = 121665n; // (486662 - 2) / 4

function mod(n: bigint, m: bigint): bigint {
  const r = n % m;
  return r < 0n ? r + m : r;
}

// Modular inversion via Fermat's Little Theorem: a^(P-2) mod P
function modInverse(a: bigint, p: bigint): bigint {
  return modPow(a, p - 2n, p);
}

function modPow(base: bigint, exp: bigint, modP: bigint): bigint {
  let res = 1n;
  let b = base % modP;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) {
      res = (res * b) % modP;
    }
    b = (b * b) % modP;
    e >>= 1n;
  }
  return res;
}

function decodeLittleEndian(b: Uint8Array): bigint {
  let val = 0n;
  for (let i = 0; i < b.length; i++) {
    val += BigInt(b[i]) << BigInt(8 * i);
  }
  return val;
}

function encodeLittleEndian(val: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let v = val;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

/**
 * X25519 scalar multiplication of point u by scalar k (RFC 7748)
 */
function x25519(k: Uint8Array, uPoint: Uint8Array): Uint8Array {
  // Clamp scalar k
  const scalar = new Uint8Array(k);
  scalar[0] &= 248;
  scalar[31] &= 127;
  scalar[31] |= 64;

  let x1 = decodeLittleEndian(uPoint) % P;
  let x2 = 1n;
  let z2 = 0n;
  let x3 = x1;
  let z3 = 1n;
  let swap = 0;

  for (let t = 254; t >= 0; t--) {
    const byteIdx = Math.floor(t / 8);
    const bitIdx = t % 8;
    const kt = (scalar[byteIdx] >> bitIdx) & 1;

    if (swap !== kt) {
      // Conditional swap
      let temp = x2;
      x2 = x3;
      x3 = temp;
      temp = z2;
      z2 = z3;
      z3 = temp;
      swap = kt;
    }

    const A = (x2 + z2) % P;
    const AA = (A * A) % P;
    const B = (x2 - z2 + P) % P;
    const BB = (B * B) % P;
    const E = (AA - BB + P) % P;
    const C = (x3 + z3) % P;
    const D = (x3 - z3 + P) % P;
    const DA = (D * A) % P;
    const CB = (C * B) % P;

    const sumDACB = (DA + CB) % P;
    const diffDACB = (DA - CB + P) % P;
    x3 = (sumDACB * sumDACB) % P;
    z3 = (x1 * ((diffDACB * diffDACB) % P)) % P;
    x2 = (AA * BB) % P;
    z2 = (E * ((AA + (A24 * E) % P) % P)) % P;
  }

  if (swap !== 0) {
    let temp = x2;
    x2 = x3;
    x3 = temp;
    temp = z2;
    z2 = z3;
    z3 = temp;
  }

  const result = (x2 * modInverse(z2, P)) % P;
  return encodeLittleEndian(result);
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  if (bytes.length <= CHUNK_SIZE) {
    return btoa(String.fromCharCode.apply(null, bytes as unknown as number[]));
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK_SIZE) as unknown as number[]
    );
  }
  return btoa(binary);
}

export interface WireGuardKeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Generates a cryptographically secure WireGuard key pair in the browser.
 */
export function generateWireGuardKeyPair(): WireGuardKeyPair {
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);

  // Apply WireGuard clamping to private key
  privateKeyBytes[0] &= 248;
  privateKeyBytes[31] &= 127;
  privateKeyBytes[31] |= 64;

  // Base point 9 for Curve25519
  const basePoint = new Uint8Array(32);
  basePoint[0] = 9;

  const publicKeyBytes = x25519(privateKeyBytes, basePoint);

  return {
    privateKey: uint8ToBase64(privateKeyBytes),
    publicKey: uint8ToBase64(publicKeyBytes),
  };
}
