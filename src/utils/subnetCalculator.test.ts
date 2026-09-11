import { describe, it, expect } from 'vitest';
import { getIpScope } from './subnetCalculator';

describe('getIpScope', () => {
  it('identifies RFC 1918 10.0.0.0/8 private IP addresses', () => {
    expect(getIpScope('10.0.0.1')).toBe('RFC 1918 Private (10.0.0.0/8)');
    expect(getIpScope('10.255.255.255')).toBe('RFC 1918 Private (10.0.0.0/8)');
  });

  it('identifies RFC 1918 172.16.0.0/12 private IP addresses and boundary conditions', () => {
    expect(getIpScope('172.16.0.0')).toBe('RFC 1918 Private (172.16.0.0/12)');
    expect(getIpScope('172.31.255.255')).toBe('RFC 1918 Private (172.16.0.0/12)');
    expect(getIpScope('172.15.255.255')).toBe('Global Public Unicast');
    expect(getIpScope('172.32.0.0')).toBe('Global Public Unicast');
  });

  it('identifies RFC 1918 192.168.0.0/16 private IP addresses and boundary conditions', () => {
    expect(getIpScope('192.168.0.1')).toBe('RFC 1918 Private (192.168.0.0/16)');
    expect(getIpScope('192.168.255.255')).toBe('RFC 1918 Private (192.168.0.0/16)');
    expect(getIpScope('192.167.255.255')).toBe('Global Public Unicast');
    expect(getIpScope('192.169.0.0')).toBe('Global Public Unicast');
  });

  it('identifies RFC 1122 loopback IP addresses', () => {
    expect(getIpScope('127.0.0.1')).toBe('RFC 1122 Loopback (127.0.0.0/8)');
    expect(getIpScope('127.255.255.254')).toBe('RFC 1122 Loopback (127.0.0.0/8)');
  });

  it('identifies RFC 3927 link-local (APIPA) IP addresses', () => {
    expect(getIpScope('169.254.1.1')).toBe('RFC 3927 Link-Local (APIPA)');
    expect(getIpScope('169.253.255.255')).toBe('Global Public Unicast');
    expect(getIpScope('169.255.0.0')).toBe('Global Public Unicast');
  });

  it('identifies RFC 6598 Carrier-Grade NAT (CGNAT) IP addresses and boundary conditions', () => {
    expect(getIpScope('100.64.0.1')).toBe('RFC 6598 Carrier-Grade NAT (CGNAT)');
    expect(getIpScope('100.127.255.255')).toBe('RFC 6598 Carrier-Grade NAT (CGNAT)');
    expect(getIpScope('100.63.255.255')).toBe('Global Public Unicast');
    expect(getIpScope('100.128.0.0')).toBe('Global Public Unicast');
  });

  it('identifies multicast IP addresses', () => {
    expect(getIpScope('224.0.0.1')).toBe('Multicast');
    expect(getIpScope('239.255.255.255')).toBe('Multicast');
  });

  it('identifies reserved and experimental IP addresses', () => {
    expect(getIpScope('240.0.0.1')).toBe('Reserved / Experimental');
    expect(getIpScope('255.255.255.255')).toBe('Reserved / Experimental');
  });

  it('identifies global public unicast IP addresses', () => {
    expect(getIpScope('8.8.8.8')).toBe('Global Public Unicast');
    expect(getIpScope('1.1.1.1')).toBe('Global Public Unicast');
  });
});
