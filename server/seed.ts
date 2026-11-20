import { rmSync } from 'node:fs'
import { openDatabase } from './db.ts'

// Starts the local database again from these books.
rmSync('data/shelf.db', { force: true })

// Finished dates fall in the current year, so a new install always has some
// books finished this year. A date that hasn't happened yet moves back a year.
const today = new Date().toISOString().slice(0, 10)
const year = Number(today.slice(0, 4))
const thisYear = (monthDay: string) => {
  const date = `${year}-${monthDay}`
  return date <= today ? date : `${year - 1}-${monthDay}`
}
const db = openDatabase('data/shelf.db')

const books: [string, string, string, string | null][] = [
  ['The Pragmatic Programmer', 'David Thomas and Andrew Hunt', 'finished', thisYear('01-15')],
  ['A Philosophy of Software Design', 'John Ousterhout', 'finished', thisYear('03-03')],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', 'finished', thisYear('05-21')],
  ['Working Effectively with Legacy Code', 'Michael Feathers', 'finished', thisYear('08-14')],
  ['Tidy First?', 'Kent Beck', 'reading', null],
  ['The Mythical Man-Month', 'Fred Brooks', 'reading', null],
  ['Accelerate', 'Nicole Forsgren, Jez Humble and Gene Kim', 'want', null],
  ['Refactoring', 'Martin Fowler', 'want', null],
  ['Team Topologies', 'Matthew Skelton and Manuel Pais', 'want', null],
]

const insert = db.prepare('INSERT INTO books (title, author, status, finished_on) VALUES (?, ?, ?, ?)')
for (const book of books) insert.run(...book)

console.log(`Seeded ${books.length} books into data/shelf.db`)
