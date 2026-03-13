// Este arquivo é usado como referência pelo scripts/setup.ps1.
// O vite.config.js ativo é gerado em %LOCALAPPDATA%\brugger-co-config\vite.config.js
// Execute `npm run setup` uma vez para configurar este projeto no seu PC.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  assetsInclude: ['**/*.md']
});
