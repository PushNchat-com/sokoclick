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

# Ensure netlify.toml is included
if (-not (Test-Path dist/netlify.toml) -and (Test-Path netlify.toml)) {
    Write-Host "Copying netlify.toml to dist..." -ForegroundColor Yellow
    Copy-Item -Path netlify.toml -Destination dist/netlify.toml -ErrorAction SilentlyContinue
}

# Create 404.html for client-side routing fallback
if (-not (Test-Path dist/404.html)) {
    Write-Host "Adding 404.html for better client-side routing..." -ForegroundColor Yellow
    $html = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SokoClick | Redirecting...</title>
  <script>
    // Save the current path for redirection after going to index
    sessionStorage.setItem('redirectPath', window.location.pathname + window.location.search);
    window.location.href = '/';
  </script>
</head>
<body>
  <p>Redirecting to SokoClick...</p>
</body>
</html>
"@
    Set-Content -Path dist/404.html -Value $html
}

# Add routing test file for verification
if (-not (Test-Path dist/routing-test.html)) {
    Write-Host "Adding routing-test.html for deployment verification..." -ForegroundColor Yellow
    $testHtml = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SPA Routing Test</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #4f46e5; }
  </style>
</head>
<body>
  <h1>SPA Routing Test</h1>
  <p>If you can see this page, static file serving is working correctly.</p>
  <p>Current time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
  <p><a href="/">Go to homepage</a></p>
</body>
</html>
"@
    Set-Content -Path dist/routing-test.html -Value $testHtml
}

# Verification
Write-Host "`n✅ Build and verification complete!" -ForegroundColor Green
Write-Host "- Build output is in ./dist"
Write-Host "- _redirects file: $(if (Test-Path dist/_redirects) { 'Present ✓' } else { 'MISSING! ❌' })"
Write-Host "- index.html file: $(if (Test-Path dist/index.html) { 'Present ✓' } else { 'MISSING! ❌' })"
Write-Host "- netlify.toml: $(if (Test-Path dist/netlify.toml) { 'Present ✓' } else { 'Not present (using repo config)' })"
Write-Host "- 404.html file: $(if (Test-Path dist/404.html) { 'Present ✓' } else { 'MISSING! ❌' })"

Write-Host "`nTo deploy manually, run: netlify deploy --prod" -ForegroundColor Cyan
Write-Host "Or commit and push for automatic deployment if CI is set up."

# Optional: Display the content of the redirects file
if (Test-Path dist/_redirects) {
    Write-Host "`n_redirects file content:" -ForegroundColor Cyan
    Get-Content -Path dist/_redirects
} 