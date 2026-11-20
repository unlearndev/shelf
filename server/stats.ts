import type { Book } from './books.ts'

export type SortBy = 'added' | 'finished' | 'rating'

export const SORTS: SortBy[] = ['added', 'finished', 'rating']

export type ShelfStats = {
  finished: number
  rated: number
  averageRating: number | null
}

// Highest rated first. Unrated books go to the end, in the order they were added.
function byRating(a: Book, b: Book): number {
  if (a.rating === b.rating) return a.id - b.id
  if (a.rating === null) return 1
  if (b.rating === null) return -1
  return b.rating - a.rating
}

// Most recently finished first. Books that aren't finished go to the end.
function byFinished(a: Book, b: Book): number {
  if (a.finished_on === b.finished_on) return a.id - b.id
  if (a.finished_on === null) return 1
  if (b.finished_on === null) return -1
  return b.finished_on.localeCompare(a.finished_on)
}

export function sortBooks(books: Book[], by: SortBy): Book[] {
  const sorted = [...books]
  if (by === 'rating') return sorted.sort(byRating)
  if (by === 'finished') return sorted.sort(byFinished)
  return sorted.sort((a, b) => a.id - b.id)
}

// The average of the rated books, to one decimal place.
export function shelfStats(books: Book[]): ShelfStats {
  const finished = books.filter((book) => book.status === 'finished')
  const ratings = finished.map((book) => book.rating).filter((rating): rating is number => rating !== null)
  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return {
    finished: finished.length,
    rated: ratings.length,
    averageRating: ratings.length ? Math.round((total / ratings.length) * 10) / 10 : null,
  }
}

export type GoalProgress = {
  year: number
  target: number | null
  finished: number
  percent: number | null
}

// Books finished in the given year, against the goal for that year.
export function goalProgress(books: Book[], year: number, target: number | null): GoalProgress {
  const finished = books.filter((book) => book.status === 'finished' && book.finished_on?.startsWith(`${year}-`)).length
  return {
    year,
    target,
    finished,
    percent: target ? Math.min(100, Math.round((finished / target) * 100)) : null,
  }
}
