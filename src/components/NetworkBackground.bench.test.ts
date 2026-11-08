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

interface MockCanvasContext {
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  strokeCount: number;
  colorStringAllocations: number;
}

function createMockCanvasContext(): MockCanvasContext {
  return {
    strokeCount: 0,
    colorStringAllocations: 0,
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      this.strokeCount++;
    },
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  };
}

function simulateUnbatchedDraw(ctx: MockCanvasContext, edges: Edge[]): void {
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

// Reusable buckets to avoid per-frame allocations
const reusableBuckets: Edge[][] = [[], [], [], [], []];
const bucketAlphas = [0.04, 0.08, 0.12, 0.16, 0.20];

function simulateBatchedDraw(ctx: MockCanvasContext, edges: Edge[]): void {
  for (let b = 0; b < 5; b++) {
    reusableBuckets[b].length = 0;
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    reusableBuckets[bucketIndex].push(edge);
  }

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 0.8;

  for (let b = 0; b < 5; b++) {
    const bucket = reusableBuckets[b];
    if (bucket.length === 0) continue;

    ctx.globalAlpha = bucketAlphas[b];
    ctx.beginPath();
    for (let idx = 0; idx < bucket.length; idx++) {
      const edge = bucket[idx];
      ctx.moveTo(edge.n1.x, edge.n1.y);
      ctx.lineTo(edge.n2.x, edge.n2.y);
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

    const unbatchedCtx = createMockCanvasContext();
    simulateUnbatchedDraw(unbatchedCtx, edges);

    const batchedCtx = createMockCanvasContext();
    simulateBatchedDraw(batchedCtx, edges);

    assert.equal(unbatchedCtx.strokeCount, 100);
    assert.equal(unbatchedCtx.colorStringAllocations, 100);
    assert.ok(batchedCtx.strokeCount <= 5);
    assert.equal(batchedCtx.colorStringAllocations, 0);
  });

  it('benchmark: compare unbatched vs batched rendering simulation', () => {
    const frames = 3000;
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        n1: { x: Math.random() * 1920, y: Math.random() * 1080 },
        n2: { x: Math.random() * 1920, y: Math.random() * 1080 },
        alpha: Math.random() * 0.2,
      });
    }

    const mockCtx = createMockCanvasContext();

    // Warmup to stabilize JIT optimization
    for (let f = 0; f < 50; f++) {
      simulateUnbatchedDraw(mockCtx, edgesPerFrame);
      simulateBatchedDraw(mockCtx, edgesPerFrame);
    }

    const startUnbatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateUnbatchedDraw(mockCtx, edgesPerFrame);
    }
    const durationUnbatched = performance.now() - startUnbatched;

    const startBatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateBatchedDraw(mockCtx, edgesPerFrame);
    }
    const durationBatched = performance.now() - startBatched;

    const speedupPct = (((durationUnbatched - durationBatched) / durationUnbatched) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Unbatched duration: ${durationUnbatched.toFixed(3)} ms`);
    console.log(`Batched duration:   ${durationBatched.toFixed(3)} ms`);
    console.log(`Speedup:            ${speedupPct}%\n`);

    assert.ok(durationBatched < durationUnbatched, 'Batched canvas rendering should be faster than unbatched');
  });
});
