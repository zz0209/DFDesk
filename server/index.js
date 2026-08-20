import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = join(root, 'dist')
const port = Number(process.env.PORT || 4173)
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
}

createServer(async (req, res) => {
  if (await handleApi(req, res)) return
  const url = new URL(req.url, 'http://localhost')
  const requested = resolve(dist, `.${decodeURIComponent(url.pathname)}`)
  const insideDist = requested === dist || requested.startsWith(`${dist}/`)
  const safePath = insideDist && existsSync(requested) && statSync(requested).isFile() ? requested : join(dist, 'index.html')
  if (!existsSync(safePath)) {
    res.statusCode = 503
    res.end('Run npm run build before npm start.')
    return
  }
  res.setHeader('Content-Type', contentTypes[extname(safePath)] || 'application/octet-stream')
  createReadStream(safePath).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`Operations Desk listening on http://localhost:${port}`)
})
