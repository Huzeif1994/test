@echo off
title Playwright Admin Portal Test
cd /d "%~dp0"
echo ========================================================
echo   Running ADMIN PORTAL Test in Headed Mode
echo ========================================================
call npx playwright test --project=admin --headed
pause

