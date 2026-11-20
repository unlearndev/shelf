import type { IncomingMessage, ServerResponse } from 'node:http'
import { openDatabase, type DB } from './db.ts'
import { addBook, listBooks, setStatus, type Status } from './books.ts'
import { clearRating, rateBook } from './ratings.ts'
import { SORTS, shelfStats, sortBooks, type SortBy } from './stats.ts'

let db: DB | undefined
const database = () => (db ??= openDatabase())

const today = () => new Date().toISOString().slice(0, 10)

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export async function route(conn: DB, req: IncomingMessage): Promise<[number, unknown]> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const statusMatch = url.pathname.match(/^\/api\/books\/(\d+)\/status$/)
  const ratingMatch = url.pathname.match(/^\/api\/books\/(\d+)\/rating$/)

  if (req.method === 'GET' && url.pathname === '/api/books') {
    const sort = (url.searchParams.get('sort') ?? 'added') as SortBy
    if (!SORTS.includes(sort)) return [400, { error: `You can sort by ${SORTS.join(', ')}` }]
    return [200, sortBooks(listBooks(conn), sort)]
  }
  if (req.method === 'GET' && url.pathname === '/api/stats') {
    return [200, shelfStats(listBooks(conn))]
  }
  if (req.method === 'POST' && url.pathname === '/api/books') {
    const { title, author } = await readJson(req)
    return [201, addBook(conn, String(title ?? ''), String(author ?? ''))]
  }
  if (req.method === 'PATCH' && statusMatch) {
    const { status } = await readJson(req)
    return [200, setStatus(conn, Number(statusMatch[1]), status as Status, today())]
  }
  if (req.method === 'PUT' && ratingMatch) {
    const { stars } = await readJson(req)
    return [200, rateBook(conn, Number(ratingMatch[1]), Number(stars), today())]
  }
  if (req.method === 'DELETE' && ratingMatch) {
    return [200, clearRating(conn, Number(ratingMatch[1]))]
  }
  return [404, { error: 'Not found' }]
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const [status, data] = await route(database(), req)
    send(res, status, data)
  } catch (error) {
    send(res, 400, { error: (error as Error).message })
  }
}
