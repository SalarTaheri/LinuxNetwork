import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type ServerProfile = 'web' | 'proxy' | 'download' | 'lowlatency';

const STATIC_SERVER_PROFILES: ServerProfile[] = ['web', 'proxy', 'download', 'lowlatency'];

function renderUnoptimizedProfiles(activeProfile: ServerProfile) {
  return (['web', 'proxy', 'download', 'lowlatency'] as ServerProfile[]).map((prof) => {
    const active = activeProfile === prof;
    return { prof, active };
  });
}

function renderOptimizedProfiles(activeProfile: ServerProfile) {
  return STATIC_SERVER_PROFILES.map((prof) => {
    const active = activeProfile === prof;
    return { prof, active };
  });
}

describe('SysctlTool Profile Rendering Benchmark', () => {
  it('unoptimized and optimized produce identical profile items', () => {
    const unopt = renderUnoptimizedProfiles('proxy');
    const opt = renderOptimizedProfiles('proxy');
    assert.deepEqual(opt, unopt);
  });

  it('measures inline array allocation vs static array reference in render loops', () => {
    const iterations = 100_000;
    const profiles: ServerProfile[] = ['web', 'proxy', 'download', 'lowlatency'];

    // Warmup
    for (const p of profiles) {
      renderUnoptimizedProfiles(p);
      renderOptimizedProfiles(p);
    }

    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const p = profiles[i % profiles.length];
      renderUnoptimizedProfiles(p);
    }
    const durationUnopt = performance.now() - startUnopt;

    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const p = profiles[i % profiles.length];
      renderOptimizedProfiles(p);
    }
    const durationOpt = performance.now() - startOpt;

    console.log(`--- SysctlTool Profile Benchmark (${iterations} renders) ---`);
    console.log(`Inline Array Allocation duration: ${durationUnopt.toFixed(3)} ms`);
    console.log(`Static Array Reference duration:   ${durationOpt.toFixed(3)} ms`);
    const diffMs = durationUnopt - durationOpt;
    const speedupPct = durationUnopt > 0 ? ((diffMs / durationUnopt) * 100).toFixed(2) : '0';
    console.log(`Improvement:                       ${speedupPct}%`);

    assert.ok(durationOpt <= durationUnopt + 10, 'Static array reference should perform faster or equivalent');
  });
});
