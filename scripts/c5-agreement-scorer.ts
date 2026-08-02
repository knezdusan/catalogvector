/**
 * C5 blind labelling agreement scorer (DIRECTIVE-5 §2)
 *
 * Usage:
 *   1. Founder fills the `verdict` column in c5-blind-labelling-sheet.json
 *      with should_match / partial / should_not_match
 *   2. Run: npx tsx scripts/c5-agreement-scorer.ts
 *
 * Outputs: overall agreement, per-class agreement, and the specific disagreements.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface Pair {
  id: number;
  queryId: string;
  query: string;
  rank: number;
  productTitle: string;
  fieldPresence: string;
  verdict?: string; // founder fills this
}

async function main() {
  const sheetPath = join(process.cwd(), 'scripts', 'c5-blind-labelling-sheet.json');
  const expectationsPath = join(process.cwd(), 'scripts', 'retrieval-expectations.json');

  const sheet = JSON.parse(await readFile(sheetPath, 'utf8')) as { pairs: Pair[] };
  const expectations = JSON.parse(await readFile(expectationsPath, 'utf8')) as {
    labels: Array<{ queryId: string; rank: number; verdict: string }>;
  };

  // Build lookup for Devin's labels
  const devinLabels = new Map<string, string>();
  for (const l of expectations.labels) {
    devinLabels.set(`${l.queryId}-${l.rank}`, l.verdict);
  }

  // Check founder has filled in verdicts
  const filled = sheet.pairs.filter((p) => p.verdict);
  if (filled.length === 0) {
    console.error('No verdicts found in c5-blind-labelling-sheet.json.');
    console.error('Founder must fill the "verdict" field for each pair with:');
    console.error('  should_match | partial | should_not_match');
    process.exit(1);
  }

  console.log('\nC5 BLIND LABELLING AGREEMENT (DIRECTIVE-5 §2)');
  console.log('═'.repeat(60));
  console.log(`Pairs: ${filled.length} of ${sheet.pairs.length} labelled\n`);

  // Compute agreement
  let agree = 0;
  let disagree = 0;
  const disagreements: Array<{ id: number; queryId: string; rank: number; devin: string; founder: string; title: string }> = [];

  const classes = ['should_match', 'partial', 'should_not_match'];
  const confusion: Record<string, Record<string, number>> = {};
  for (const c of classes) {
    confusion[c] = {};
    for (const c2 of classes) confusion[c][c2] = 0;
  }

  for (const p of filled) {
    const devin = devinLabels.get(`${p.queryId}-${p.rank}`);
    if (!devin) {
      console.warn(`  No Devin label for ${p.queryId} #${p.rank}, skipping`);
      continue;
    }
    const founder = p.verdict!;
    confusion[devin][founder] = (confusion[devin][founder] || 0) + 1;
    if (devin === founder) {
      agree++;
    } else {
      disagree++;
      disagreements.push({
        id: p.id,
        queryId: p.queryId,
        rank: p.rank,
        devin,
        founder,
        title: p.productTitle.slice(0, 60),
      });
    }
  }

  const total = agree + disagree;
  const overallAgreement = total > 0 ? agree / total : 0;

  console.log(`Overall agreement: ${agree}/${total} = ${overallAgreement.toFixed(3)}`);
  console.log();

  // Per-class agreement (Cohen's kappa-style)
  console.log('Confusion matrix (rows = Devin, cols = Founder):');
  console.log(`                     should_match  partial  should_not_match`);
  for (const c of classes) {
    console.log(`  ${c.padEnd(20)} ${String(confusion[c].should_match).padStart(8)}     ${String(confusion[c].partial).padStart(6)}  ${String(confusion[c].should_not_match).padStart(12)}`);
  }

  console.log();

  // Per-class recall
  for (const c of classes) {
    const row = confusion[c];
    const rowTotal = row.should_match + row.partial + row.should_not_match;
    if (rowTotal > 0) {
      const recall = row[c] / rowTotal;
      console.log(`  ${c}: ${row[c]}/${rowTotal} = ${recall.toFixed(3)}`);
    }
  }

  // Partial band specifically (the acid test)
  const partialTotal = confusion.partial.should_match + confusion.partial.partial + confusion.partial.should_not_match;
  if (partialTotal > 0) {
    const partialAgreement = confusion.partial.partial / partialTotal;
    console.log(`\n  ** Partial band agreement: ${confusion.partial.partial}/${partialTotal} = ${partialAgreement.toFixed(3)} **`);
    if (partialAgreement < 0.6) {
      console.log('  ⚠ Partial agreement is poor — criterion 2 (acid test) is still OPEN.');
    } else {
      console.log('  Partial agreement is sufficient — criterion 2 stands.');
    }
  }

  if (disagreements.length > 0) {
    console.log('\nDisagreements:');
    for (const d of disagreements) {
      console.log(`  #${d.id} ${d.queryId} rank ${d.rank}: Devin=${d.devin} Founder=${d.founder} — ${d.title}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
