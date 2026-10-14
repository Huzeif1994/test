@echo off
title Playwright Headed Tests
cd /d "%~dp0"
echo ========================================================
echo   Running Playwright Tests in HEADED Mode (Visible Browser)
echo ========================================================
call npm run test:headed
pause

