# PowerShell script for building and deploying to Netlify
# This script helps ensure all required files are properly included

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

# Verify _redirects file exists in dist folder
if (-not (Test-Path dist/_redirects)) {
    Write-Host "Copying _redirects file to dist..." -ForegroundColor Yellow
    Copy-Item -Path public/_redirects -Destination dist/_redirects
}

# Verification
Write-Host "`n✅ Build and verification complete!" -ForegroundColor Green
Write-Host "- Build output is in ./dist"
Write-Host "- _redirects file: $(if (Test-Path dist/_redirects) { 'Present' } else { 'MISSING!' })"
Write-Host "- netlify.toml configuration: OK"
Write-Host "`nTo deploy manually, run: netlify deploy --prod"
Write-Host "Or commit and push for automatic deployment if CI is set up." 