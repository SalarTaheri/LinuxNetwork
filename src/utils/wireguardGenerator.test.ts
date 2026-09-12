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

  it('generates multi-distro server one-liner supporting dnf, yum, and apt-get', () => {
    const oneLiner = generateWireGuardServerOneLiner(dummySettings);
    assert.ok(oneLiner.includes('command -v dnf'), 'should check for dnf');
    assert.ok(oneLiner.includes('wireguard-tools'), 'should install wireguard-tools on Red Hat');
    assert.ok(oneLiner.includes('command -v yum'), 'should check for yum');
    assert.ok(oneLiner.includes('command -v apt-get'), 'should check for apt-get');
    assert.ok(oneLiner.includes('systemctl enable wg-quick@wg0'), 'should enable systemd service');
  });
});
