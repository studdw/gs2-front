import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// React + Vite + Tailwind CSS (plugin oficial do Tailwind v4 para o Vite)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
