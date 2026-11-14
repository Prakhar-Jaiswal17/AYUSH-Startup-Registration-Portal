const { spawn } = require('node:child_process')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const frontendDirectory = path.join(projectRoot, 'frontend')
const outputDirectory = path.join(__dirname, 'web-dist')
const configFile = path.join(__dirname, 'vite.desktop.config.mjs')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const child = spawn(npm, ['exec', '--', 'vite', 'build', '--config', configFile, '--outDir', outputDirectory, '--emptyOutDir'], {
  cwd: frontendDirectory,
  stdio: 'inherit',
  windowsHide: true,
  shell: process.platform === 'win32'
})

child.once('error', error => {
  console.error(`Could not start the frontend build: ${error.message}`)
  process.exitCode = 1
})
child.once('exit', (code, signal) => {
  if (signal) process.exitCode = 1
  else process.exitCode = code ?? 1
})
