@echo off
title Shadow of Shinobi - Abrir Contas
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0abrir-contas-jogo.ps1"
echo.
pause
