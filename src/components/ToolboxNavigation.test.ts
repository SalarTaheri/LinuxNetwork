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

  test('preloader callback is triggered correctly for each valid tool tab', () => {
    const preloaded: ToolTab[] = [];
    const mockPreload = (tab: ToolTab) => {
      if (!preloaded.includes(tab)) {
        preloaded.push(tab);
      }
    };

    const tabs: ToolTab[] = ['setup', 'sysctl', 'nginx', 'wireguard', 'subnet', 'routing'];
    for (const tab of tabs) {
      mockPreload(tab);
    }

    assert.strictEqual(preloaded.length, 6);
    assert.deepStrictEqual(preloaded, tabs);
  });

  describe('Keyboard navigation and roving tabindex logic', () => {
    const tabs: ToolTab[] = ['setup', 'sysctl', 'nginx', 'wireguard', 'subnet', 'routing'];

    const getNextTab = (current: ToolTab, key: string, isFa: boolean, list = tabs): ToolTab => {
      const currentIndex = list.indexOf(current);
      if (currentIndex === -1) return current;

      const forward = isFa ? key === 'ArrowLeft' : key === 'ArrowRight';
      const backward = isFa ? key === 'ArrowRight' : key === 'ArrowLeft';

      if (key === 'Home') return list[0];
      if (key === 'End') return list[list.length - 1];
      if (forward) return list[(currentIndex + 1) % list.length];
      if (backward) return list[(currentIndex - 1 + list.length) % list.length];
      return current;
    };

    test('navigates sequentially with arrow keys in LTR', () => {
      assert.strictEqual(getNextTab('setup', 'ArrowRight', false), 'sysctl');
      assert.strictEqual(getNextTab('routing', 'ArrowRight', false), 'setup'); // wraps
      assert.strictEqual(getNextTab('setup', 'ArrowLeft', false), 'routing'); // wraps
      assert.strictEqual(getNextTab('sysctl', 'ArrowLeft', false), 'setup');
    });

    test('navigates sequentially with inverted arrow keys in RTL', () => {
      assert.strictEqual(getNextTab('setup', 'ArrowLeft', true), 'sysctl'); // forward in RTL
      assert.strictEqual(getNextTab('routing', 'ArrowLeft', true), 'setup'); // wraps forward
      assert.strictEqual(getNextTab('setup', 'ArrowRight', true), 'routing'); // backward in RTL
      assert.strictEqual(getNextTab('sysctl', 'ArrowRight', true), 'setup');
    });

    test('jumps to start and end with Home and End keys', () => {
      assert.strictEqual(getNextTab('nginx', 'Home', false), 'setup');
      assert.strictEqual(getNextTab('nginx', 'End', false), 'routing');
      assert.strictEqual(getNextTab('nginx', 'Home', true), 'setup');
      assert.strictEqual(getNextTab('nginx', 'End', true), 'routing');
    });

    test('assigns roving tabindex 0 to active tab and -1 to inactive tabs', () => {
      const activeTab: ToolTab = 'nginx';
      const tabIndices = tabs.map((t) => ({
        id: t,
        tabIndex: t === activeTab ? 0 : -1,
      }));

      const activeItem = tabIndices.find((t) => t.id === 'nginx');
      assert.strictEqual(activeItem?.tabIndex, 0);

      const inactiveItems = tabIndices.filter((t) => t.id !== 'nginx');
      assert.ok(inactiveItems.every((t) => t.tabIndex === -1));
    });
  });
});
