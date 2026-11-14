const { spawn } = require('node:child_process')
const path = require('node:path')

const executable = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder')
const args = process.argv.slice(2)
const child = spawn(executable, args, {
  cwd: __dirname,
  stdio: 'inherit',
  windowsHide: true,
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    ELECTRON_CACHE: path.join(__dirname, '.cache', 'electron'),
    ELECTRON_BUILDER_CACHE: path.join(__dirname, '.cache', 'electron-builder')
  }
})

child.once('error', error => {
  console.error(`Could not start desktop packaging: ${error.message}`)
  process.exitCode = 1
})
child.once('exit', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1)
})
