import type { DB } from './db.ts'
import { getBook, type Book } from './books.ts'

export const MIN_RATING = 1
export const MAX_RATING = 5

// Rates a finished book from 1 to 5 stars, and records the day it was rated.
export function rateBook(db: DB, id: number, stars: number, today: string): Book {
  const book = getBook(db, id)
  if (book.status !== 'finished') {
    throw new Error('You can only rate a book you have finished')
  }
  if (typeof stars !== 'number' || Number.isNaN(stars)) {
    throw new Error('A rating needs to be a number')
  }
  if (!Number.isInteger(stars) || stars < MIN_RATING || stars > MAX_RATING) {
    throw new Error(`A rating needs to be a whole number between ${MIN_RATING} and ${MAX_RATING}`)
  }
  db.prepare('UPDATE books SET rating = ?, rated_on = ? WHERE id = ?').run(stars, today, id)
  return getBook(db, id)
}

// Takes a rating off a book, so it shows as unrated again.
export function clearRating(db: DB, id: number): Book {
  getBook(db, id)
  db.prepare('UPDATE books SET rating = NULL, rated_on = NULL WHERE id = ?').run(id)
  return getBook(db, id)
}
