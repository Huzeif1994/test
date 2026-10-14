@echo off
title Playwright Test Runner UI
cd /d "%~dp0"
echo ========================================================
echo   Launching Playwright Interactive UI Runner
echo ========================================================
call npx playwright test --ui
pause

