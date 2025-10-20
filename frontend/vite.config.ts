import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Suppress chunk size warning - we're aware of the large bundle
    // due to React, Markdown, PDF generation, and drag-and-drop libraries
    chunkSizeWarningLimit: 1500, // 1.5MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'marked', '@uiw/react-md-editor'],
          'dnd-vendor': ['react-dnd', 'react-dnd-html5-backend', 'reactflow'],
          'pdf-vendor': ['html2pdf.js', 'html2canvas', 'jspdf'],
        },
      },
    },
  },
});
