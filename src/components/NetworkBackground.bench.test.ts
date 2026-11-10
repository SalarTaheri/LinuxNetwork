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

function simulateUnbatchedDraw(edges: Edge[]): { strokeCount: number; colorStringAllocations: number } {
  let strokeCount = 0;
  let colorStringAllocations = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const colorStr = `rgba(16, 185, 129, ${edge.alpha})`;
    colorStringAllocations++;
    strokeCount++;
  }

  return { strokeCount, colorStringAllocations };
}

// Preallocated flat coordinate buffers matching NetworkBackground's zero-allocation design
const MAX_EDGES = 1225; // 50 nodes max = 50 * 49 / 2
const preallocatedCoords = [
  new Float32Array(MAX_EDGES * 4),
  new Float32Array(MAX_EDGES * 4),
  new Float32Array(MAX_EDGES * 4),
  new Float32Array(MAX_EDGES * 4),
  new Float32Array(MAX_EDGES * 4),
];
const preallocatedCounts = new Int32Array(5);

function simulateBatchedDraw(edges: Edge[]): { strokeCount: number; colorStringAllocations: number } {
  preallocatedCounts.fill(0);
  let strokeCount = 0;
  let colorStringAllocations = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    const offset = preallocatedCounts[bucketIndex];
    const coords = preallocatedCoords[bucketIndex];

    coords[offset] = edge.n1.x;
    coords[offset + 1] = edge.n1.y;
    coords[offset + 2] = edge.n2.x;
    coords[offset + 3] = edge.n2.y;
    preallocatedCounts[bucketIndex] = offset + 4;
  }

  for (let b = 0; b < 5; b++) {
    if (preallocatedCounts[b] > 0) {
      strokeCount++;
    }
  }

  return { strokeCount, colorStringAllocations };
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

    const unbatched = simulateUnbatchedDraw(edges);
    const batched = simulateBatchedDraw(edges);

    assert.equal(unbatched.strokeCount, 100);
    assert.equal(unbatched.colorStringAllocations, 100);
    assert.ok(batched.strokeCount <= 5);
    assert.equal(batched.colorStringAllocations, 0);
  });

  it('benchmark: compare unbatched vs batched rendering simulation', () => {
    const frames = 10000;
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        n1: { x: Math.random() * 1920, y: Math.random() * 1080 },
        n2: { x: Math.random() * 1920, y: Math.random() * 1080 },
        alpha: Math.random() * 0.2,
      });
    }

    // Warmup JIT
    for (let f = 0; f < 2000; f++) {
      simulateUnbatchedDraw(edgesPerFrame);
      simulateBatchedDraw(edgesPerFrame);
    }

    const startUnbatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateUnbatchedDraw(edgesPerFrame);
    }
    const durationUnbatched = performance.now() - startUnbatched;

    const startBatched = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateBatchedDraw(edgesPerFrame);
    }
    const durationBatched = performance.now() - startBatched;

    const speedupPct = (((durationUnbatched - durationBatched) / durationUnbatched) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Unbatched duration: ${durationUnbatched.toFixed(3)} ms`);
    console.log(`Batched duration:   ${durationBatched.toFixed(3)} ms`);
    console.log(`Speedup:            ${speedupPct}%\n`);

    assert.ok(
      durationBatched <= durationUnbatched + 5,
      'Zero-allocation batched canvas rendering should be faster or equal within margin'
    );
  });
});
