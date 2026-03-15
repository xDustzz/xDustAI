import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Memuat env dari root folder
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // './' adalah pilihan terbaik untuk hybrid (Electron + GH Pages).
    // Ini memastikan aset dipanggil relatif terhadap index.html.
    base: mode === 'production' ? './' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        // Memperbaiki penulisan resolve agar lebih standar
        '@': path.resolve(__dirname, './src'), 
      }
    },

    build: {
      // Memastikan folder hasil build adalah 'dist'
      outDir: 'dist',
      // Mengecilkan ukuran file agar loading di web lebih cepat
      chunkSizeWarningLimit: 1600,
    }
  };
});