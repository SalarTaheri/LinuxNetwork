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

describe('CodeOutputPanel Render Path Benchmark', () => {
  const codeBlock = Array.from({ length: 500 }, (_, i) => `server_name domain${i}.com; # comment ${i}`).join('\n');

  // Multi-pass approach (unoptimized: split -> parsedLines loop -> map 1 -> map 2)
  function parseLinesMultiPass(content: string) {
    const lines = content.split('\n');
    const len = lines.length;
    const parsed = new Array(len);
    for (let i = 0; i < len; i++) {
      parsed[i] = { line: lines[i], lineClass: classifyLineOptimized(lines[i]) };
    }
    const lineNumbers = parsed.map((_, i) => ({ type: 'div', key: i, children: i + 1 }));
    const codeLines = parsed.map(({ line, lineClass }, i) => ({ type: 'div', key: i, className: lineClass, children: line || ' ' }));
    return { lineNumbers, codeLines, count: len };
  }

  // Single-pass memoized approach (optimized)
  function parseLinesSinglePass(content: string) {
    const lines = content.split('\n');
    const len = lines.length;
    const numbers = new Array(len);
    const codeLines = new Array(len);
    for (let i = 0; i < len; i++) {
      const line = lines[i];
      const lineClass = classifyLineOptimized(line);
      numbers[i] = { type: 'div', key: i, children: i + 1 };
      codeLines[i] = { type: 'div', key: i, className: lineClass, children: line || ' ' };
    }
    return { lineNumbers: numbers, codeLines, count: len };
  }

  it('multi-pass and single-pass produce identical line counts', () => {
    const resMulti = parseLinesMultiPass(codeBlock);
    const resSingle = parseLinesSinglePass(codeBlock);
    assert.equal(resMulti.count, resSingle.count);
    assert.equal(resMulti.lineNumbers.length, resSingle.lineNumbers.length);
    assert.equal(resMulti.codeLines.length, resSingle.codeLines.length);
  });

  it('benchmark single-pass vs multi-pass rendering allocation performance', () => {
    const iterations = 5000;

    // Warmup
    for (let i = 0; i < 100; i++) {
      parseLinesMultiPass(codeBlock);
      parseLinesSinglePass(codeBlock);
    }

    const startMulti = performance.now();
    for (let i = 0; i < iterations; i++) {
      parseLinesMultiPass(codeBlock);
    }
    const multiDuration = performance.now() - startMulti;

    const startSingle = performance.now();
    for (let i = 0; i < iterations; i++) {
      parseLinesSinglePass(codeBlock);
    }
    const singleDuration = performance.now() - startSingle;

    const improvementPct = (((multiDuration - singleDuration) / multiDuration) * 100).toFixed(2);
    console.log(`\n--- CODE OUTPUT PANEL RENDER BENCHMARK (${iterations} renders) ---`);
    console.log(`Multi-pass duration:  ${multiDuration.toFixed(3)} ms`);
    console.log(`Single-pass duration: ${singleDuration.toFixed(3)} ms`);
    console.log(`Improvement:          ${improvementPct}%\n`);

    assert.ok(
      singleDuration <= multiDuration + 5,
      'Single-pass rendering pass should perform equal to or better than multi-pass mapping'
    );
  });
});
