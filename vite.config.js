import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages — set base to repo name if deploying to username.github.io/pennywise
  // Change 'pennywise' to your actual repo name
  base: '/pennywise/',
})
