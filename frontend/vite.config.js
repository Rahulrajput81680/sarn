import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// vite-plugin-mkcert is dev-only (local HTTPS for Facebook's Embedded Signup, which refuses
// http:// pages) and requires Node >=22.19 via its `undici` dependency. Production builds run
// on older Node (e.g. the VPS) and don't need it at all — prod HTTPS comes from Nginx/certbot —
// so it's dynamically imported only for `vite dev`, never touched during `vite build`.
export default defineConfig(async ({ command }) => {
  const plugins = [react()]
  if (command === 'serve') {
    const { default: mkcert } = await import('vite-plugin-mkcert')
    plugins.push(mkcert())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '127.0.0.1',
      https: command === 'serve',
    },
  }
})
