import path from 'node:path'
import { createRequire } from 'node:module'

const frontendDirectory = path.resolve(import.meta.dirname, '..', 'frontend')
const frontendRequire = createRequire(path.join(frontendDirectory, 'package.json'))
const { defineConfig } = frontendRequire('vite')
const react = frontendRequire('@vitejs/plugin-react').default
const tailwindcss = frontendRequire('@tailwindcss/vite').default

export default defineConfig({
  root: frontendDirectory,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.join(frontendDirectory, 'src') }
  }
})
