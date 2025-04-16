#!/usr/bin/env pwsh
# Netlify deployment script for SokoClick
# This script ensures all required files are properly included in the build

Write-Host "🚀 Starting SokoClick Netlify deployment process..." -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location -Path $PSScriptRoot

# Clean build directory
if (Test-Path dist) {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item -Path dist -Recurse -Force
}

# Install dependencies if needed
if (-not (Test-Path node_modules)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pnpm install
}

# Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
pnpm run build

# Verify _redirects file exists in dist folder (should be created by vite plugin)
if (-not (Test-Path dist/_redirects)) {
    Write-Host "⚠️ _redirects file is missing! Creating it manually..." -ForegroundColor Red
    Set-Content -Path dist/_redirects -Value "/* /index.html 200"
}

# Verify index.html exists
if (-not (Test-Path dist/index.html)) {
    Write-Host "❌ ERROR: index.html is missing from the build output!" -ForegroundColor Red
    exit 1
}

# Check if netlify.toml exists in dist folder
if (-not (Test-Path dist/netlify.toml)) {
    Write-Host "Copying netlify.toml to dist..." -ForegroundColor Yellow
    Copy-Item -Path netlify.toml -Destination dist/netlify.toml -ErrorAction SilentlyContinue
}

# Verification
Write-Host "`n✅ Build and verification complete!" -ForegroundColor Green
Write-Host "- Build output is in ./dist"
Write-Host "- _redirects file: $(if (Test-Path dist/_redirects) { 'Present ✓' } else { 'MISSING! ❌' })"
Write-Host "- index.html file: $(if (Test-Path dist/index.html) { 'Present ✓' } else { 'MISSING! ❌' })"
Write-Host "- netlify.toml: $(if (Test-Path dist/netlify.toml) { 'Present ✓' } else { 'Not present (using repo config)' })"

Write-Host "`nTo deploy manually, run: netlify deploy --prod" -ForegroundColor Cyan
Write-Host "Or commit and push for automatic deployment if CI is set up." 