import test from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase } from '../server/db.ts'
import { addBook, listBooks, setStatus } from '../server/books.ts'

test('a new book starts on the want to read list', () => {
  const db = openDatabase(':memory:')
  const book = addBook(db, 'Tidy First?', 'Kent Beck')
  assert.equal(book.status, 'want')
  assert.equal(listBooks(db).length, 1)
})

test('a book needs a title and an author', () => {
  const db = openDatabase(':memory:')
  assert.throws(() => addBook(db, ' ', 'Kent Beck'), /title/)
  assert.throws(() => addBook(db, 'Tidy First?', ''), /author/)
})

test('finishing a book records the day', () => {
  const db = openDatabase(':memory:')
  const { id } = addBook(db, 'Tidy First?', 'Kent Beck')
  assert.equal(setStatus(db, id, 'finished', '2026-11-20').finished_on, '2026-11-20')
})

test('moving a book back off finished clears the day', () => {
  const db = openDatabase(':memory:')
  const { id } = addBook(db, 'Tidy First?', 'Kent Beck')
  setStatus(db, id, 'finished', '2026-11-20')
  assert.equal(setStatus(db, id, 'reading', '2026-11-21').finished_on, null)
})
