import { DatabaseSync } from 'node:sqlite'

export type DB = DatabaseSync

export function openDatabase(path = 'data/shelf.db'): DB {
  const db = new DatabaseSync(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'want' CHECK (status IN ('want', 'reading', 'finished')),
      finished_on TEXT
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      year INTEGER PRIMARY KEY,
      target INTEGER NOT NULL CHECK (target > 0)
    )
  `)
  migrate(db)
  return db
}

// Columns added after the first release. Each one checks before it runs,
// so opening an existing database is safe.
function migrate(db: DB) {
  const columns = db.prepare('PRAGMA table_info(books)').all() as { name: string }[]
  const has = (name: string) => columns.some((column) => column.name === name)

  if (!has('rating')) {
    db.exec('ALTER TABLE books ADD COLUMN rating INTEGER')
  }
  if (!has('rated_on')) {
    db.exec('ALTER TABLE books ADD COLUMN rated_on TEXT')
  }
}
