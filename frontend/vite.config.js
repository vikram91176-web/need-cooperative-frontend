import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the tool that runs the dev server and builds the final files.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // opens the browser automatically on `npm run dev`
  },
})
