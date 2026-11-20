import type { DB } from './db.ts'

export const MAX_GOAL = 365

export type Goal = {
  year: number
  target: number
}

// How many books you want to finish in a year. Setting it again replaces it.
export function setGoal(db: DB, year: number, target: number): Goal {
  if (!Number.isInteger(target) || target < 1 || target > MAX_GOAL) {
    throw new Error(`A goal needs to be a whole number of books between 1 and ${MAX_GOAL}`)
  }
  db.prepare('INSERT INTO goals (year, target) VALUES (?, ?) ON CONFLICT (year) DO UPDATE SET target = excluded.target').run(
    year,
    target,
  )
  return { year, target }
}

export function getGoal(db: DB, year: number): Goal | null {
  const row = db.prepare('SELECT year, target FROM goals WHERE year = ?').get(year) as Goal | undefined
  return row ? { year: row.year, target: row.target } : null
}
