import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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

export function classifyLineOptimized(line: string): string {
  const trimmed = line.trim();
  const isComment = trimmed.startsWith('#') || trimmed.startsWith('//');
  const isSectionHeader = trimmed.startsWith('[') && trimmed.endsWith(']');
  const isDirective = /^(listen|server_name|proxy_|ssl_|add_header|client_|net\.|fs\.)/.test(trimmed);
  const isCommand = trimmed.startsWith('sudo') || trimmed.startsWith('sysctl') || trimmed.startsWith('nginx');

  if (isComment) return 'text-slate-500 italic';
  if (isSectionHeader) return 'text-amber-400 font-bold';
  if (isDirective) return 'text-emerald-300';
  if (isCommand) return 'text-cyan-300 font-semibold';
  return 'text-slate-200';
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
