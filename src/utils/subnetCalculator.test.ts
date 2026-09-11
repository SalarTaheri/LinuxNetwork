import { describe, expect, it } from 'vitest';
import { getIpClass } from './subnetCalculator';

describe('getIpClass', () => {
  it('should return "Class A" for first octet between 1 and 126', () => {
    expect(getIpClass(1)).toBe('Class A');
    expect(getIpClass(10)).toBe('Class A');
    expect(getIpClass(126)).toBe('Class A');
  });

  it('should return "Class A (Loopback)" for first octet equal to 127', () => {
    expect(getIpClass(127)).toBe('Class A (Loopback)');
  });

  it('should return "Class B" for first octet between 128 and 191', () => {
    expect(getIpClass(128)).toBe('Class B');
    expect(getIpClass(172)).toBe('Class B');
    expect(getIpClass(191)).toBe('Class B');
  });

  it('should return "Class C" for first octet between 192 and 223', () => {
    expect(getIpClass(192)).toBe('Class C');
    expect(getIpClass(198)).toBe('Class C');
    expect(getIpClass(223)).toBe('Class C');
  });

  it('should return "Class D (Multicast)" for first octet between 224 and 239', () => {
    expect(getIpClass(224)).toBe('Class D (Multicast)');
    expect(getIpClass(230)).toBe('Class D (Multicast)');
    expect(getIpClass(239)).toBe('Class D (Multicast)');
  });

  it('should return "Class E (Experimental)" for first octet between 240 and 255', () => {
    expect(getIpClass(240)).toBe('Class E (Experimental)');
    expect(getIpClass(250)).toBe('Class E (Experimental)');
    expect(getIpClass(255)).toBe('Class E (Experimental)');
  });

  it('should return "Unknown" for octets outside the valid 1-255 range', () => {
    expect(getIpClass(0)).toBe('Unknown');
    expect(getIpClass(-1)).toBe('Unknown');
    expect(getIpClass(256)).toBe('Unknown');
    expect(getIpClass(1000)).toBe('Unknown');
  });
});
