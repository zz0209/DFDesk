import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleApi } from './server/api.js'

function dataApi() {
  return {
    name: 'operations-desk-data-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!(await handleApi(req, res))) next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!(await handleApi(req, res))) next()
      })
    },
  }
}

export default defineConfig({ plugins: [react(), dataApi()] })
