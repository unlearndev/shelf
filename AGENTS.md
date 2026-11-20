# Shelf

A reading list: books you want to read, books you're reading, and books you've finished.

- `npm run dev` serves the app and its API. The API in `server/` is mounted into Vite's dev server, so there's no separate backend.
- `npm run check` runs the type check and the tests (`node:test`). Run it before every commit.
- `npm run db:seed` resets the local database (`data/shelf.db`).
- `server/db.ts` creates the tables. Add a column with an `ALTER TABLE` migration there, so existing databases keep working.
- Keep the API thin: rules about books live in `server/`, next to the table they touch, with tests in `test/`.
