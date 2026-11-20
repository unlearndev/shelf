import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import type { IncomingMessage } from 'node:http'
import { openDatabase } from '../server/db.ts'
import { addBook, setStatus, type Book } from '../server/books.ts'
import { route } from '../server/app.ts'

// A request the router can read: a method, a URL, and an optional JSON body.
function request(method: string, url: string, body?: unknown): IncomingMessage {
  const stream = Readable.from(body === undefined ? [] : [JSON.stringify(body)]) as unknown as IncomingMessage
  return Object.assign(stream, { method, url })
}

function shelf() {
  const db = openDatabase(':memory:')
  for (const [title, author] of [
    ['Tidy First?', 'Kent Beck'],
    ['Refactoring', 'Martin Fowler'],
    ['Accelerate', 'Nicole Forsgren'],
  ]) {
    const { id } = addBook(db, title, author)
    setStatus(db, id, 'finished', '2026-11-20')
  }
  return db
}

test('PUT /api/books/:id/rating rates a book', async () => {
  const db = shelf()
  const [status, book] = await route(db, request('PUT', '/api/books/1/rating', { stars: 4 }))
  assert.equal(status, 200)
  assert.equal((book as Book).rating, 4)
})

test('DELETE /api/books/:id/rating clears it', async () => {
  const db = shelf()
  await route(db, request('PUT', '/api/books/1/rating', { stars: 4 }))
  const [, book] = await route(db, request('DELETE', '/api/books/1/rating'))
  assert.equal((book as Book).rating, null)
})

test('GET /api/books?sort=rating returns the highest rated first', async () => {
  const db = shelf()
  await route(db, request('PUT', '/api/books/1/rating', { stars: 3 }))
  await route(db, request('PUT', '/api/books/3/rating', { stars: 5 }))
  const [, books] = await route(db, request('GET', '/api/books?sort=rating'))
  assert.deepEqual(
    (books as Book[]).map((b) => b.id),
    [3, 1, 2],
  )
})

test('an unknown sort is a 400', async () => {
  const [status] = await route(shelf(), request('GET', '/api/books?sort=colour'))
  assert.equal(status, 400)
})

test('GET /api/stats returns the average rating', async () => {
  const db = shelf()
  await route(db, request('PUT', '/api/books/1/rating', { stars: 4 }))
  await route(db, request('PUT', '/api/books/2/rating', { stars: 5 }))
  const [, stats] = await route(db, request('GET', '/api/stats'))
  assert.deepEqual(stats, { finished: 3, rated: 2, averageRating: 4.5 })
})
