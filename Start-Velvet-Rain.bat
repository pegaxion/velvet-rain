@echo off
title VelvetRain Dev Server
cd /d "%~dp0"
echo ===================================================
echo   VelvetRain — Ambient Sleep & Focus Sound Mixer
echo ===================================================
echo.
echo Starting local test server at http://localhost:3030 ...
echo Press Ctrl+C anytime to stop.
echo.
node server.js
pause
