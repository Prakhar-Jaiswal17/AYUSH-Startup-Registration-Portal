const { app, BrowserWindow, shell, dialog } = require('electron')
const { spawn } = require('node:child_process')
const path = require('node:path')
const http = require('node:http')

const websiteDirectory = path.resolve(__dirname, '..', 'frontend')
const websiteUrl = 'http://127.0.0.1:5173'
let websiteProcess
let ownsWebsiteProcess = false

function isWebsiteRunning() {
  return new Promise(resolve => {
    const request = http.get(websiteUrl, response => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })
    request.setTimeout(700, () => { request.destroy(); resolve(false) })
    request.on('error', () => resolve(false))
  })
}

async function startWebsite() {
  if (await isWebsiteRunning()) return
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  websiteProcess = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: websiteDirectory, stdio: 'ignore', windowsHide: true
  })
  ownsWebsiteProcess = true
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isWebsiteRunning()) return
    if (websiteProcess.exitCode !== null) break
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  throw new Error('The React website did not start. Check that frontend dependencies are installed and port 5173 is available.')
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1420, height: 920, minWidth: 1040, minHeight: 700,
    title: 'AYUSH Setu Desktop',
    backgroundColor: '#f6f8f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  window.loadURL(websiteUrl)
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  try { await startWebsite() } catch (error) {
    await dialog.showMessageBox({ type: 'error', title: 'AYUSH Setu Desktop', message: error.message })
    app.quit(); return
  }
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('before-quit', () => {
  if (ownsWebsiteProcess && websiteProcess && websiteProcess.exitCode === null) websiteProcess.kill()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
