import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [cesium()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          ol: ['ol'],
          milsymbol: ['milsymbol']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/geoserver': {
        target: 'http://localhost:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geoserver/, '/geoserver')
      }
    }
  }
});
