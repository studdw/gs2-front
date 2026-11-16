import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* aqui configuramos o Vite com o React e o plugin oficial do Tailwind v4, rodando na porta 5173 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
