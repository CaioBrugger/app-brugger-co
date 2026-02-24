# ============================================================
# Brugger CO Toolbox — Setup Local
# Execute uma vez por PC: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
# ============================================================

$projectRoot = (Get-Item "$PSScriptRoot\..").FullName.Replace('\', '/')
$appRoot     = (Get-Item "$PSScriptRoot\..\..").FullName.Replace('\', '/')
$local       = Join-Path $env:LOCALAPPDATA "brugger-co"
$configDir   = Join-Path $env:LOCALAPPDATA "brugger-co-config"
$modulesDir  = Join-Path $local "node_modules"

Write-Host ""
Write-Host "==> Configurando Brugger CO Toolbox..." -ForegroundColor Cyan
Write-Host "    Projeto : $projectRoot"
Write-Host "    Modulos : $modulesDir"
Write-Host ""

# 1. Criar diretórios locais
New-Item -ItemType Directory -Force $local      | Out-Null
New-Item -ItemType Directory -Force $configDir  | Out-Null

# 2. Instalar dependências localmente (fora do Google Drive)
Write-Host "==> Instalando dependências (pode demorar na primeira vez)..." -ForegroundColor Yellow
Copy-Item "$PSScriptRoot\..\package.json" "$local\package.json" -Force
Push-Location $local
npm install
Pop-Location

# 3. Criar junction de node_modules no diretório de config
if (!(Test-Path "$configDir\node_modules")) {
    cmd /c "mklink /J `"$configDir\node_modules`" `"$modulesDir`"" | Out-Null
    Write-Host "==> Junction criada: $configDir\node_modules" -ForegroundColor Green
}

# 4. Gerar vite.config.js com caminhos corretos para este PC
$externalModules = $modulesDir.Replace('\', '/')
$configDirFwd    = $configDir.Replace('\', '/')

$viteConfig = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot     = '$projectRoot';
const externalModules = '$externalModules';

export default defineConfig({
  root: projectRoot,
  cacheDir: '$configDirFwd/.vite',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^(?!@vite\/)([a-zA-Z@][^:]*)$/,
        replacement: externalModules + '/`$1'
      }
    ]
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['react-markdown', 'remark-gfm', 'gray-matter'],
    esbuildOptions: { nodePaths: [externalModules] },
  },
  server: {
    port: 3000,
    open: true,
    watch: { usePolling: true, interval: 1000 },
    fs: { allow: [projectRoot, '$appRoot', externalModules, '$configDirFwd'] },
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        headers: { 'anthropic-dangerous-direct-browser-access': 'true' }
      }
    }
  },
  assetsInclude: ['**/*.md']
});
"@

$viteConfig | Out-File -FilePath "$configDir\vite.config.js" -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "==> Setup concluido!" -ForegroundColor Green
Write-Host "    Execute 'npm run dev' para iniciar o servidor." -ForegroundColor Cyan
Write-Host ""
