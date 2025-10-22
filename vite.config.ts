import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Configure the dev server to use HTTPS, which is required for camera access
      // FIX: Removed `https: true` property as it conflicts with the `basicSsl` plugin which handles HTTPS setup.
      server: {
        host: true, // Listen on all network interfaces
      },
      plugins: [
        basicSsl() // Use the SSL plugin
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.GOOGLE_SEARCH_API_KEY': JSON.stringify(env.GOOGLE_SEARCH_API_KEY),
        'process.env.GOOGLE_CSE_ID': JSON.stringify(env.GOOGLE_CSE_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});