# Shelf

A small reading list app: what you want to read, what you're reading, and what you've finished. It's the demo project for the Unlearn course **Ship Big Features in Small, Stacked Pull Requests**.

## Run it

You need Node 22.18 or later.

```bash
npm install
npm run db:seed  # start the database again from the seed data
npm run dev      # http://localhost:5173
npm run check    # the type check and the tests
```

## How it's built

- `server/`: the API (plain Node, mounted into Vite's dev server), with SQLite through `node:sqlite`
- `src/`: the page, plain TypeScript
- `test/`: `node:test` tests, run straight from TypeScript
- `.github/workflows/checks.yml`: runs `npm run typecheck` and `npm test` on every pull request
