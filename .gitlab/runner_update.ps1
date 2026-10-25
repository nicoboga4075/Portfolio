# Updates the GitLab Runner of windows-local (C:\GitLab-Runner) to $Version: stops the service, checks the SHA-256 of the new binary, replaces gitlab-runner.exe and starts it again, keeping config.toml and the registration
# Run it between two pipelines, from a PowerShell opened as administrator: .\.gitlab\runner_update.ps1 -Version x.y.z
param(
    # Release to install, with no default so an old version is never installed by mistake: see https://gitlab.com/gitlab-org/gitlab-runner/-/releases
    [Parameter(Mandatory)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,
    [string]$RunnerDir = 'C:\GitLab-Runner'
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Stopping and starting the gitlab-runner service needs admin rights: run this script from a PowerShell opened as administrator" -ForegroundColor Red
    exit 1
}

$exe = Join-Path $RunnerDir 'gitlab-runner.exe'
if (-not (Test-Path $exe)) {
    Write-Host "No ${exe}: install the runner first (Install the GitLab Runner in README.md)" -ForegroundColor Red
    exit 1
}

$current = ((& $exe --version) | Select-String '^Version:').ToString() -replace '^Version:\s*', ''
if ($current -eq $Version) {
    Write-Host "gitlab-runner is already $Version" -ForegroundColor Green
    exit 0
}
Write-Output "Updating gitlab-runner from $current to $Version..."

$base = "https://gitlab-runner-downloads.s3.amazonaws.com/v$Version"
$new = Join-Path $RunnerDir 'gitlab-runner-new.exe'
$old = Join-Path $RunnerDir "gitlab-runner-$current.exe"
$sums = Join-Path $RunnerDir 'release.sha256'

# Downloaded and checked before the service is stopped, so a bad download never leaves the runner down
Invoke-WebRequest "$base/binaries/gitlab-runner-windows-amd64.exe" -OutFile $new
Invoke-WebRequest "$base/release.sha256" -OutFile $sums
$hash = (Get-FileHash $new -Algorithm SHA256).Hash.ToLower()
$expected = ((Get-Content $sums | Select-String 'binaries/gitlab-runner-windows-amd64\.exe$').ToString() -split '\s+')[0].ToLower()
Remove-Item $sums
if ($hash -ne $expected) {
    Remove-Item $new
    Write-Host "SHA-256 mismatch for the downloaded binary ($hash, expected $expected): nothing was changed" -ForegroundColor Red
    exit 1
}

& $exe stop
# The old binary is kept next to the new one, to roll back by hand: stop, put it back as gitlab-runner.exe, start
Copy-Item $exe $old -Force
Move-Item $new $exe -Force
& $exe start
Start-Sleep -Seconds 5

if ((Get-Service gitlab-runner -ErrorAction SilentlyContinue).Status -ne 'Running') {
    # The new version doesn't start: the old one is put back and started
    Write-Host "gitlab-runner $Version doesn't start: rolling back to $current" -ForegroundColor Red
    & $exe stop
    Copy-Item $old $exe -Force
    & $exe start
    exit 1
}

& $exe --version
& $exe verify
Write-Host "gitlab-runner updated to $Version (the old binary is $old): check it is online in Settings > CI/CD > Runners of the GitLab project" -ForegroundColor Green
