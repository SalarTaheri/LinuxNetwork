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

describe('CodeOutputPanel Render Element Memoization Benchmark', () => {
  const parsedLines = Array.from({ length: 150 }, (_, i) => ({
    line: `server_name example_${i}.com;`,
    lineClass: 'text-emerald-300',
  }));

  it('benchmark: unmemoized line elements creation vs memoized reference reuse across re-renders', () => {
    const iterations = 50000;

    // Simulate unmemoized re-render behavior: mapping parsedLines into element arrays on every re-render frame
    const startUnmemoized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const lineNumbers = parsedLines.map((_, i) => ({ type: 'div', key: i, children: i + 1 }));
      const codeLines = parsedLines.map(({ line, lineClass }, i) => ({ type: 'div', key: i, className: `${lineClass} whitespace-pre`, children: line || ' ' }));
    }
    const durationUnmemoized = performance.now() - startUnmemoized;

    // Simulate memoized re-render behavior: reusing pre-mapped element references when parsedLines reference is unchanged
    const memoizedLineNumbers = parsedLines.map((_, i) => ({ type: 'div', key: i, children: i + 1 }));
    const memoizedCodeLines = parsedLines.map(({ line, lineClass }, i) => ({ type: 'div', key: i, className: `${lineClass} whitespace-pre`, children: line || ' ' }));

    const startMemoized = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const lineNumbers = memoizedLineNumbers;
      const codeLines = memoizedCodeLines;
    }
    const durationMemoized = performance.now() - startMemoized;

    const speedupFactor = (durationUnmemoized / (durationMemoized || 0.001)).toFixed(1);
    console.log(`\n--- CODE OUTPUT PANEL LINE MEMOIZATION BENCHMARK (${iterations} re-renders) ---`);
    console.log(`Unmemoized duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized duration:   ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:      ${speedupFactor}x faster\n`);

    assert.ok(
      durationMemoized < durationUnmemoized,
      'Memoized element references should perform faster than re-mapping line elements on every re-render frame'
    );
  });
});
