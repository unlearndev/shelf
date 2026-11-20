import test from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase } from '../server/db.ts'
import { getGoal, setGoal } from '../server/goals.ts'

test('a goal can be set for a year', () => {
  const db = openDatabase(':memory:')
  setGoal(db, 2026, 12)
  assert.deepEqual(getGoal(db, 2026), { year: 2026, target: 12 })
})

test('setting a goal again replaces it', () => {
  const db = openDatabase(':memory:')
  setGoal(db, 2026, 12)
  setGoal(db, 2026, 20)
  assert.equal(getGoal(db, 2026)?.target, 20)
})

test('each year has its own goal', () => {
  const db = openDatabase(':memory:')
  setGoal(db, 2026, 12)
  assert.equal(getGoal(db, 2027), null)
})

test('a goal has to be a whole number of books from 1 to 365', () => {
  const db = openDatabase(':memory:')
  assert.throws(() => setGoal(db, 2026, 0), /between 1 and 365/)
  assert.throws(() => setGoal(db, 2026, 400), /between 1 and 365/)
  assert.throws(() => setGoal(db, 2026, 2.5), /whole number/)
})
