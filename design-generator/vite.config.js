// Este arquivo é usado como referência pelo scripts/setup.ps1.
// O vite.config.js ativo é gerado em %LOCALAPPDATA%\brugger-co-config\vite.config.js
// Execute `npm run setup` uma vez para configurar este projeto no seu PC.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      }
    }
  },
  assetsInclude: ['**/*.md']
});
