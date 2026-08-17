import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages uses /hello/; EdgeOne serves this project at the domain root.
  base: process.env.VITE_BASE_PATH || '/hello/',
})
