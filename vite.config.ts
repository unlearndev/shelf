import { defineConfig, type Plugin } from 'vite'

// Serves the API from Vite's own dev server, so `vite` runs the whole app.
// The API is loaded through Vite, so edits to server/ apply on the next request.
function api(): Plugin {
  return {
    name: 'shelf-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const { handler } = await server.ssrLoadModule('/server/app.ts')
        return handler(req, res, next)
      })
    },
  }
}

export default defineConfig({
  plugins: [api()],
})
