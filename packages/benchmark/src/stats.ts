/**
 * Statistical helpers for post-processing sample arrays.
 */

export interface SampleStats {
  avg: number;
  min: number;
  max: number;
  p50: number;
  p75: number;
  p99: number;
  samples: number;
}

/**
 * Trim a sorted sample array symmetrically by a percentage, then compute stats.
 *
 * @param sortedSamples - Sorted array of per-iteration nanosecond timings.
 * @param trimPercent   - Fraction to remove from each end, e.g. 0.1 removes
 *                        the lowest 10% and highest 10% (20% total).
 */
export function trimAndComputeStats(
  sortedSamples: number[],
  trimPercent: number,
): SampleStats {
  const n = sortedSamples.length;

  if (n === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p75: 0, p99: 0, samples: 0 };
  }

  const lo = Math.floor(n * trimPercent);
  const hi = n - lo;
  const trimmed = lo >= hi ? sortedSamples : sortedSamples.slice(lo, hi);
  const tn = trimmed.length;

  const avg = trimmed.reduce((a, v) => a + v, 0) / tn;

  return {
    avg,
    min: trimmed[0],
    max: trimmed[tn - 1],
    p50: trimmed[Math.floor(0.5 * (tn - 1))],
    p75: trimmed[Math.floor(0.75 * (tn - 1))],
    p99: trimmed[Math.floor(0.99 * (tn - 1))],
    samples: tn,
  };
}
