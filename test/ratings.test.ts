import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from '../server/db.ts'
import { addBook, listBooks, setStatus } from '../server/books.ts'
import { clearRating, rateBook } from '../server/ratings.ts'

function finishedBook() {
  const db = openDatabase(':memory:')
  const { id } = addBook(db, 'Tidy First?', 'Kent Beck')
  setStatus(db, id, 'finished', '2026-11-20')
  return { db, id }
}

test('a finished book can be rated', () => {
  const { db, id } = finishedBook()
  const book = rateBook(db, id, 4, '2026-11-21')
  assert.equal(book.rating, 4)
  assert.equal(book.rated_on, '2026-11-21')
})

test('a rating can be changed', () => {
  const { db, id } = finishedBook()
  rateBook(db, id, 4, '2026-11-21')
  assert.equal(rateBook(db, id, 5, '2026-11-22').rating, 5)
})

test('a book you have not finished cannot be rated', () => {
  const db = openDatabase(':memory:')
  const { id } = addBook(db, 'Refactoring', 'Martin Fowler')
  assert.throws(() => rateBook(db, id, 4, '2026-11-21'), /finished/)
})

test('a rating has to be a whole number from 1 to 5', () => {
  const { db, id } = finishedBook()
  assert.throws(() => rateBook(db, id, 0, '2026-11-21'), /between 1 and 5/)
  assert.throws(() => rateBook(db, id, 6, '2026-11-21'), /between 1 and 5/)
  assert.throws(() => rateBook(db, id, 4.5, '2026-11-21'), /whole number/)
  assert.throws(() => rateBook(db, id, Number.NaN, '2026-11-21'), /number/)
})

test('rating a book that does not exist fails', () => {
  const db = openDatabase(':memory:')
  assert.throws(() => rateBook(db, 99, 4, '2026-11-21'), /no book/)
})

test('clearing a rating leaves the book unrated', () => {
  const { db, id } = finishedBook()
  rateBook(db, id, 3, '2026-11-21')
  const book = clearRating(db, id)
  assert.equal(book.rating, null)
  assert.equal(book.rated_on, null)
})

test('moving a book off finished keeps its rating', () => {
  const { db, id } = finishedBook()
  rateBook(db, id, 5, '2026-11-21')
  assert.equal(setStatus(db, id, 'reading', '2026-11-22').rating, 5)
})

test('a database from before ratings gets the new columns', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'shelf-')), 'old.db')
  const old = new DatabaseSync(path)
  old.exec(`CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'want', finished_on TEXT)`)
  old.exec(`INSERT INTO books (title, author, status, finished_on) VALUES ('Accelerate', 'Nicole Forsgren', 'finished', '2026-01-02')`)
  old.close()

  const db = openDatabase(path)
  const [book] = listBooks(db)
  assert.equal(book.title, 'Accelerate')
  assert.equal(book.rating, null)
  assert.equal(rateBook(db, book.id, 5, '2026-11-21').rating, 5)
})
