import test from 'node:test'
import assert from 'node:assert/strict'
import type { Book } from '../server/books.ts'
import { shelfStats, sortBooks } from '../server/stats.ts'

const book = (id: number, fields: Partial<Book> = {}): Book => ({
  id,
  title: `Book ${id}`,
  author: 'Someone',
  status: 'finished',
  finished_on: '2026-01-01',
  rating: null,
  rated_on: null,
  ...fields,
})

test('sorting by rating puts the highest first and unrated books last', () => {
  const books = [book(1, { rating: 3 }), book(2), book(3, { rating: 5 }), book(4, { rating: 3 })]
  assert.deepEqual(
    sortBooks(books, 'rating').map((b) => b.id),
    [3, 1, 4, 2],
  )
})

test('sorting by finished puts the most recent first', () => {
  const books = [
    book(1, { finished_on: '2026-02-01' }),
    book(2, { status: 'reading', finished_on: null }),
    book(3, { finished_on: '2026-09-01' }),
  ]
  assert.deepEqual(
    sortBooks(books, 'finished').map((b) => b.id),
    [3, 1, 2],
  )
})

test('sorting by added keeps the order books were added', () => {
  const books = [book(3), book(1), book(2)]
  assert.deepEqual(
    sortBooks(books, 'added').map((b) => b.id),
    [1, 2, 3],
  )
})

test('sorting leaves the original list alone', () => {
  const books = [book(2, { rating: 1 }), book(1, { rating: 5 })]
  sortBooks(books, 'rating')
  assert.deepEqual(
    books.map((b) => b.id),
    [2, 1],
  )
})

test('the average only counts rated books, to one decimal place', () => {
  const books = [book(1, { rating: 5 }), book(2, { rating: 4 }), book(3, { rating: 4 }), book(4)]
  assert.deepEqual(shelfStats(books), { finished: 4, rated: 3, averageRating: 4.3 })
})

test('with nothing rated there is no average', () => {
  assert.deepEqual(shelfStats([book(1)]), { finished: 1, rated: 0, averageRating: null })
})
