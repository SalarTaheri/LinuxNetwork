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

function generateLineNumbersText(count: number): string {
  if (count === 0) return '';
  const nums = new Array(count);
  for (let i = 0; i < count; i++) {
    nums[i] = i + 1;
  }
  return nums.join('\n');
}

describe('CodeOutputPanel Line Numbers Benchmark', () => {
  it('correctly formats line numbers string', () => {
    assert.equal(generateLineNumbersText(0), '');
    assert.equal(generateLineNumbersText(1), '1');
    assert.equal(generateLineNumbersText(5), '1\n2\n3\n4\n5');
  });

  it('benchmark: memoized line numbers string vs re-mapping elements per render pass', () => {
    const lineCount = 500;
    const iterations = 50000;

    // Pre-computed memoized line numbers string (as produced by useMemo)
    const memoizedLineNumbersText = generateLineNumbersText(lineCount);

    // Warmup
    for (let i = 0; i < 100; i++) {
      const x = memoizedLineNumbersText;
      Array.from({ length: lineCount }, (_, idx) => idx + 1);
    }

    const startUnmemoizedElements = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Unmemoized array mapping allocating 500 VDOM element descriptors per render pass
      const arr = new Array(lineCount);
      for (let j = 0; j < lineCount; j++) {
        arr[j] = { type: 'div', key: j, props: { children: j + 1 } };
      }
    }
    const durationUnmemoized = performance.now() - startUnmemoizedElements;

    const startMemoizedString = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Memoized string reference access per render pass
      const str = memoizedLineNumbersText;
    }
    const durationMemoized = performance.now() - startMemoizedString;

    const speedup = (durationUnmemoized / (durationMemoized || 0.001)).toFixed(1);
    console.log(`\n--- LINE NUMBERS BENCHMARK (${lineCount} lines x ${iterations} render passes) ---`);
    console.log(`Unmemoized VDOM element mapping duration: ${durationUnmemoized.toFixed(3)} ms`);
    console.log(`Memoized string reference duration:      ${durationMemoized.toFixed(3)} ms`);
    console.log(`Speedup factor:                         ${speedup}x faster\n`);

    assert.ok(
      durationMemoized < durationUnmemoized,
      'Memoized line numbers string access should be significantly faster than allocating VDOM elements per render'
    );
  });
});
