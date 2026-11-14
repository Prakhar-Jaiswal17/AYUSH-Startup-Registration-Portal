const { app, BrowserWindow, shell, dialog } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')

const websiteUrl = 'http://127.0.0.1:5173'
const websiteDirectory = path.resolve(__dirname, '..', 'frontend')
const packagedWebsiteDirectory = path.join(process.resourcesPath, 'web')
let websiteProcess
let packagedServer
let ownsWebsiteProcess = false

function requestWebsite(pathname = '/') {
  return new Promise((resolve, reject) => {
    const request = http.get(`${websiteUrl}${pathname}`, response => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { body += chunk })
      response.on('end', () => resolve({ status: response.statusCode, body }))
    })
    request.setTimeout(1500, () => request.destroy(new Error('Desktop website request timed out.')))
    request.on('error', reject)
  })
}

async function isOurDevelopmentSite() {
  try {
    const { status, body } = await requestWebsite('/')
    return status === 200 && /<title>[^<]*AYUSH/i.test(body) && /\/src\/main\.jsx/.test(body)
  } catch {
    return false
  }
}

async function waitForWebsite() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isOurDevelopmentSite()) return
    if (websiteProcess && websiteProcess.exitCode !== null) break
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  throw new Error('The React website did not start. Check frontend dependencies and confirm that port 5173 is available.')
}

async function startDevelopmentWebsite() {
  if (await isOurDevelopmentSite()) return
  // Do not silently display an unrelated service or expose it inside Electron.
  try {
    await requestWebsite('/')
    throw new Error('Port 5173 is already in use by a different website. Close that service and try again.')
  } catch (error) {
    if (error.message.includes('already in use')) throw error
  }

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  websiteProcess = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: websiteDirectory,
    stdio: 'ignore',
    windowsHide: true,
    shell: process.platform === 'win32'
  })
  ownsWebsiteProcess = true
  websiteProcess.once('error', error => { websiteProcess.startError = error })
  await waitForWebsite()
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  return ({
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
  })[extension] || 'application/octet-stream'
}

function startPackagedWebsite() {
  const root = path.resolve(packagedWebsiteDirectory)
  const indexFile = path.join(root, 'index.html')
  if (!fs.existsSync(indexFile)) throw new Error('The packaged website files are missing. Rebuild the desktop app.')

  return new Promise((resolve, reject) => {
    packagedServer = http.createServer((request, response) => {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end()
        return
      }
      let pathname
      try { pathname = decodeURIComponent(new URL(request.url, websiteUrl).pathname) } catch {
        response.writeHead(400).end('Invalid request path')
        return
      }
      const candidate = path.resolve(root, `.${pathname}`)
      if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end('Forbidden')
        return
      }
      const filePath = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : indexFile
      response.writeHead(200, {
        'Content-Type': contentType(filePath),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      })
      if (request.method === 'HEAD') response.end()
      else fs.createReadStream(filePath).pipe(response)
    })
    packagedServer.once('error', error => reject(new Error(`Could not start the desktop website on port 5173: ${error.message}`)))
    packagedServer.listen(5173, '127.0.0.1', resolve)
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    title: 'AYUSH Setu Desktop',
    backgroundColor: '#f6f8f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== websiteUrl && !url.startsWith(`${websiteUrl}/`)) {
      event.preventDefault()
      if (url.startsWith('https://')) shell.openExternal(url)
    }
  })
  window.loadURL(websiteUrl)
}

app.whenReady().then(async () => {
  try {
    if (app.isPackaged) await startPackagedWebsite()
    else await startDevelopmentWebsite()
    createWindow()
  } catch (error) {
    await dialog.showMessageBox({ type: 'error', title: 'AYUSH Setu Desktop', message: error.message })
    app.quit()
    return
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('before-quit', () => {
  if (packagedServer) packagedServer.close()
  if (ownsWebsiteProcess && websiteProcess && websiteProcess.exitCode === null) websiteProcess.kill()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
