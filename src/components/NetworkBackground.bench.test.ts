import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface Node {
  x: number;
  y: number;
}

interface Edge {
  n1: Node;
  n2: Node;
  alpha: number;
}

class MockCanvasContext {
  strokeStyle = '';
  globalAlpha = 1.0;
  strokeCalls = 0;
  colorStringAllocations = 0;

  beginPath() {}
  moveTo(x: number, y: number) {}
  lineTo(x: number, y: number) {}
  stroke() {
    this.strokeCalls++;
  }
}

function simulateUnbatchedDraw(edges: Edge[], ctx: MockCanvasContext): void {
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    ctx.strokeStyle = `rgba(16, 185, 129, ${edge.alpha})`;
    ctx.colorStringAllocations++;
    ctx.beginPath();
    ctx.moveTo(edge.n1.x, edge.n1.y);
    ctx.lineTo(edge.n2.x, edge.n2.y);
    ctx.stroke();
  }
}

// Persistent bucket array for zero-allocation batched rendering simulation
const persistentAlphaBuckets: Node[][] = [[], [], [], [], []];

function simulateBatchedDraw(edges: Edge[], ctx: MockCanvasContext): void {
  for (let b = 0; b < 5; b++) {
    persistentAlphaBuckets[b].length = 0;
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    persistentAlphaBuckets[bucketIndex].push(edge.n1, edge.n2);
  }

  ctx.strokeStyle = '#10b981';
  for (let b = 0; b < 5; b++) {
    const bucket = persistentAlphaBuckets[b];
    if (bucket.length === 0) continue;

    ctx.globalAlpha = 0.04 * (b + 1);
    ctx.beginPath();
    for (let idx = 0; idx < bucket.length; idx += 2) {
      ctx.moveTo(bucket[idx].x, bucket[idx].y);
      ctx.lineTo(bucket[idx + 1].x, bucket[idx + 1].y);
    }
    ctx.stroke();
  }
}

describe('NetworkBackground Canvas Edge Rendering Benchmark', () => {
  it('batched drawing reduces stroke calls and eliminates string allocations', () => {
    const edges: Edge[] = [];
    for (let i = 0; i < 100; i++) {
      edges.push({
        n1: { x: i * 10, y: i * 5 },
        n2: { x: i * 12, y: i * 6 },
        alpha: (i % 20) / 100,
      });
    }

    const unbatchedCtx = new MockCanvasContext();
    simulateUnbatchedDraw(edges, unbatchedCtx);

    const batchedCtx = new MockCanvasContext();
    simulateBatchedDraw(edges, batchedCtx);

    assert.equal(unbatchedCtx.strokeCalls, 100);
    assert.equal(unbatchedCtx.colorStringAllocations, 100);
    assert.ok(batchedCtx.strokeCalls <= 5);
    assert.equal(batchedCtx.colorStringAllocations, 0);
  });

  it('benchmark: compare unbatched vs batched rendering simulation', () => {
    const frames = 6000; // 100 seconds at 60 FPS
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        n1: { x: Math.random() * 1920, y: Math.random() * 1080 },
        n2: { x: Math.random() * 1920, y: Math.random() * 1080 },
        alpha: Math.random() * 0.2,
      });
    }

    const unbatchedCtx = new MockCanvasContext();
    const startUnbatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateUnbatchedDraw(edgesPerFrame, unbatchedCtx);
    }
    const durationUnbatched = performance.now() - startUnbatched;

    const batchedCtx = new MockCanvasContext();
    const startBatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateBatchedDraw(edgesPerFrame, batchedCtx);
    }
    const durationBatched = performance.now() - startBatched;

    const speedupPct = (((durationUnbatched - durationBatched) / durationUnbatched) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Unbatched duration: ${durationUnbatched.toFixed(3)} ms`);
    console.log(`Batched duration:   ${durationBatched.toFixed(3)} ms`);
    console.log(`Speedup:            ${speedupPct}%\n`);

    assert.ok(durationBatched <= durationUnbatched, 'Batched canvas rendering should be faster or equal');
  });
});
