type Status = 'want' | 'reading' | 'finished'

type Book = {
  id: number
  title: string
  author: string
  status: Status
  finished_on: string | null
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

const shelf = document.querySelector<HTMLElement>('#shelf')!
const form = document.querySelector<HTMLFormElement>('#add-book')!

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

async function render() {
  const books = await api<Book[]>('/api/books')
  shelf.replaceChildren(
    ...COLUMNS.map(({ status, heading }) => {
      const column = document.createElement('section')
      column.className = 'column'
      const books_ = books.filter((book) => book.status === status)
      column.innerHTML = `<h2>${heading} <span class="count">${books_.length}</span></h2>`
      column.append(...books_.map(bookCard))
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
