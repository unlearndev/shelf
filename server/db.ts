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
  return db
}
