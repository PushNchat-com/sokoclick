# PowerShell script to analyze build output and verify SPA routing files
# Run this after building the project to ensure proper deployment setup

# Navigate to frontend directory if needed
Set-Location -Path $PSScriptRoot

$distDir = "dist"
$issues = @()
$warnings = @()

Write-Host "🔍 Analyzing build output in $distDir..." -ForegroundColor Blue

# Check if dist directory exists
if (-not (Test-Path $distDir)) {
    Write-Host "❌ ERROR: Build directory '$distDir' not found. Run 'pnpm run build' first." -ForegroundColor Red
    exit 1
}

# Check for _redirects file
if (-not (Test-Path "$distDir/_redirects")) {
    $issues += "Missing _redirects file in the build output"
    # Try to fix it
    if (Test-Path "public/_redirects") {
        Write-Host "⚠️ Copying _redirects file from public to $distDir..." -ForegroundColor Yellow
        Copy-Item -Path "public/_redirects" -Destination "$distDir/_redirects"
        $warnings += "_redirects file was missing but has been fixed"
    } else {
        $issues += "public/_redirects file is also missing"
    }
}

# Check redirects file content
if (Test-Path "$distDir/_redirects") {
    $redirectsContent = Get-Content "$distDir/_redirects" -Raw
    if (-not ($redirectsContent -match "/* /index.html 200")) {
        $issues += "_redirects file doesn't contain proper SPA routing rule"
    }
}

# Check for netlify.toml
if (-not (Test-Path "netlify.toml")) {
    $warnings += "netlify.toml file not found in project root"
} else {
    $netlifyContent = Get-Content "netlify.toml" -Raw
    if (-not ($netlifyContent -match "\[\[redirects\]\]" -and 
              $netlifyContent -match "from = " -and 
              $netlifyContent -match "to = ")) {
        $warnings += "netlify.toml might not have proper redirects configuration"
    }
}

# Check for index.html
if (-not (Test-Path "$distDir/index.html")) {
    $issues += "Missing index.html in build output"
}

# Output results
Write-Host "`n📊 Build Analysis Results:" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All checks passed! Your build looks good for SPA deployment." -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host "`n❌ Critical Issues:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️ Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n📝 Summary:" -ForegroundColor Cyan
Write-Host "  - Build directory: $(if (Test-Path $distDir) { '✅' } else { '❌' })"
Write-Host "  - _redirects file: $(if (Test-Path "$distDir/_redirects") { '✅' } else { '❌' })"
Write-Host "  - netlify.toml:    $(if (Test-Path "netlify.toml") { '✅' } else { '❌' })"
Write-Host "  - index.html:      $(if (Test-Path "$distDir/index.html") { '✅' } else { '❌' })"

# Instructions
if ($issues.Count -gt 0) {
    Write-Host "`n🛠️ Fix the critical issues before deploying!" -ForegroundColor Red
} elseif ($warnings.Count -gt 0) {
    Write-Host "`n🛠️ Consider addressing the warnings for optimal deployment." -ForegroundColor Yellow
} else {
    Write-Host "`n🚀 Ready for deployment!" -ForegroundColor Green
}

Write-Host "`nRun './deploy.ps1' to prepare for deployment or 'netlify deploy' if using Netlify CLI." 