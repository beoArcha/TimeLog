<#
.SYNOPSIS
    Builds release packages for oXyFlow TimeLog with automated pre-flight quality checks.

.DESCRIPTION
    Compatible with Windows PowerShell 5.1 and PowerShell Core 7.x.
    Enforces quality checks (typecheck, lint, cargo clippy, cargo fmt check, tests)
    before initiating production release builds.

.PARAMETER Bundle
    Specifies the bundle target. Options: 'nsis', 'standalone', 'all', 'none'. Default is 'nsis'.

.PARAMETER SkipTests
    Bypasses automated unit and integration tests (for rapid local developer iteration).

.PARAMETER Clean
    Removes the target release directory prior to building.

.PARAMETER DryRun
    Runs all pre-flight quality checks and toolchain verifications without executing the final build.
#>

[CmdletBinding()]
param(
    [ValidateSet("nsis", "standalone", "all", "none")]
    [string]$Bundle = "nsis",

    [switch]$SkipTests,
    [switch]$Clean,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Assert-Tool {
    param([string]$ToolName)
    $tool = Get-Command $ToolName -ErrorAction SilentlyContinue
    if (-not $tool) {
        Write-Failure "Required tool '$ToolName' was not found in PATH."
        exit 1
    }
    Write-Success "Found $ToolName at $($tool.Source)"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Step "Checking Environment & Toolchains"
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
Assert-Tool "bun"
Assert-Tool "cargo"

if ($Clean) {
    Write-Step "Cleaning Build Artifacts"
    $ReleaseDir = Join-Path $ProjectRoot "src-tauri\target\release"
    if (Test-Path $ReleaseDir) {
        Write-Host "Removing $ReleaseDir..."
        Remove-Item -Path $ReleaseDir -Recurse -Force
        Write-Success "Release directory cleaned."
    }
}

if (-not $SkipTests) {
    Write-Step "Executing Pre-Flight Quality Checks"

    Write-Host "Running typecheck, lint, clippy, and rustfmt checks..."
    & bun run check
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Pre-flight code quality checks failed."
        exit $LASTEXITCODE
    }
    Write-Success "Typecheck, lint, and formatting passed."

    Write-Host "Running Vitest test suite..."
    & bun run test
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Vitest tests failed."
        exit $LASTEXITCODE
    }
    Write-Success "Vitest tests passed."

    Write-Host "Running Cargo tests..."
    & cargo test --manifest-path src-tauri/Cargo.toml
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Cargo tests failed."
        exit $LASTEXITCODE
    }
    Write-Success "Cargo tests passed."
} else {
    Write-Host "Skipping pre-flight tests (-SkipTests specified)." -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Step "Dry-Run Complete"
    Write-Success "All pre-flight checks and toolchains verified successfully. Exiting without building."
    exit 0
}

Write-Step "Building Release Packages (Bundle: $Bundle)"

if ($Bundle -in @("nsis", "all")) {
    $NsisDir = Join-Path $ProjectRoot "src-tauri\target\release\bundle\nsis"
    if (Test-Path $NsisDir) {
        Write-Host "Cleaning previous NSIS bundle output in $NsisDir..."
        Remove-Item -Path "$NsisDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if ($Bundle -eq "none") {
    Write-Host "Building release binary without packaging bundle..."
    & cargo build --release --manifest-path src-tauri/Cargo.toml
} elseif ($Bundle -eq "standalone") {
    Write-Host "Building standalone release executable..."
    & cargo build --release --manifest-path src-tauri/Cargo.toml --bin timelog
} elseif ($Bundle -eq "nsis") {
    Write-Host "Building NSIS installer package via Tauri..."
    & bun x tauri build --bundles nsis
} elseif ($Bundle -eq "all") {
    Write-Host "Building all configured release packages via Tauri..."
    & bun x tauri build
}

if ($LASTEXITCODE -ne 0) {
    Write-Failure "Release build failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}

Write-Step "Release Artifacts Normalization & Summary"
$ArtifactsFound = 0
$NormalizedDir = Join-Path $ProjectRoot "artifacts-release"
if (Test-Path $NormalizedDir) {
    Write-Host "Cleaning previous release artifacts in $NormalizedDir..."
    Remove-Item -Path "$NormalizedDir\*" -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $NormalizedDir -Force | Out-Null
}

if ($Bundle -in @("nsis", "all")) {
    $CandidateNsis = Get-ChildItem -Path (Join-Path $ProjectRoot "src-tauri\target\release\bundle\nsis") -File -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($CandidateNsis) {
        $targetPath = Join-Path $NormalizedDir "oXyFlow_TimeLog-Setup-x64.exe"
        Copy-Item -Path $CandidateNsis.FullName -Destination $targetPath -Force
    }
}

if ($Bundle -in @("standalone", "all")) {
    $CandidateExe = Get-ChildItem -Path (Join-Path $ProjectRoot "src-tauri\target\release") -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -in @("TimeLog.exe", "timelog.exe") } | Select-Object -First 1
    if ($CandidateExe) {
        $targetPath = Join-Path $NormalizedDir "oXyFlow_TimeLog-Standalone-x64.exe"
        Copy-Item -Path $CandidateExe.FullName -Destination $targetPath -Force
    }
}

$ChecksumLines = @()
$finalFiles = Get-ChildItem -Path $NormalizedDir -File -Filter "*.exe" -ErrorAction SilentlyContinue
foreach ($file in $finalFiles) {
    $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $sizeMb = [math]::Round($file.Length / 1MB, 2)
    Write-Host "Artifact: $($file.Name)" -ForegroundColor Green
    Write-Host "  Path:   $($file.FullName)"
    Write-Host "  Size:   $sizeMb MB"
    Write-Host "  SHA256: $hash"
    $ChecksumLines += "$hash  $($file.Name)"
    $ArtifactsFound++
}

if ($ChecksumLines.Count -gt 0) {
    $ChecksumFile = Join-Path $NormalizedDir "SHA256SUMS.txt"
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($ChecksumFile, [string[]]$ChecksumLines, $utf8NoBom)
    Write-Success "Generated SHA256SUMS.txt in $NormalizedDir (UTF-8 without BOM)"
}

# Verify release artifacts completeness
$ExpectedArtifacts = @()
if ($Bundle -eq "nsis") {
    $ExpectedArtifacts += "oXyFlow_TimeLog-Setup-x64.exe"
} elseif ($Bundle -eq "standalone") {
    $ExpectedArtifacts += "oXyFlow_TimeLog-Standalone-x64.exe"
} elseif ($Bundle -eq "all") {
    $ExpectedArtifacts += @("oXyFlow_TimeLog-Setup-x64.exe", "oXyFlow_TimeLog-Standalone-x64.exe")
}

$MissingExpected = @()
foreach ($expected in $ExpectedArtifacts) {
    if (-not (Test-Path (Join-Path $NormalizedDir $expected))) {
        $MissingExpected += $expected
    }
}

if ($MissingExpected.Count -gt 0) {
    Write-Failure "Completeness check failed: missing expected release artifact(s): $($MissingExpected -join ', ')"
    exit 1
}

if ($ArtifactsFound -eq 0 -and $Bundle -ne "none") {
    Write-Host "Build completed, but no release executables were located in standard paths." -ForegroundColor Yellow
} else {
    Write-Success "Release packaging completed successfully ($ArtifactsFound normalized artifacts in $NormalizedDir)."
}
