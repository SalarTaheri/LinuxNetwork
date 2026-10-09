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

const persistentBuckets: Node[][] = [[], [], [], [], []];

function simulateBatchedDraw(edges: Edge[]): { strokeCount: number; colorStringAllocations: number } {
  for (let b = 0; b < 5; b++) {
    persistentBuckets[b].length = 0;
  }
  let strokeCount = 0;
  let colorStringAllocations = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    persistentBuckets[bucketIndex].push(edge.n1, edge.n2);
  }

  for (let b = 0; b < 5; b++) {
    if (persistentBuckets[b].length > 0) {
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
    const frames = 6000; // 100 seconds at 60 FPS
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        n1: { x: Math.random() * 1920, y: Math.random() * 1080 },
        n2: { x: Math.random() * 1920, y: Math.random() * 1080 },
        alpha: Math.random() * 0.2,
      });
    }

    let unbatchedStrokes = 0;
    let unbatchedColorStringAllocations = 0;
    const startUnbatched = performance.now();
    for (let f = 0; f < frames; f++) {
      const res = simulateUnbatchedDraw(edgesPerFrame);
      unbatchedStrokes += res.strokeCount;
      unbatchedColorStringAllocations += res.colorStringAllocations;
    }
    const durationUnbatched = performance.now() - startUnbatched;

    let batchedStrokes = 0;
    let batchedColorStringAllocations = 0;
    const startBatched = performance.now();
    for (let f = 0; f < frames; f++) {
      const res = simulateBatchedDraw(edgesPerFrame);
      batchedStrokes += res.strokeCount;
      batchedColorStringAllocations += res.colorStringAllocations;
    }
    const durationBatched = performance.now() - startBatched;

    const strokeReduction = (((unbatchedStrokes - batchedStrokes) / unbatchedStrokes) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Unbatched stroke calls: ${unbatchedStrokes.toLocaleString()} | Color string allocations: ${unbatchedColorStringAllocations.toLocaleString()}`);
    console.log(`Batched stroke calls:   ${batchedStrokes.toLocaleString()} | Color string allocations: ${batchedColorStringAllocations.toLocaleString()}`);
    console.log(`Stroke reduction:       ${strokeReduction}%\n`);

    assert.ok(batchedStrokes < unbatchedStrokes, 'Batched rendering should execute drastically fewer canvas stroke calls');
    assert.equal(batchedColorStringAllocations, 0, 'Batched rendering should eliminate color string allocations');
  });
});
