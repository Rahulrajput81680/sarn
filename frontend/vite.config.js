import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

export default defineConfig({
  // mkcert() generates a locally-trusted HTTPS cert so `npm run dev` serves over
  // https:// — required for Facebook's Embedded Signup (FB.login refuses http pages).
  plugins: [react(), mkcert()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    https: true,
  },
})
