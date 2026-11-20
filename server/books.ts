import type { DB } from './db.ts'

export type Status = 'want' | 'reading' | 'finished'

export type Book = {
  id: number
  title: string
  author: string
  status: Status
  finished_on: string | null
  rating: number | null
  rated_on: string | null
}

const STATUSES: Status[] = ['want', 'reading', 'finished']

export function listBooks(db: DB): Book[] {
  return db.prepare('SELECT * FROM books ORDER BY id').all() as Book[]
}

export function getBook(db: DB, id: number): Book {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined
  if (!book) throw new Error(`There's no book with id ${id}`)
  return book
}

export function addBook(db: DB, title: string, author: string): Book {
  if (!title.trim()) throw new Error('A book needs a title')
  if (!author.trim()) throw new Error('A book needs an author')
  const { lastInsertRowid } = db
    .prepare('INSERT INTO books (title, author) VALUES (?, ?)')
    .run(title.trim(), author.trim())
  return getBook(db, Number(lastInsertRowid))
}

// Moving a book to finished records the day; moving it back clears it,
// along with any rating, since you can only rate a book you've finished.
export function setStatus(db: DB, id: number, status: Status, today: string): Book {
  if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`)
  getBook(db, id)
  if (status === 'finished') {
    db.prepare('UPDATE books SET status = ?, finished_on = ? WHERE id = ?').run(status, today, id)
  } else {
    db.prepare('UPDATE books SET status = ?, finished_on = NULL, rating = NULL, rated_on = NULL WHERE id = ?').run(
      status,
      id,
    )
  }
  return getBook(db, id)
}
