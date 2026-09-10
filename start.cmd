@echo off
cd /d "%~dp0"
set "PATH=%~dp0work\runtime;%PATH%"
"%~dp0work\runtime\node.exe" "%~dp0work\runtime\package\bin\npm-cli.js" run dev
