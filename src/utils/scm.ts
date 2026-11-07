import { SCMResult } from '../types';

/**
 * Projects a vector onto the probability simplex:
 * min_{w} 0.5 * ||w - v||^2  s.t.  sum(w) = 1, w_i >= 0
 * Uses Michelot / Duchi et al. O(J log J) algorithm.
 */
export function projectSimplex(v: number[]): number[] {
  const n = v.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  // Sort descending
  const sorted = [...v].sort((a, b) => b - a);

  let sum = 0;
  let rho = 0;
  for (let i = 0; i < n; i++) {
    sum += sorted[i];
    const t = sorted[i] - (sum - 1) / (i + 1);
    if (t > 0) {
      rho = i;
    }
  }

  // Calculate threshold theta
  let rhoSum = 0;
  for (let i = 0; i <= rho; i++) {
    rhoSum += sorted[i];
  }
  const theta = (rhoSum - 1) / (rho + 1);

  // Apply threshold
  const w = v.map((val) => Math.max(0, val - theta));

  // Normalize sum to exactly 1 to avoid floating point drift
  const wSum = w.reduce((acc, cur) => acc + cur, 0);
  if (wSum > 0) {
    for (let i = 0; i < n; i++) {
      w[i] /= wSum;
    }
  } else {
    // Fallback if all 0
    w.fill(1 / n);
  }
  return w;
}

/**
 * Solve Constrained Least Squares for SCM:
 * min_w 0.5 * ||X w - y||^2  s.t. sum(w) = 1, w_i >= 0
 * where y is (T0 x 1) and X is (T0 x J).
 */
export function solveSCMWeights(X: number[][], y: number[]): number[] {
  const T0 = y.length;
  const J = X[0]?.length || 0;

  if (J === 0) return [];
  if (J === 1) return [1];

  // Precompute Q = X^T * X (J x J) and b = X^T * y (J x 1)
  const Q: number[][] = Array.from({ length: J }, () => new Array(J).fill(0));
  const b: number[] = new Array(J).fill(0);

  for (let j1 = 0; j1 < J; j1++) {
    for (let t = 0; t < T0; t++) {
      b[j1] += X[t][j1] * y[t];
    }
    for (let j2 = j1; j2 < J; j2++) {
      let sum = 0;
      for (let t = 0; t < T0; t++) {
        sum += X[t][j1] * X[t][j2];
      }
      Q[j1][j2] = sum;
      Q[j2][j1] = sum;
    }
  }

  // Estimate Lipschitz constant L <= ||Q||_F
  let frobenius = 0;
  for (let r = 0; r < J; r++) {
    for (let c = 0; c < J; c++) {
      frobenius += Q[r][c] * Q[r][c];
    }
  }
  const L = Math.max(Math.sqrt(frobenius), 1e-4);
  const stepSize = 1 / L;

  // Initial weights: uniform
  let w = new Array(J).fill(1 / J);
  let y_acc = [...w]; // Nesterov momentum state
  let t_acc = 1;

  const maxIter = 400;
  const grad = new Array(J).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // grad = Q * y_acc - b
    for (let r = 0; r < J; r++) {
      let sum = 0;
      for (let c = 0; c < J; c++) {
        sum += Q[r][c] * y_acc[c];
      }
      grad[r] = sum - b[r];
    }

    // Gradient step
    const nextV = new Array(J);
    for (let j = 0; j < J; j++) {
      nextV[j] = y_acc[j] - stepSize * grad[j];
    }

    // Simplex projection
    const nextW = projectSimplex(nextV);

    // Check convergence
    let maxDiff = 0;
    for (let j = 0; j < J; j++) {
      maxDiff = Math.max(maxDiff, Math.abs(nextW[j] - w[j]));
    }

    if (maxDiff < 1e-7 && iter > 20) {
      w = nextW;
      break;
    }

    // Nesterov acceleration update
    const nextT = (1 + Math.sqrt(1 + 4 * t_acc * t_acc)) / 2;
    const factor = (t_acc - 1) / nextT;
    for (let j = 0; j < J; j++) {
      y_acc[j] = nextW[j] + factor * (nextW[j] - w[j]);
    }

    w = nextW;
    t_acc = nextT;
  }

  return w;
}

/**
 * Runs full Synthetic Control Method analysis
 */
export function computeSCM(params: {
  targetUnit: string;
  donorUnits: string[];
  dates: string[];
  interventionDate: string;
  unitSeriesMap: Map<string, number[]>; // unit -> array of values matching dates
}): SCMResult | null {
  const { targetUnit, donorUnits, dates, interventionDate, unitSeriesMap } = params;

  const targetSeries = unitSeriesMap.get(targetUnit);
  if (!targetSeries || donorUnits.length === 0) return null;

  // Find intervention index
  let interventionIndex = dates.findIndex((d) => d >= interventionDate);
  if (interventionIndex === -1) {
    interventionIndex = dates.length; // No post-treatment data
  }

  const T = dates.length;
  const T0 = interventionIndex;

  if (T0 < 2) {
    // Not enough pre-intervention data points
    return null;
  }

  // Prepare X_pre (T0 x J) and y_pre (T0 x 1)
  const J = donorUnits.length;
  const X_pre: number[][] = Array.from({ length: T0 }, () => new Array(J).fill(0));
  const y_pre: number[] = new Array(T0);

  for (let t = 0; t < T0; t++) {
    y_pre[t] = targetSeries[t];
    for (let j = 0; j < J; j++) {
      const donorData = unitSeriesMap.get(donorUnits[j]);
      X_pre[t][j] = donorData ? donorData[t] : 0;
    }
  }

  // Solve for optimal weights
  const weights = solveSCMWeights(X_pre, y_pre);

  // Compute full synthetic series
  const syntheticValues: number[] = new Array(T).fill(0);
  for (let t = 0; t < T; t++) {
    let synVal = 0;
    for (let j = 0; j < J; j++) {
      const donorData = unitSeriesMap.get(donorUnits[j]);
      if (donorData) {
        synVal += weights[j] * donorData[t];
      }
    }
    syntheticValues[t] = synVal;
  }

  const gapValues: number[] = new Array(T);
  for (let t = 0; t < T; t++) {
    gapValues[t] = targetSeries[t] - syntheticValues[t];
  }

  // Pre-treatment RMSPE
  let preSqErr = 0;
  let preMean = 0;
  for (let t = 0; t < T0; t++) {
    preSqErr += gapValues[t] * gapValues[t];
    preMean += targetSeries[t];
  }
  preMean /= T0;
  const preRMSPE = Math.sqrt(preSqErr / T0);

  // Post-treatment RMSPE & Total effect
  let postRMSPE = 0;
  let totalIncrementalEffect = 0;
  const postLength = T - T0;

  if (postLength > 0) {
    let postSqErr = 0;
    for (let t = T0; t < T; t++) {
      postSqErr += gapValues[t] * gapValues[t];
      totalIncrementalEffect += gapValues[t];
    }
    postRMSPE = Math.sqrt(postSqErr / postLength);
  }

  const averageIncrementalEffect = postLength > 0 ? totalIncrementalEffect / postLength : 0;
  const rmspeRatio = preRMSPE > 1e-9 ? postRMSPE / preRMSPE : 0;

  // Calculate pre-treatment variance and standard deviation
  let preVar = 0;
  for (let t = 0; t < T0; t++) {
    preVar += Math.pow(targetSeries[t] - preMean, 2);
  }
  const preStd = Math.sqrt(preVar / Math.max(1, T0 - 1));

  // Confidence Score: 0 to 100%
  // 100 * max(0, 1 - preRMSPE / baselineVariation)
  // Where baseline variation can be taken as either standard deviation or ~15% of mean
  const variationRef = Math.max(preStd, preMean * 0.12, 1);
  const rawScore = 100 * (1 - preRMSPE / variationRef);
  const confidenceScore = Math.max(10, Math.min(99.5, Math.round(rawScore * 10) / 10));

  // Placebo test on all donor units
  const placeboResults: SCMResult['placeboResults'] = [];

  for (let targetDonorIdx = 0; targetDonorIdx < J; targetDonorIdx++) {
    const fakeTarget = donorUnits[targetDonorIdx];
    const fakeTargetSeries = unitSeriesMap.get(fakeTarget);
    if (!fakeTargetSeries) continue;

    // Donor pool for fake target: all other donors
    const pool = donorUnits.filter((_, idx) => idx !== targetDonorIdx);
    if (pool.length === 0) continue;

    const fakeJ = pool.length;
    const fakeX_pre: number[][] = Array.from({ length: T0 }, () => new Array(fakeJ).fill(0));
    const fakeY_pre: number[] = new Array(T0);

    for (let t = 0; t < T0; t++) {
      fakeY_pre[t] = fakeTargetSeries[t];
      for (let pj = 0; pj < fakeJ; pj++) {
        const dSeries = unitSeriesMap.get(pool[pj]);
        fakeX_pre[t][pj] = dSeries ? dSeries[t] : 0;
      }
    }

    const fakeWeights = solveSCMWeights(fakeX_pre, fakeY_pre);

    // Compute synthetic for fake target
    const fakeGaps: number[] = new Array(T);
    let fakePreSq = 0;
    let fakePostSq = 0;

    for (let t = 0; t < T; t++) {
      let fakeSyn = 0;
      for (let pj = 0; pj < fakeJ; pj++) {
        const dSeries = unitSeriesMap.get(pool[pj]);
        if (dSeries) fakeSyn += fakeWeights[pj] * dSeries[t];
      }
      fakeGaps[t] = fakeTargetSeries[t] - fakeSyn;
      if (t < T0) {
        fakePreSq += fakeGaps[t] * fakeGaps[t];
      } else {
        fakePostSq += fakeGaps[t] * fakeGaps[t];
      }
    }

    const fakePreRMSPE = Math.sqrt(fakePreSq / T0);
    const fakePostRMSPE = postLength > 0 ? Math.sqrt(fakePostSq / postLength) : 0;
    const fakeRatio = fakePreRMSPE > 1e-9 ? fakePostRMSPE / fakePreRMSPE : 0;

    placeboResults.push({
      unit: fakeTarget,
      preRMSPE: fakePreRMSPE,
      postRMSPE: fakePostRMSPE,
      ratio: fakeRatio,
      gaps: fakeGaps,
    });
  }

  // Calculate empirical p-value according to Abadie et al. (2010):
  // p = (1 + count(ratio_placebo >= ratio_target)) / (1 + J)
  let extremeCount = 0;
  for (const pl of placeboResults) {
    if (pl.ratio >= rmspeRatio) {
      extremeCount++;
    }
  }
  const placeboPValue = postLength > 0 ? (1 + extremeCount) / (1 + J) : null;

  const donorWeights = donorUnits.map((unit, idx) => ({
    unit,
    weight: weights[idx],
  }));

  return {
    targetUnit,
    interventionDate,
    interventionIndex,
    dates,
    actualValues: targetSeries,
    syntheticValues,
    gapValues,
    donorWeights,
    preRMSPE,
    postRMSPE,
    rmspeRatio,
    confidenceScore,
    totalIncrementalEffect,
    averageIncrementalEffect,
    placeboPValue,
    placeboResults,
  };
}
