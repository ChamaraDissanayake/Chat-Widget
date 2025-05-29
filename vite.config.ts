import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'SmartChatWidget',
      fileName: (format) => `smart-chat-widget.${format}.js`,
      formats: ['iife'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [], // make sure react/react-dom are included in bundle
    }
  }
})
