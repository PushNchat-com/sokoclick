@echo off
echo Cleaning Vite cache folders for PNPM project...

:: Remove all Vite caches (PNPM specific paths)
rd /s /q "node_modules\.vite" 2>nul
echo .vite cache cleaned from node_modules

rd /s /q "node_modules\.cache" 2>nul
echo .cache directory cleaned from node_modules

rd /s /q ".vite" 2>nul
echo .vite cache cleaned from project root

rd /s /q ".vite-optimize-deps" 2>nul
echo Optimized deps cache cleaned

:: Also try to clean browser caches stored in temp directory
rd /s /q "%TEMP%\vite-optimizer-deps" 2>nul
echo Browser cache cleaned (if present)

:: Create an empty .vite directory to ensure permissions are set correctly
mkdir "node_modules\.vite" 2>nul
echo Created empty .vite directory

echo.
echo Vite cache has been cleared.
echo To fix the issue: 
echo 1. Run this script
echo 2. Start development server with: pnpm run dev --force
echo.
pause 