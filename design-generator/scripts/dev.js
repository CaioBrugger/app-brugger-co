#!/usr/bin/env node
/**
 * Inicia o servidor Vite a partir do diretório local (fora do Google Drive).
 * Executado automaticamente por `npm run dev`.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import os from 'os';
import { existsSync } from 'fs';

const configDir = path.join(os.homedir(), 'AppData', 'Local', 'brugger-co-config');
const vite      = path.join(configDir, 'node_modules', '.bin', 'vite.cmd');

if (!existsSync(vite)) {
    console.error('\n[ERRO] Setup nao encontrado. Execute primeiro:\n');
    console.error('  powershell -ExecutionPolicy Bypass -File scripts/setup.ps1\n');
    process.exit(1);
}

const args = process.argv.slice(2); // passa argumentos extras (ex: build, preview)
const result = spawnSync(`"${vite}"`, args, {
    stdio: 'inherit',
    cwd: configDir,
    shell: true,
});

process.exit(result.status ?? 0);
