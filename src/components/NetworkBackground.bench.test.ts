import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface NodeMock {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

// Unoptimized: Allocates dynamic RGBA strings on every render frame
function drawNodesUnoptimized(nodes: NodeMock[]) {
  const ops: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const pulse = Math.sin(node.pulsePhase) * 0.35 + 0.65;

    // Inner circle
    const fill1 = `rgba(52, 211, 153, ${0.45 * pulse})`;
    ops.push(fill1);

    // Glow aura
    const fill2 = `rgba(16, 185, 129, ${0.08 * pulse})`;
    ops.push(fill2);
  }
  return ops;
}

// Optimized: Uses static color constants and numeric globalAlpha without string allocation
const NODE_INNER_COLOR = '#34d399';
const NODE_AURA_COLOR = '#10b981';

function drawNodesOptimized(nodes: NodeMock[]) {
  const ops: { fill: string; alpha: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const pulse = Math.sin(node.pulsePhase) * 0.35 + 0.65;

    // Inner circle
    ops.push({ fill: NODE_INNER_COLOR, alpha: 0.45 * pulse });

    // Glow aura
    ops.push({ fill: NODE_AURA_COLOR, alpha: 0.08 * pulse });
  }
  return ops;
}

describe('Canvas Node Alpha Animation Benchmark', () => {
  const sampleNodes: NodeMock[] = Array.from({ length: 50 }, (_, i) => ({
    x: i * 20,
    y: i * 15,
    radius: 2,
    pulsePhase: i * 0.1,
  }));

  it('benchmark: string allocation vs numeric globalAlpha across 10,000 animation frames', () => {
    const frames = 10000;

    // Warmup
    for (let i = 0; i < 100; i++) {
      drawNodesUnoptimized(sampleNodes);
      drawNodesOptimized(sampleNodes);
    }

    const startUnoptimized = performance.now();
    for (let f = 0; f < frames; f++) {
      drawNodesUnoptimized(sampleNodes);
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    const startOptimized = performance.now();
    for (let f = 0; f < frames; f++) {
      drawNodesOptimized(sampleNodes);
    }
    const durationOptimized = performance.now() - startOptimized;

    const speedupPct = (((durationUnoptimized - durationOptimized) / durationUnoptimized) * 100).toFixed(2);
    console.log(`\n--- CANVAS NODE ALPHA BENCHMARK (${frames} frames) ---`);
    console.log(`Unoptimized (template strings): ${durationUnoptimized.toFixed(3)} ms`);
    console.log(`Optimized (numeric globalAlpha): ${durationOptimized.toFixed(3)} ms`);
    console.log(`Improvement:                    ${speedupPct}%\n`);

    assert.ok(
      durationOptimized <= durationUnoptimized + 2,
      'Numeric globalAlpha should be faster or equal to string template allocation'
    );
  });
});
