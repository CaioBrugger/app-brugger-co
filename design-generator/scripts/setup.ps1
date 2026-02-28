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

# 5. Gerar scripts/dev.js com caminhos corretos para este PC
$scriptsDir = Join-Path $local "scripts"
New-Item -ItemType Directory -Force $scriptsDir | Out-Null

$localFwd      = $local.Replace('\', '/')
$configDirFwdE = $configDir.Replace('\', '/')

$devScript = @"
/**
 * scripts/dev.js — gerado automaticamente pelo setup.ps1
 * Inicia design-cloner-server (3333) + Vite (3000) em conjunto.
 */
import { spawn } from 'child_process';
import { copyFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const APPDATA_ROOT = resolve(__dirname, '..');
const CONFIG_DIR   = '$configDirFwdE';
const VITE_CONFIG  = join(CONFIG_DIR, 'vite.config.js');
const SERVER_PORT  = 3333;
const SERVER_URL   = `http://localhost:`+`${SERVER_PORT}/health`;

// Sincronizar server.js
const serverDst = join(APPDATA_ROOT, 'design-cloner-server.cjs');
const serverSrc = '$appRoot/design-cloner-server/server.js';
if (existsSync(serverSrc)) {
    try { copyFileSync(serverSrc, serverDst); console.log('\x1b[36m[dev]\x1b[0m \u2713 design-cloner-server.cjs sincronizado'); }
    catch (e) { console.warn('\x1b[33m[dev]\x1b[0m \u26a0 Falha ao sincronizar server.js:', e.message); }
}

async function waitForServer(url, ms = 20000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
        try { const r = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (r.ok) return true; } catch {}
        await new Promise(r => setTimeout(r, 300));
    }
    return false;
}

let designClonerProc = null;
if (existsSync(serverDst)) {
    console.log(`\x1b[36m[dev]\x1b[0m Iniciando design-cloner-server na porta `+`${SERVER_PORT}...`);
    designClonerProc = spawn('node', ['design-cloner-server.cjs'], { cwd: APPDATA_ROOT, stdio: ['ignore','pipe','pipe'] });
    designClonerProc.stdout.on('data', d => process.stdout.write('\x1b[36m[design-cloner]\x1b[0m ' + d));
    designClonerProc.stderr.on('data', d => process.stderr.write('\x1b[36m[design-cloner]\x1b[0m ' + d));
    const ready = await waitForServer(SERVER_URL, 20000);
    if (ready) console.log(`\x1b[36m[dev]\x1b[0m \u2713 design-cloner-server pronto em http://localhost:`+`${SERVER_PORT}`);
    else console.warn('\x1b[33m[dev]\x1b[0m \u26a0 design-cloner-server nao respondeu a tempo.');
}

const viteBin  = join(APPDATA_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const viteArgs = ['--config', VITE_CONFIG];
if (process.argv[2] === 'build')   viteArgs.unshift('build');
if (process.argv[2] === 'preview') viteArgs.unshift('preview');

console.log('\x1b[35m[dev]\x1b[0m Iniciando Vite...');
const viteProc = spawn('node', [viteBin, ...viteArgs], { cwd: APPDATA_ROOT, stdio: 'inherit' });
viteProc.on('exit', code => { if (designClonerProc) { try { designClonerProc.kill(); } catch {} } process.exit(code ?? 0); });

const cleanup = () => {
    if (designClonerProc) { try { designClonerProc.kill(); } catch {} }
    if (viteProc)          { try { viteProc.kill();          } catch {} }
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
"@

$devScript | Out-File -FilePath "$scriptsDir\dev.js" -Encoding utf8 -NoNewline
Write-Host "==> scripts/dev.js gerado em $scriptsDir" -ForegroundColor Green

Write-Host ""
Write-Host "==> Setup concluido!" -ForegroundColor Green
Write-Host "    Execute 'npm run dev' para iniciar Vite + design-cloner-server juntos." -ForegroundColor Cyan
Write-Host ""
