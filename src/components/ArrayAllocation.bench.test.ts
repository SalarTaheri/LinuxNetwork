import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Inline array allocation in render
function renderInlineProfiles(activeProfile: string) {
  return (['web', 'proxy', 'download', 'lowlatency'] as const).map((prof) => ({
    prof,
    active: prof === activeProfile,
  }));
}

// Module-level static array reference
const STATIC_PROFILES = ['web', 'proxy', 'download', 'lowlatency'] as const;

function renderStaticProfiles(activeProfile: string) {
  return STATIC_PROFILES.map((prof) => ({
    prof,
    active: prof === activeProfile,
  }));
}

describe('Array Allocation Benchmark in Render Paths', () => {
  it('inline array mapping and static array mapping produce identical results', () => {
    assert.deepStrictEqual(renderInlineProfiles('proxy'), renderStaticProfiles('proxy'));
  });

  it('benchmark: static array reference vs inline array allocation', () => {
    const iterations = 500000;

    // Warmup
    for (let i = 0; i < 1000; i++) {
      renderInlineProfiles('proxy');
      renderStaticProfiles('proxy');
    }

    const startInline = performance.now();
    for (let i = 0; i < iterations; i++) {
      renderInlineProfiles('proxy');
    }
    const inlineDuration = performance.now() - startInline;

    const startStatic = performance.now();
    for (let i = 0; i < iterations; i++) {
      renderStaticProfiles('proxy');
    }
    const staticDuration = performance.now() - startStatic;

    const improvementPct = (((inlineDuration - staticDuration) / inlineDuration) * 100).toFixed(2);
    console.log(`\n--- ARRAY ALLOCATION BENCHMARK (${iterations} renders) ---`);
    console.log(`Inline array duration: ${inlineDuration.toFixed(3)} ms`);
    console.log(`Static array duration: ${staticDuration.toFixed(3)} ms`);
    console.log(`Improvement:           ${improvementPct}%\n`);

    assert.ok(
      staticDuration <= inlineDuration + 5,
      'Static array mapping should perform equal to or better than inline array mapping'
    );
  });
});
