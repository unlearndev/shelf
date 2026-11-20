type Status = 'want' | 'reading' | 'finished'
type SortBy = 'added' | 'finished' | 'rating'

type Book = {
  id: number
  title: string
  author: string
  status: Status
  finished_on: string | null
  rating: number | null
  rated_on: string | null
}

type ShelfStats = {
  finished: number
  rated: number
  averageRating: number | null
}

const COLUMNS: { status: Status; heading: string }[] = [
  { status: 'want', heading: 'Want to read' },
  { status: 'reading', heading: 'Reading' },
  { status: 'finished', heading: 'Finished' },
]

const MOVES: Record<Status, { to: Status; label: string }[]> = {
  want: [{ to: 'reading', label: 'Start reading' }],
  reading: [
    { to: 'finished', label: 'Finished' },
    { to: 'want', label: 'Not now' },
  ],
  finished: [{ to: 'reading', label: 'Read again' }],
}

const SORT_LABELS: Record<SortBy, string> = {
  added: 'Date added',
  finished: 'Date finished',
  rating: 'Rating',
}

const shelf = document.querySelector<HTMLElement>('#shelf')!
const form = document.querySelector<HTMLFormElement>('#add-book')!

// The sort only applies to the finished column, and it's remembered between visits.
const savedSort = localStorage.getItem('shelf.sort')
let sortBy: SortBy = savedSort && savedSort in SORT_LABELS ? (savedSort as SortBy) : 'finished'

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

// Five star buttons. Clicking the star that's already the rating clears it.
function stars(book: Book): HTMLElement {
  const row = document.createElement('div')
  row.className = 'stars'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', `Rate ${book.title}`)
  for (let value = 1; value <= 5; value++) {
    const star = document.createElement('button')
    const on = book.rating !== null && value <= book.rating
    star.className = on ? 'star on' : 'star'
    star.textContent = on ? '★' : '☆'
    star.setAttribute('aria-label', `${value} star${value === 1 ? '' : 's'}`)
    star.setAttribute('aria-pressed', String(book.rating === value))
    star.onclick = async () => {
      if (book.rating === value) {
        await api(`/api/books/${book.id}/rating`, 'DELETE')
      } else {
        await api(`/api/books/${book.id}/rating`, 'PUT', { stars: value })
      }
      render()
    }
    row.append(star)
  }
  return row
}

function bookCard(book: Book): HTMLElement {
  const card = document.createElement('article')
  card.className = 'book'
  card.innerHTML = `<h3></h3><p class="author"></p><div class="moves"></div>`
  card.querySelector('h3')!.textContent = book.title
  card.querySelector('.author')!.textContent = book.author
  if (book.finished_on) {
    const finished = document.createElement('p')
    finished.className = 'finished-on'
    finished.textContent = `Finished ${book.finished_on}`
    card.append(finished)
  }
  if (book.status === 'finished') {
    card.insertBefore(stars(book), card.querySelector('.moves'))
  }
  for (const move of MOVES[book.status]) {
    const button = document.createElement('button')
    button.textContent = move.label
    button.onclick = async () => {
      await api(`/api/books/${book.id}/status`, 'PATCH', { status: move.to })
      render()
    }
    card.querySelector('.moves')!.append(button)
  }
  return card
}

function sortPicker(): HTMLElement {
  const label = document.createElement('label')
  label.className = 'sort'
  label.textContent = 'Sort by '
  const select = document.createElement('select')
  for (const [value, text] of Object.entries(SORT_LABELS)) {
    const option = new Option(text, value, false, value === sortBy)
    select.append(option)
  }
  select.onchange = () => {
    sortBy = select.value as SortBy
    localStorage.setItem('shelf.sort', sortBy)
    render()
  }
  label.append(select)
  return label
}

function average(stats: ShelfStats): string {
  if (stats.averageRating === null) return 'Nothing rated yet'
  return `Average ${stats.averageRating.toFixed(1)} ★ from ${stats.rated} rated`
}

async function render() {
  const [books, sorted, stats] = await Promise.all([
    api<Book[]>('/api/books'),
    api<Book[]>(`/api/books?sort=${sortBy}`),
    api<ShelfStats>('/api/stats'),
  ])
  shelf.replaceChildren(
    ...COLUMNS.map(({ status, heading }) => {
      const column = document.createElement('section')
      column.className = 'column'
      const source = status === 'finished' ? sorted : books
      const inColumn = source.filter((book) => book.status === status)
      column.innerHTML = `<h2>${heading} <span class="count">${inColumn.length}</span></h2>`
      if (status === 'finished') {
        const tools = document.createElement('div')
        tools.className = 'column-tools'
        const summary = document.createElement('p')
        summary.className = 'average'
        summary.textContent = average(stats)
        tools.append(summary, sortPicker())
        column.append(tools)
      }
      column.append(...inColumn.map(bookCard))
      return column
    }),
  )
}

form.onsubmit = async (event) => {
  event.preventDefault()
  const data = new FormData(form)
  await api('/api/books', 'POST', { title: data.get('title'), author: data.get('author') })
  form.reset()
  render()
}

render()
