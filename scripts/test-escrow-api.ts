/**
 * Ethos AI — Escrow API Reliability & Edge-Case QA Test Suite
 * Issue #11 (K-15): Verify API Reliability & Edge-Case Behavior for Payment/Doc Flows
 * Assignee: @Taha-Mim-Tasfa
 *
 * Usage:
 *   node --experimental-strip-types scripts/test-escrow-api.ts
 */

import {
  validateEscrowTransition,
  getLedgerTypeForTransition,
  bdtToPoisha,
  poishaToBdt,
  formatPoishaToBDT,
  calculatePlatformFee,
  EscrowTransitionError,
} from '../apps/web/src/lib/escrowStateMachine.ts';

let passed = 0;
let failed = 0;
const results: Array<{ name: string; ok: boolean; details?: string }> = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    results.push({ name, ok: true });
  } catch (err: any) {
    failed++;
    results.push({ name, ok: false, details: err?.message || String(err) });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertThrows(fn: () => void, expectedMsgFragment?: string) {
  try {
    fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (err: any) {
    if (err.message === 'Expected function to throw, but it did not') throw err;
    if (expectedMsgFragment && !err.message.includes(expectedMsgFragment)) {
      throw new Error(`Expected error containing "${expectedMsgFragment}" but got: "${err.message}"`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Legal State Transitions
// ─────────────────────────────────────────────────────────────────────────────

test('LEGAL: PENDING → HELD is allowed', () => {
  const result = validateEscrowTransition('PENDING', 'HELD');
  assert(result.valid === true, 'PENDING → HELD should be valid');
});

test('LEGAL: HELD → RELEASED is allowed', () => {
  const result = validateEscrowTransition('HELD', 'RELEASED');
  assert(result.valid === true, 'HELD → RELEASED should be valid');
});

test('LEGAL: HELD → DISPUTED is allowed', () => {
  const result = validateEscrowTransition('HELD', 'DISPUTED');
  assert(result.valid === true, 'HELD → DISPUTED should be valid');
});

test('LEGAL: HELD → REFUNDED is allowed', () => {
  const result = validateEscrowTransition('HELD', 'REFUNDED');
  assert(result.valid === true, 'HELD → REFUNDED should be valid');
});

test('LEGAL: DISPUTED → RELEASED (admin resolution) is allowed', () => {
  const result = validateEscrowTransition('DISPUTED', 'RELEASED', 'ADMIN');
  assert(result.valid === true, 'DISPUTED → RELEASED by admin should be valid');
});

test('LEGAL: DISPUTED → REFUNDED is allowed', () => {
  const result = validateEscrowTransition('DISPUTED', 'REFUNDED');
  assert(result.valid === true, 'DISPUTED → REFUNDED should be valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Illegal State Transitions
// ─────────────────────────────────────────────────────────────────────────────

test('ILLEGAL: PENDING → RELEASED must fail (funds not yet held)', () => {
  const result = validateEscrowTransition('PENDING', 'RELEASED');
  assert(result.valid === false, 'PENDING → RELEASED should be invalid');
  assert(
    result.reason?.includes('Cannot release a PENDING milestone') ?? false,
    'Error should explain PENDING cannot be released'
  );
});

test('ILLEGAL: PENDING → REFUNDED must fail (no funds held)', () => {
  const result = validateEscrowTransition('PENDING', 'REFUNDED');
  assert(result.valid === false, 'PENDING → REFUNDED should be invalid');
  assert(
    result.reason?.includes('Cannot refund a PENDING milestone') ?? false,
    'Error should explain PENDING cannot be refunded'
  );
});

test('ILLEGAL: PENDING → DISPUTED must fail', () => {
  const result = validateEscrowTransition('PENDING', 'DISPUTED');
  assert(result.valid === false, 'PENDING → DISPUTED should be invalid');
});

test('ILLEGAL: DISPUTED → HELD must fail (cannot unreview a dispute)', () => {
  const result = validateEscrowTransition('DISPUTED', 'HELD');
  assert(result.valid === false, 'DISPUTED → HELD should be invalid');
  assert(
    result.reason?.includes('cannot be reverted') ?? false,
    'Error should explain DISPUTED cannot revert to HELD'
  );
});

test('ILLEGAL: RELEASED → HELD must fail (terminal state)', () => {
  const result = validateEscrowTransition('RELEASED', 'HELD');
  assert(result.valid === false, 'RELEASED → HELD should be invalid (terminal)');
  assert(
    result.reason?.includes('terminal state RELEASED') ?? false,
    'Error should mention terminal state'
  );
});

test('ILLEGAL: RELEASED → DISPUTED must fail (terminal state)', () => {
  const result = validateEscrowTransition('RELEASED', 'DISPUTED');
  assert(result.valid === false, 'RELEASED is terminal — no further transitions');
});

test('ILLEGAL: RELEASED → REFUNDED must fail (terminal state)', () => {
  const result = validateEscrowTransition('RELEASED', 'REFUNDED');
  assert(result.valid === false, 'RELEASED → REFUNDED should be invalid (terminal)');
});

test('ILLEGAL: REFUNDED → HELD must fail (terminal state)', () => {
  const result = validateEscrowTransition('REFUNDED', 'HELD');
  assert(result.valid === false, 'REFUNDED is terminal — no further transitions');
  assert(
    result.reason?.includes('terminal state REFUNDED') ?? false,
    'Error should mention terminal state'
  );
});

test('ILLEGAL: same-status transition must fail', () => {
  const result = validateEscrowTransition('HELD', 'HELD');
  assert(result.valid === false, 'Same-status no-op should be invalid');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Ledger Type Mapping
// ─────────────────────────────────────────────────────────────────────────────

test('getLedgerTypeForTransition: PENDING→HELD returns HOLD', () => {
  assert(getLedgerTypeForTransition('PENDING', 'HELD') === 'HOLD', 'Expected HOLD');
});

test('getLedgerTypeForTransition: HELD→RELEASED returns RELEASE', () => {
  assert(getLedgerTypeForTransition('HELD', 'RELEASED') === 'RELEASE', 'Expected RELEASE');
});

test('getLedgerTypeForTransition: HELD→DISPUTED returns DISPUTE_FREEZE', () => {
  assert(getLedgerTypeForTransition('HELD', 'DISPUTED') === 'DISPUTE_FREEZE', 'Expected DISPUTE_FREEZE');
});

test('getLedgerTypeForTransition: HELD→REFUNDED returns REFUND', () => {
  assert(getLedgerTypeForTransition('HELD', 'REFUNDED') === 'REFUND', 'Expected REFUND');
});

test('getLedgerTypeForTransition: DISPUTED→REFUNDED returns REFUND', () => {
  assert(getLedgerTypeForTransition('DISPUTED', 'REFUNDED') === 'REFUND', 'Expected REFUND');
});

test('getLedgerTypeForTransition: invalid transition throws', () => {
  assertThrows(() => getLedgerTypeForTransition('RELEASED', 'PENDING'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Poisha Integer Arithmetic
// ─────────────────────────────────────────────────────────────────────────────

test('Poisha: 25000 BDT = 2500000 poisha (integer)', () => {
  const result = bdtToPoisha(25000);
  assert(result === BigInt(2500000), `Expected 2500000n, got ${result}`);
});

test('Poisha: 1 BDT = 100 poisha', () => {
  assert(bdtToPoisha(1) === BigInt(100), 'bdtToPoisha(1) should equal 100n');
});

test('Poisha: 0.10 BDT = 10 poisha (no float drift)', () => {
  assert(bdtToPoisha(0.1) === BigInt(10), 'bdtToPoisha(0.1) should be exactly 10n');
});

test('Poisha: 0.10 + 0.20 BDT = 30 poisha (proves integer math avoids 0.1+0.2=0.30000000...4)', () => {
  const tenPoisha = bdtToPoisha(0.1);
  const twentyPoisha = bdtToPoisha(0.2);
  const sum = tenPoisha + twentyPoisha;
  assert(sum === BigInt(30), `Expected 30n, got ${sum}`);
});

test('Poisha: poishaToBdt(2500000) = 25000', () => {
  assert(poishaToBdt(BigInt(2500000)) === 25000, 'poishaToBdt(2500000n) should equal 25000');
});

test('Poisha: formatPoishaToBDT(1500000) contains ৳15,000', () => {
  const formatted = formatPoishaToBDT(BigInt(1500000));
  assert(formatted.includes('15,000') || formatted.includes('15000'), `Unexpected format: ${formatted}`);
});

test('Poisha: platform fee 1.5% of 100 BDT = 1 BDT 50 poisha = 150 poisha', () => {
  const fee = calculatePlatformFee(bdtToPoisha(100));
  assert(fee === BigInt(150), `Expected 150n platform fee, got ${fee}`);
});

test('Poisha: large amount 8000000 poisha (80,000 BDT) is preserved exactly', () => {
  const bdt = poishaToBdt(BigInt(8000000));
  assert(bdt === 80000, `Expected 80000, got ${bdt}`);
});

test('Poisha: bdtToPoisha throws on invalid input', () => {
  assertThrows(() => bdtToPoisha('not-a-number'), 'Invalid BDT currency');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EscrowTransitionError class
// ─────────────────────────────────────────────────────────────────────────────

test('EscrowTransitionError carries currentStatus and targetStatus', () => {
  const err = new EscrowTransitionError('PENDING', 'RELEASED', 'Custom reason');
  assert(err.currentStatus === 'PENDING', 'currentStatus should be PENDING');
  assert(err.targetStatus === 'RELEASED', 'targetStatus should be RELEASED');
  assert(err.name === 'EscrowTransitionError', 'name should be EscrowTransitionError');
  assert(err.message === 'Custom reason', 'message should match');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Ethos AI — Escrow API Reliability & Edge-Case QA Suite');
console.log('  Issue #11 (K-15) | Assignee: @Taha-Mim-Tasfa');
console.log('═══════════════════════════════════════════════════════════════');

results.forEach(({ name, ok, details }) => {
  const icon = ok ? '  ✅' : '  ❌';
  console.log(`${icon} ${name}`);
  if (!ok && details) console.log(`       └─ ${details}`);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed / ${failed} failed / ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
