@echo off
title Design Cloner Server - Porta 3333
echo.
echo [design-cloner-server] Sincronizando server.cjs...
copy /Y "G:\Meu Drive\Antigravity\Apps\App Brugger CO\design-cloner-server\server.js" "C:\Users\caiob\AppData\Local\brugger-co\design-cloner-server.cjs" > nul
if errorlevel 1 (
    echo [ERRO] Falha ao copiar server.js. Verifique o caminho.
    pause
    exit /b 1
)
echo [design-cloner-server] Iniciando em http://localhost:3333
echo [design-cloner-server] Pressione Ctrl+C para parar
echo.
cd /d "C:\Users\caiob\AppData\Local\brugger-co"
node design-cloner-server.cjs
pause
