import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface Node {
  x: number;
  y: number;
}

interface Edge {
  sourceIndex: number;
  targetIndex: number;
  alpha: number;
}

function simulateObjectBatchedDraw(nodes: Node[], edges: Edge[]): number {
  const alphaBuckets: { n1: Node; n2: Node }[][] = [[], [], [], [], []];
  let strokeCount = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    alphaBuckets[bucketIndex].push({ n1: nodes[edge.sourceIndex], n2: nodes[edge.targetIndex] });
  }

  for (let b = 0; b < 5; b++) {
    if (alphaBuckets[b].length > 0) strokeCount++;
  }

  return strokeCount;
}

function simulateIndexBatchedDraw(nodes: Node[], edges: Edge[], bucketIndices: number[][]): number {
  bucketIndices[0].length = 0;
  bucketIndices[1].length = 0;
  bucketIndices[2].length = 0;
  bucketIndices[3].length = 0;
  bucketIndices[4].length = 0;

  let strokeCount = 0;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const bucketIndex = Math.min(4, Math.floor((edge.alpha / 0.2) * 5));
    bucketIndices[bucketIndex].push(edge.sourceIndex, edge.targetIndex);
  }

  for (let b = 0; b < 5; b++) {
    const indices = bucketIndices[b];
    const len = indices.length;
    if (len === 0) continue;
    strokeCount++;
    for (let idx = 0; idx < len; idx += 2) {
      const n1 = nodes[indices[idx]];
      const n2 = nodes[indices[idx + 1]];
      // moveTo n1, lineTo n2
    }
  }

  return strokeCount;
}

describe('NetworkBackground Canvas Edge Rendering Benchmark', () => {
  it('benchmark: compare object-batched vs reusable index-batched canvas edge rendering', () => {
    const nodeCount = 50;
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({ x: Math.random() * 1920, y: Math.random() * 1080 });
    }

    const frames = 10000;
    const edgesPerFrame: Edge[] = [];
    for (let i = 0; i < 120; i++) {
      edgesPerFrame.push({
        sourceIndex: Math.floor(Math.random() * nodeCount),
        targetIndex: Math.floor(Math.random() * nodeCount),
        alpha: Math.random() * 0.2,
      });
    }

    // Warmup
    const testIndices = [[], [], [], [], []];
    for (let f = 0; f < 1000; f++) {
      simulateObjectBatchedDraw(nodes, edgesPerFrame);
      simulateIndexBatchedDraw(nodes, edgesPerFrame, testIndices);
    }

    const startObject = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateObjectBatchedDraw(nodes, edgesPerFrame);
    }
    const durationObject = performance.now() - startObject;

    const reusableIndices = [[], [], [], [], []];
    const startIndex = performance.now();
    for (let f = 0; f < frames; f++) {
      simulateIndexBatchedDraw(nodes, edgesPerFrame, reusableIndices);
    }
    const durationIndex = performance.now() - startIndex;

    const speedupPct = (((durationObject - durationIndex) / durationObject) * 100).toFixed(2);
    console.log(`\n--- CANVAS EDGE RENDERING BENCHMARK (${frames} animation frames) ---`);
    console.log(`Object-Batched duration: ${durationObject.toFixed(3)} ms`);
    console.log(`Index-Batched duration:  ${durationIndex.toFixed(3)} ms`);
    console.log(`Index-Batched Speedup:   ${speedupPct}%\n`);

    assert.ok(durationIndex <= durationObject + 5, 'Index-batched coordinate batching should perform equal to or better than object batching');
  });
});
