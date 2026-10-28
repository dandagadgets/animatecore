@echo off
title Minetic Bot
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto nonode
if exist .env goto install
echo.
echo  First time setup: paste your bot token below.
echo  Developer Portal - Bot - Reset Token - Copy. Right-click here to paste.
echo.
set /p TOKEN=Token: 
>.env echo DISCORD_TOKEN=%TOKEN%
:install
if exist node_modules goto run
echo Installing, first time only...
call npm install --no-audit --no-fund
:run
echo Starting Minetic Bot... keep this window open.
node src\index.js
pause
exit /b
:nonode
echo Node.js is not installed. Get the LTS version from https://nodejs.org then run this again.
pause
