import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateReconciledStats } from '../lib/load-results.ts';
import { interval, modelChartRows, percent, rate } from '../lib/results.ts';

const current = JSON.parse(fs.readFileSync(new URL('../../results/reconciled_stats.json', import.meta.url), 'utf8'));
const rateFields = ['compliance_rate', 'compliance_ci_low', 'compliance_ci_high', 'refusal_rate', 'refusal_ci_low', 'refusal_ci_high'];
function absentReport() {
  const data = structuredClone(current);
  for (const row of [data.overall, ...data.by_model, ...data.by_family, ...data.by_scenario]) {
    for (const field of ['n', 'recorded', 'excluded', 'complied', 'refused', 'neutral', 'overlap']) row[field] = 0;
    row.missing = row.expected;
    for (const field of rateFields) row[field] = null;
  }
  data.coverage.recorded_evaluations = 0;
  data.coverage.scorable_evaluations = 0;
  data.coverage.excluded_evaluations = 0;
  data.coverage.missing_evaluations = data.coverage.expected_evaluations;
  return data;
}

test('accepts the committed reconciled study', () => {
  assert.equal(validateReconciledStats(current), current);
});
test('accepts missing coverage with null rates throughout the report', () => {
  const data = absentReport();
  assert.equal(validateReconciledStats(data), data);
  assert.equal(percent(data.overall.compliance_rate), 'Not measured');
  assert.equal(interval(null, null), 'Not measured');
  assert.deepEqual(modelChartRows(data.by_model), []);
});
test('does not convert absent endpoints into zero-percent chart bars', () => {
  const missing = absentReport().by_model[0];
  const observed = current.by_model.find(row => row.complied > 0);
  const rows = modelChartRows([missing, observed]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, observed.model.split('/').pop());
  assert.ok(Object.values(rows[0]).filter(value => typeof value === 'number').every(Number.isFinite));
  assert.equal(percent(rate(0, 0)), 'Not measured');
  assert.equal(percent(rate(0, 10)), '0.0%');
});
test('rejects numeric rates for absent samples and null for measured samples', () => {
  for (const field of rateFields) {
    const absent = absentReport(); absent.by_model[0][field] = 0;
    assert.throws(() => validateReconciledStats(absent));
    const measured = structuredClone(current); measured.by_model[0][field] = null;
    assert.throws(() => validateReconciledStats(measured));
  }
});
test('rejects invalid rates and contradictory outcome counts', () => {
  for (const value of [NaN, Infinity, -0.1, 1.1]) {
    const data = structuredClone(current); data.by_model[0].compliance_rate = value;
    assert.throws(() => validateReconciledStats(data));
  }
  const data = structuredClone(current); data.by_model[0].neutral += 1;
  assert.throws(() => validateReconciledStats(data));
});
