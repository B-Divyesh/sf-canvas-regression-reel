import { createReadStream } from 'node:fs'
import { access, readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, extname, normalize } from 'node:path'

const root = resolve(import.meta.dirname, '../../dist/site')
const headersFile = await readFile(resolve(root, '_headers'), 'utf8')
const immutable = /Cache-Control: public, max-age=31536000, immutable/.test(headersFile)
if (!immutable) throw new Error('The deployment _headers file must declare immutable fingerprinted asset caching.')
const staticConfig = JSON.parse(await readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'))
const immutableRoutes = new Set(staticConfig.routes
  .filter((route) => route.headers?.['Cache-Control'] === 'public, max-age=31536000, immutable')
  .map((route) => route.route))
if (!immutableRoutes.has('/assets/*')) throw new Error('Azure Static Web Apps config must cache fingerprinted assets immutably.')
if (staticConfig.responseOverrides?.['404']?.rewrite !== '/404.html') throw new Error('Azure Static Web Apps config must rewrite missing pages to the designed 404 document.')
if (!staticConfig.globalHeaders?.['Content-Security-Policy'] || !staticConfig.globalHeaders?.['Permissions-Policy']) throw new Error('Deployment config must include CSP and Permissions Policy headers.')

const types = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
}

function cacheControl(path) {
  if (path.startsWith('/assets/') || immutableRoutes.has(path)) {
    return 'public, max-age=31536000, immutable'
  }
  return 'public, max-age=0, must-revalidate'
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
  let path = decodeURIComponent(requestUrl.pathname)
  if (path.endsWith('/')) path += 'index.html'
  let file = resolve(root, `.${normalize(path)}`)
  if (!file.startsWith(root)) { response.writeHead(403).end(); return }
  try {
    await access(file)
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
    response.writeHead(200, {
      ...staticConfig.globalHeaders,
      'Cache-Control': cacheControl(requestUrl.pathname),
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    })
    createReadStream(file).pipe(response)
  } catch {
    const notFound = resolve(root, '404.html')
    response.writeHead(404, {
      ...staticConfig.globalHeaders,
      'Cache-Control': cacheControl('/404.html'),
      'Content-Type': 'text/html; charset=utf-8',
    })
    createReadStream(notFound).pipe(response)
  }
})

server.listen(4173, '127.0.0.1')
