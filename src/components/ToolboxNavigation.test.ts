import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ToolTab, ToolCategory } from '../types';

interface ToolMeta {
  id: ToolTab;
  category: Exclude<ToolCategory, 'all'>;
  keywords: string[];
}

const toolsRegistry: ToolMeta[] = [
  { id: 'setup', category: 'server', keywords: ['bbr', 'docker', 'ssh', 'fail2ban'] },
  { id: 'sysctl', category: 'server', keywords: ['bbr', 'kernel', 'tcp', 'tuning'] },
  { id: 'nginx', category: 'security', keywords: ['ssl', 'proxy', 'websocket', 'http3'] },
  { id: 'wireguard', category: 'security', keywords: ['vpn', 'tunnel', 'crypto', 'qr'] },
  { id: 'subnet', category: 'network', keywords: ['cidr', 'ip', 'netmask', 'broadcast'] },
  { id: 'routing', category: 'network', keywords: ['nat', 'iptables', 'dnat', 'hairpin', 'docker'] },
];

describe('Toolbox Navigation & Categorization', () => {
  test('all tools are assigned to valid domain categories', () => {
    const validCategories = new Set(['server', 'network', 'security']);
    for (const tool of toolsRegistry) {
      assert.ok(validCategories.has(tool.category), `Invalid category for ${tool.id}`);
    }
  });

  test('filters tools correctly by category', () => {
    const serverTools = toolsRegistry.filter((t) => t.category === 'server');
    assert.strictEqual(serverTools.length, 2);
    assert.deepStrictEqual(serverTools.map((t) => t.id), ['setup', 'sysctl']);

    const networkTools = toolsRegistry.filter((t) => t.category === 'network');
    assert.strictEqual(networkTools.length, 2);
    assert.deepStrictEqual(networkTools.map((t) => t.id), ['subnet', 'routing']);

    const securityTools = toolsRegistry.filter((t) => t.category === 'security');
    assert.strictEqual(securityTools.length, 2);
    assert.deepStrictEqual(securityTools.map((t) => t.id), ['nginx', 'wireguard']);
  });

  test('search matching finds relevant tools by keywords', () => {
    const searchByQuery = (q: string) => {
      const query = q.toLowerCase();
      return toolsRegistry.filter(
        (t) => t.id.includes(query) || t.keywords.some((kw) => kw.includes(query))
      ).map((t) => t.id);
    };

    assert.ok(searchByQuery('bbr').includes('setup') && searchByQuery('bbr').includes('sysctl'));
    assert.ok(searchByQuery('hairpin').includes('routing'));
    assert.ok(searchByQuery('ssl').includes('nginx'));
    assert.ok(searchByQuery('cidr').includes('subnet'));
    assert.ok(searchByQuery('docker').includes('setup') && searchByQuery('docker').includes('routing'));
  });
});
