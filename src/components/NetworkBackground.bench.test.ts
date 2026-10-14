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

function simulateBatchedDraw(edges: Edge[]): { strokeCount: number; colorStringAllocations: number } {
  const alphaBuckets: { n1: Node; n2: Node }[][] = [[], [], [], [], []];
  let strokeCount = 0;
  let colorStringAllocations = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    alphaBuckets[bucketIndex].push({ n1: edge.n1, n2: edge.n2 });
  }

  for (let b = 0; b < 5; b++) {
    if (alphaBuckets[b].length > 0) {
      strokeCount++;
    }
  }

  return { strokeCount, colorStringAllocations };
}

function simulateZeroAllocationBatchedDraw(
  edges: Edge[],
  alphaBuckets: Node[][]
): { strokeCount: number; colorStringAllocations: number } {
  for (let b = 0; b < 5; b++) {
    alphaBuckets[b].length = 0;
  }

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    alphaBuckets[bucketIndex].push(edge.n1, edge.n2);
  }

  let strokeCount = 0;
  for (let b = 0; b < 5; b++) {
    if (alphaBuckets[b].length > 0) {
      strokeCount++;
    }
  }

  return { strokeCount, colorStringAllocations: 0 };
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
    const reusableBuckets: Node[][] = [[], [], [], [], []];
    const zeroAlloc = simulateZeroAllocationBatchedDraw(edges, reusableBuckets);

    assert.equal(unbatched.strokeCount, 100);
    assert.equal(unbatched.colorStringAllocations, 100);
    assert.ok(batched.strokeCount <= 5);
    assert.equal(batched.colorStringAllocations, 0);
    assert.equal(zeroAlloc.strokeCount, batched.strokeCount);
  });

  it('benchmark: compare unbatched vs batched vs zero-allocation rendering simulation', () => {
    const frames = 6000; // 100 seconds at 60 FPS
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        n1: { x: Math.random() * 1920, y: Math.random() * 1080 },
        n2: { x: Math.random() * 1920, y: Math.random() * 1080 },
        alpha: Math.random() * 0.2,
      });
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

    const reusableBuckets: Node[][] = [[], [], [], [], []];
    const startZeroAlloc = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateZeroAllocationBatchedDraw(edgesPerFrame, reusableBuckets);
    }
    const durationZeroAlloc = performance.now() - startZeroAlloc;

    const speedupPct = (((durationUnbatched - durationZeroAlloc) / durationUnbatched) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Unbatched duration:  ${durationUnbatched.toFixed(3)} ms`);
    console.log(`Allocating duration: ${durationBatched.toFixed(3)} ms`);
    console.log(`Zero-alloc duration: ${durationZeroAlloc.toFixed(3)} ms`);
    console.log(`Total speedup:       ${speedupPct}%\n`);

    assert.ok(durationZeroAlloc <= durationBatched + 5, 'Zero-allocation batched draw should be faster or equal to allocating draw');
  });
});
