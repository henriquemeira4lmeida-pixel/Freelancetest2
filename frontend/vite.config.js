import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || ''

  return {
    plugins: [react()],
    base: basePath + '/',
    server: {
      proxy: {
        [`${basePath}/api`]: {
          target: 'http://127.0.0.1:8000',
          rewrite: path => path.replace(new RegExp(`^${basePath}`), ''),
        },
      },
    },
  }
})
