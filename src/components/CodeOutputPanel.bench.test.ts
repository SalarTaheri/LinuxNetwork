import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLineOptimized } from './CodeOutputPanel';

function classifyLineUnoptimized(line: string): string {
  const isComment = line.trim().startsWith('#') || line.trim().startsWith('//');
  const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
  const isDirective = /^(listen|server_name|proxy_|ssl_|add_header|client_|net\.|fs\.)/.test(line.trim());
  const isCommand = line.trim().startsWith('sudo') || line.trim().startsWith('sysctl') || line.trim().startsWith('nginx');

  let lineClass = 'text-slate-200';
  if (isComment) lineClass = 'text-slate-500 italic';
  else if (isSectionHeader) lineClass = 'text-amber-400 font-bold';
  else if (isDirective) lineClass = 'text-emerald-300';
  else if (isCommand) lineClass = 'text-cyan-300 font-semibold';
  return lineClass;
}

describe('CodeOutputPanel Line Classification', () => {
  const sampleLines = [
    '   # This is a comment line   ',
    '// Another comment line',
    '   [Interface]   ',
    'listen 80;',
    'server_name example.com;',
    'proxy_pass http://localhost:8080;',
    'ssl_certificate /etc/ssl/cert.pem;',
    'add_header X-Frame-Options SAMEORIGIN;',
    'client_max_body_size 10M;',
    'net.ipv4.ip_forward = 1',
    'fs.file-max = 2097152',
    'sudo sysctl -p',
    'sysctl -w net.ipv4.tcp_fastopen=3',
    'nginx -t',
    '   worker_processes auto;   ',
    '   events { worker_connections 1024; }   ',
    '   ',
    'some random line of text'
  ];

  it('optimized and unoptimized produce identical results', () => {
    for (const line of sampleLines) {
      assert.equal(classifyLineOptimized(line), classifyLineUnoptimized(line), `Mismatch for line: ${line}`);
    }
  });

  it('benchmark performance comparison', () => {
    // Generate a large set of lines (e.g. 50,000 lines)
    const largeDataset: string[] = [];
    for (let i = 0; i < 5000; i++) {
      largeDataset.push(...sampleLines);
    } // 90,000 lines total

    // Warmup
    for (const l of sampleLines) {
      classifyLineUnoptimized(l);
      classifyLineOptimized(l);
    }

    const iterations = 10;

    const startUnoptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < largeDataset.length; i++) {
        classifyLineUnoptimized(largeDataset[i]);
      }
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    const startOptimized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < largeDataset.length; i++) {
        classifyLineOptimized(largeDataset[i]);
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    const speedupPct = (((durationUnoptimized - durationOptimized) / durationUnoptimized) * 100).toFixed(2);
    console.log(`Unoptimized duration: ${durationUnoptimized.toFixed(2)}ms`);
    console.log(`Optimized duration:   ${durationOptimized.toFixed(2)}ms`);
    console.log(`Speedup:               ${speedupPct}%`);

    assert.ok(durationOptimized <= durationUnoptimized, 'Optimized version should be faster or equal');
  });
});

describe('CodeOutputPanel Element Mapping Benchmark', () => {
  const parsedLines = Array.from({ length: 500 }, (_, i) => ({
    line: `net.ipv4.tcp_rmem = 4096 87380 67108864 # Line ${i + 1}`,
    lineClass: 'text-emerald-300',
  }));

  function unmemoizedRenderElements(lines: typeof parsedLines) {
    const numbers = lines.map((_, i) => ({ type: 'div', key: i, props: { children: i + 1 } }));
    const code = lines.map(({ line, lineClass }, i) => ({ type: 'div', key: i, props: { className: lineClass, children: line } }));
    return { numbers, code };
  }

  function memoizedRenderElements(lines: typeof parsedLines, cached?: { numbers: any; code: any }) {
    if (cached) return cached;
    const numbers = lines.map((_, i) => ({ type: 'div', key: i, props: { children: i + 1 } }));
    const code = lines.map(({ line, lineClass }, i) => ({ type: 'div', key: i, props: { className: lineClass, children: line } }));
    return { numbers, code };
  }

  it('benchmark: repeated unmemoized element mapping vs memoized reference on panel re-renders', () => {
    const reRenders = 10_000;

    // Warmup
    unmemoizedRenderElements(parsedLines);
    memoizedRenderElements(parsedLines);

    // Unmemoized (maps on every re-render)
    const startUnmemoized = performance.now();
    for (let i = 0; i < reRenders; i++) {
      unmemoizedRenderElements(parsedLines);
    }
    const durationUnmemoized = performance.now() - startUnmemoized;

    // Memoized (cached across re-renders when lines unchanged)
    const cachedElements = memoizedRenderElements(parsedLines);
    const startMemoized = performance.now();
    for (let i = 0; i < reRenders; i++) {
      memoizedRenderElements(parsedLines, cachedElements);
    }
    const durationMemoized = performance.now() - startMemoized;

    const diffMs = durationUnmemoized - durationMemoized;
    const speedupFactor = durationMemoized > 0 ? (durationUnmemoized / durationMemoized).toFixed(1) : '∞';

    console.log(`\n--- CODE OUTPUT PANEL LINE MAPPING BENCHMARK (${reRenders} re-renders) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:      ${speedupFactor}x faster\n`);

    assert.ok(durationMemoized <= durationUnmemoized, 'Memoized reference should avoid repeated allocations');
  });
});
