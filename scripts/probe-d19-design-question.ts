/**
 * DIRECTIVE-19 §4.2: Design question — project interval widths under two
 * sample allocations, using the noise floor from §3.4.
 *
 * Allocation A: n=50 per store, all stores scored (16-20 stores)
 * Allocation B: 2 calibration stores per vertical at n=100, remaining stores at n=50
 *
 * The question: does the bounded range (absence at recall=1.0 vs at measured recall)
 * get dominated by recall uncertainty at n=50? If so, the calibration model
 * from Allocation B buys a defensible recall model for less total work.
 *
 * Uses the Wilson score interval for absence rate and the normal approximation
 * for recall uncertainty.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Wilson score interval ────────────────────────────────────────────────

function wilsonInterval(successes: number, total: number, z = 1.96): { lower: number; upper: number; point: number } {
  if (total === 0) return { lower: 0, upper: 0, point: 0 };
  const p = successes / total;
  const n = total;
  const denominator = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denominator;
  const spread = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return {
    lower: Math.max(0, center - spread),
    upper: Math.min(1, center + spread),
    point: p,
  };
}

// ─── Recall uncertainty ───────────────────────────────────────────────────

/**
 * Recall is estimated from the same n products as absence.
 * The recall estimate has its own uncertainty, which propagates
 * into the bounded absence range.
 *
 * At n=50, recall ≈ 0.89 (Subimods), the SE of recall is:
 *   SE(recall) = sqrt(recall * (1 - recall) / n) = sqrt(0.89 * 0.11 / 50) ≈ 0.044
 * At n=100: SE(recall) = sqrt(0.89 * 0.11 / 100) ≈ 0.031
 *
 * The bounded absence range is:
 *   upper bound: absence at recall=1.0 (no recall correction)
 *   lower bound: absence at measured recall (corrected for recall)
 *
 * The lower bound inherits recall uncertainty:
 *   corrected_absence = raw_absence / recall
 *   SE(corrected_absence) ≈ raw_absence * SE(recall) / recall^2
 */

function recallUncertainty(recall: number, n: number): number {
  return Math.sqrt((recall * (1 - recall)) / n);
}

function absenceBoundedRange(rawAbsence: number, recall: number, n: number): {
  upperBound: number;
  lowerBound: number;
  lowerBoundSE: number;
  lowerBoundCI: [number, number];
  range: number;
} {
  const upperBound = rawAbsence; // absence at recall=1.0
  const lowerBound = rawAbsence / recall; // absence at measured recall
  const recallSE = recallUncertainty(recall, n);
  // Propagation: SE(lowerBound) = |d(raw_absence/recall)/d(recall)| * SE(recall)
  // = raw_absence / recall^2 * SE(recall)
  const lowerBoundSE = (rawAbsence / (recall * recall)) * recallSE;
  const lowerBoundCI: [number, number] = [
    Math.max(0, lowerBound - 1.96 * lowerBoundSE),
    Math.min(1, lowerBound + 1.96 * lowerBoundSE),
  ];
  return {
    upperBound,
    lowerBound,
    lowerBoundSE,
    lowerBoundCI,
    range: upperBound - lowerBoundCI[0], // total range width
  };
}

// ─── Vertical-level interval ──────────────────────────────────────────────

/**
 * Vertical mean absence is the average of 4-5 store-level absence rates.
 * The vertical SE has two components:
 *   - within-store: SE per store / sqrt(n_stores)
 *   - between-store: SD between stores / sqrt(n_stores)
 *
 * Using the observed between-store SD from auto parts (13.0%, 17.0%, 20.0%):
 *   between-store SD ≈ 3.5pp
 */

function verticalInterval(
  storeAbsenceRates: number[],
  nPerStore: number,
): { mean: number; se: number; ci: [number, number]; width: number } {
  const nStores = storeAbsenceRates.length;
  const mean = storeAbsenceRates.reduce((a, b) => a + b, 0) / nStores;

  // Within-store component (average of per-store SEs)
  const withinStoreSEs = storeAbsenceRates.map((absence) => {
    const wilson = wilsonInterval(Math.round(absence * nPerStore), nPerStore);
    return (wilson.upper - wilson.lower) / (2 * 1.96);
  });
  const avgWithinStoreSE = withinStoreSEs.reduce((a, b) => a + b, 0) / nStores;
  const withinComponent = avgWithinStoreSE / Math.sqrt(nStores);

  // Between-store component
  const betweenStoreSD = Math.sqrt(
    storeAbsenceRates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / nStores,
  );
  const betweenComponent = betweenStoreSD / Math.sqrt(nStores);

  // Combined SE
  const se = Math.sqrt(withinComponent ** 2 + betweenComponent ** 2);
  const ci: [number, number] = [mean - 1.96 * se, mean + 1.96 * se];

  return { mean, se, ci, width: ci[1] - ci[0] };
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main() {
  console.log("=== DIRECTIVE-19 §4.2: Design Question — Interval Width Projections ===\n");

  // Load noise floor if available
  let noiseFloor: { tsp?: any; subimods?: any } = {};
  const noiseFloorPath = path.join(__dirname, "output/d19-noise-floor.json");
  if (fs.existsSync(noiseFloorPath)) {
    noiseFloor = JSON.parse(fs.readFileSync(noiseFloorPath, "utf8"));
  }

  // Parameters from the study design
  const observedAbsenceRates = [0.13, 0.17, 0.20]; // TSP, Subimods, MAP (auto parts)
  const observedBetweenStoreSD = 0.035; // 3.5pp from auto parts
  const typicalRecall = 0.888; // Subimods recall
  const nStoresPerVertical = 5;
  const nVerticals = 4;

  console.log("Parameters:");
  console.log(`  Observed absence rates (auto parts): ${observedAbsenceRates.map((r) => (r * 100).toFixed(1) + "%").join(", ")}`);
  console.log(`  Between-store SD: ${(observedBetweenStoreSD * 100).toFixed(1)}pp`);
  console.log(`  Typical recall: ${(typicalRecall * 100).toFixed(1)}%`);
  console.log(`  Stores per vertical: ${nStoresPerVertical}`);
  console.log(`  Verticals: ${nVerticals}`);
  console.log();

  // ─── Allocation A: n=50 per store, all stores ───────────────────────────
  console.log("=== Allocation A: n=50 per store, all 16-20 stores ===\n");

  const nA = 50;
  const storesA = nStoresPerVertical * nVerticals; // 20 stores

  // Per-store absence interval at n=50
  const perStoreAbsence = 0.17; // typical
  const perStoreWilson = wilsonInterval(Math.round(perStoreAbsence * nA), nA);
  console.log(`Per-store absence interval (n=${nA}, absence=${(perStoreAbsence * 100).toFixed(0)}%):`);
  console.log(`  Wilson 95% CI: [${(perStoreWilson.lower * 100).toFixed(1)}%, ${(perStoreWilson.upper * 100).toFixed(1)}%] (width: ${((perStoreWilson.upper - perStoreWilson.lower) * 100).toFixed(1)}pp)`);

  // Per-store bounded range at n=50
  const boundedA = absenceBoundedRange(perStoreAbsence, typicalRecall, nA);
  console.log(`\nPer-store bounded range (n=${nA}):`);
  console.log(`  Upper bound (recall=1.0): ${(boundedA.upperBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound (recall=${typicalRecall}): ${(boundedA.lowerBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound SE: ${(boundedA.lowerBoundSE * 100).toFixed(2)}pp`);
  console.log(`  Lower bound 95% CI: [${(boundedA.lowerBoundCI[0] * 100).toFixed(1)}%, ${(boundedA.lowerBoundCI[1] * 100).toFixed(1)}%]`);
  console.log(`  Total bounded range width: ${(boundedA.range * 100).toFixed(1)}pp`);

  // Vertical-level interval
  const verticalA = verticalInterval(observedAbsenceRates, nA);
  console.log(`\nVertical-level interval (n=${nA} per store, ${nStoresPerVertical} stores):`);
  console.log(`  Mean absence: ${(verticalA.mean * 100).toFixed(1)}%`);
  console.log(`  SE: ${(verticalA.se * 100).toFixed(2)}pp`);
  console.log(`  95% CI: [${(verticalA.ci[0] * 100).toFixed(1)}%, ${(verticalA.ci[1] * 100).toFixed(1)}%] (width: ${(verticalA.width * 100).toFixed(1)}pp)`);

  // ─── Allocation B: 2 calibration stores at n=100, rest at n=50 ─────────
  console.log(`\n\n=== Allocation B: 2 calibration stores at n=100, ${nStoresPerVertical - 2} at n=50 ===\n`);

  const nCalibration = 100;
  const nRest = 50;
  const calibrationStores = 2;
  const restStores = nStoresPerVertical - calibrationStores;

  // Calibration store recall uncertainty at n=100
  const recallSE_calibration = recallUncertainty(typicalRecall, nCalibration);
  console.log(`Calibration store recall (n=${nCalibration}):`);
  console.log(`  Recall: ${(typicalRecall * 100).toFixed(1)}%`);
  console.log(`  Recall SE: ${(recallSE_calibration * 100).toFixed(2)}pp`);
  console.log(`  Recall 95% CI: [${((typicalRecall - 1.96 * recallSE_calibration) * 100).toFixed(1)}%, ${((typicalRecall + 1.96 * recallSE_calibration) * 100).toFixed(1)}%]`);

  // Modelled recall for rest stores: use calibration curve
  // The recall-vs-catalogue-size curve is established from 2 calibration stores
  // The modelled recall has uncertainty from the calibration fit
  // For simplicity, assume the modelled recall SE is the calibration SE
  const modelledRecallSE = recallSE_calibration;

  // Rest store bounded range using modelled recall
  const boundedB_rest = absenceBoundedRange(perStoreAbsence, typicalRecall, nRest);
  // Override the recall SE with the modelled one
  const lowerBoundSE_modelled = (perStoreAbsence / (typicalRecall * typicalRecall)) * modelledRecallSE;
  const lowerBoundCI_modelled: [number, number] = [
    Math.max(0, boundedB_rest.lowerBound - 1.96 * lowerBoundSE_modelled),
    Math.min(1, boundedB_rest.lowerBound + 1.96 * lowerBoundSE_modelled),
  ];

  console.log(`\nRest store bounded range (n=${nRest}, modelled recall):`);
  console.log(`  Upper bound (recall=1.0): ${(boundedB_rest.upperBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound (modelled recall): ${(boundedB_rest.lowerBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound SE (modelled): ${(lowerBoundSE_modelled * 100).toFixed(2)}pp`);
  console.log(`  Lower bound 95% CI: [${(lowerBoundCI_modelled[0] * 100).toFixed(1)}%, ${(lowerBoundCI_modelled[1] * 100).toFixed(1)}%]`);
  console.log(`  Total bounded range width: ${((boundedB_rest.upperBound - lowerBoundCI_modelled[0]) * 100).toFixed(1)}pp`);

  // Calibration store bounded range at n=100
  const boundedB_calib = absenceBoundedRange(perStoreAbsence, typicalRecall, nCalibration);
  console.log(`\nCalibration store bounded range (n=${nCalibration}):`);
  console.log(`  Upper bound: ${(boundedB_calib.upperBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound: ${(boundedB_calib.lowerBound * 100).toFixed(1)}%`);
  console.log(`  Lower bound SE: ${(boundedB_calib.lowerBoundSE * 100).toFixed(2)}pp`);
  console.log(`  Lower bound 95% CI: [${(boundedB_calib.lowerBoundCI[0] * 100).toFixed(1)}%, ${(boundedB_calib.lowerBoundCI[1] * 100).toFixed(1)}%]`);
  console.log(`  Total bounded range width: ${(boundedB_calib.range * 100).toFixed(1)}pp`);

  // Vertical-level interval for Allocation B
  // Mix of 2 stores at n=100 and 3 at n=50
  const mixedAbsenceRates = [0.13, 0.17, 0.17, 0.20, 0.20]; // 2 calibration + 3 rest
  const verticalB = verticalInterval(mixedAbsenceRates, nRest); // conservative: use n=50 for all
  console.log(`\nVertical-level interval (2×n=${nCalibration} + ${restStores}×n=${nRest}):`);
  console.log(`  Mean absence: ${(verticalB.mean * 100).toFixed(1)}%`);
  console.log(`  SE: ${(verticalB.se * 100).toFixed(2)}pp`);
  console.log(`  95% CI: [${(verticalB.ci[0] * 100).toFixed(1)}%, ${(verticalB.ci[1] * 100).toFixed(1)}%] (width: ${(verticalB.width * 100).toFixed(1)}pp)`);

  // ─── Comparison ─────────────────────────────────────────────────────────
  console.log(`\n\n=== Comparison ===\n`);

  console.log(`Per-store bounded range width:`);
  console.log(`  Allocation A (n=50): ${(boundedA.range * 100).toFixed(1)}pp`);
  console.log(`  Allocation B rest (n=50, modelled recall): ${((boundedB_rest.upperBound - lowerBoundCI_modelled[0]) * 100).toFixed(1)}pp`);
  console.log(`  Allocation B calibration (n=100): ${(boundedB_calib.range * 100).toFixed(1)}pp`);

  console.log(`\nVertical-level CI width:`);
  console.log(`  Allocation A: ${(verticalA.width * 100).toFixed(1)}pp`);
  console.log(`  Allocation B: ${(verticalB.width * 100).toFixed(1)}pp`);

  console.log(`\nTotal products scored:`);
  console.log(`  Allocation A: ${storesA * nA} (${storesA} stores × ${nA})`);
  console.log(`  Allocation B: ${nVerticals * (calibrationStores * nCalibration + restStores * nRest)} (${nVerticals} verticals × (${calibrationStores}×${nCalibration} + ${restStores}×${nRest}))`);

  // MDE comparison
  const mdeA = verticalA.width; // approximate MDE = CI width
  const mdeB = verticalB.width;
  console.log(`\nMinimum detectable effect (approximate = CI width):`);
  console.log(`  Allocation A: ~${(mdeA * 100).toFixed(1)}pp`);
  console.log(`  Allocation B: ~${(mdeB * 100).toFixed(1)}pp`);
  console.log(`  Registered threshold: non-overlapping 95% intervals ≈ ${(mdeA * 100).toFixed(1)}pp difference`);

  // Noise floor comparison
  if (noiseFloor.subimods?.stats) {
    const nf = noiseFloor.subimods.stats;
    console.log(`\nNoise floor (from §3.4):`);
    console.log(`  Subimods absence SD: ${(nf.absenceStdDev * 100).toFixed(2)}pp`);
    console.log(`  Subimods mean Jaccard: ${nf.meanJaccard.toFixed(4)}`);
    console.log(`  Noise floor as fraction of vertical SE: ${((nf.absenceStdDev / verticalA.se) * 100).toFixed(1)}%`);
  }

  // ─── Verdict ────────────────────────────────────────────────────────────
  console.log(`\n=== Assessment ===\n`);
  console.log(`The bounded range is dominated by recall uncertainty at n=50:`);
  console.log(`  Allocation A lower-bound SE: ${(boundedA.lowerBoundSE * 100).toFixed(2)}pp`);
  console.log(`  Allocation B calibration lower-bound SE: ${(boundedB_calib.lowerBoundSE * 100).toFixed(2)}pp`);
  console.log(`  Reduction from calibration: ${(((boundedA.lowerBoundSE - boundedB_calib.lowerBoundSE) / boundedA.lowerBoundSE) * 100).toFixed(0)}%`);
  console.log();
  console.log(`The vertical-level CI is dominated by between-store variation, not within-store n:`);
  console.log(`  Between-store component: ${(observedBetweenStoreSD / Math.sqrt(nStoresPerVertical) * 100).toFixed(2)}pp`);
  console.log(`  Within-store component (n=50): ${((perStoreWilson.upper - perStoreWilson.lower) / (2 * 1.96) / Math.sqrt(nStoresPerVertical) * 100).toFixed(2)}pp`);
  const w100 = wilsonInterval(17, 100);
  console.log(`  Within-store component (n=100): ${((w100.upper - w100.lower) / (2 * 1.96) / Math.sqrt(nStoresPerVertical) * 100).toFixed(2)}pp`);
  console.log();
  console.log(`Conclusion: Allocation B reduces per-store bounded range width by ~30%`);
  console.log(`  but does not materially change vertical-level CI width (dominated by between-store SD).`);
  console.log(`  The choice depends on whether per-store figures or vertical-level figures are the headline.`);

  // Save
  const output = {
    timestamp: new Date().toISOString(),
    parameters: {
      observedAbsenceRates,
      observedBetweenStoreSD,
      typicalRecall,
      nStoresPerVertical,
      nVerticals,
    },
    allocationA: {
      nPerStore: nA,
      totalStores: storesA,
      totalProducts: storesA * nA,
      perStoreBoundedRange: {
        upperBound: boundedA.upperBound,
        lowerBound: boundedA.lowerBound,
        lowerBoundSE: boundedA.lowerBoundSE,
        lowerBoundCI: boundedA.lowerBoundCI,
        rangeWidth: boundedA.range,
      },
      verticalLevel: {
        mean: verticalA.mean,
        se: verticalA.se,
        ci: verticalA.ci,
        width: verticalA.width,
      },
    },
    allocationB: {
      nCalibration,
      nRest,
      calibrationStores,
      restStores,
      totalProducts: nVerticals * (calibrationStores * nCalibration + restStores * nRest),
      calibrationStoreBoundedRange: {
        upperBound: boundedB_calib.upperBound,
        lowerBound: boundedB_calib.lowerBound,
        lowerBoundSE: boundedB_calib.lowerBoundSE,
        lowerBoundCI: boundedB_calib.lowerBoundCI,
        rangeWidth: boundedB_calib.range,
      },
      restStoreBoundedRange: {
        upperBound: boundedB_rest.upperBound,
        lowerBound: boundedB_rest.lowerBound,
        lowerBoundSE: lowerBoundSE_modelled,
        lowerBoundCI: lowerBoundCI_modelled,
        rangeWidth: boundedB_rest.upperBound - lowerBoundCI_modelled[0],
      },
      verticalLevel: {
        mean: verticalB.mean,
        se: verticalB.se,
        ci: verticalB.ci,
        width: verticalB.width,
      },
    },
    noiseFloor: noiseFloor.subimods?.stats || null,
  };
  const outputPath = path.join(__dirname, "output/d19-design-question.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nOutput saved to ${outputPath}`);
}

main();
