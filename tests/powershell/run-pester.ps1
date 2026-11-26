# npm run test:ps: runs the Pester 5 tests of tests/powershell, writes their JUnit report to reports/pester/junit.xml and exits with the number of failed tests
$ErrorActionPreference = 'Stop'
if (-not (Get-Module -ListAvailable Pester | Where-Object { $_.Version.Major -ge 5 })) {
    Write-Error 'Pester 5 not found: Install-PSResource Pester -Scope CurrentUser -TrustRepository (Windows only ships Pester 3.4)'
}
Import-Module Pester -MinimumVersion 5.0.0
$root = Split-Path (Split-Path $PSScriptRoot)
$config = New-PesterConfiguration
$config.Run.Path = $PSScriptRoot
$config.Run.Exit = $true
$config.Output.Verbosity = 'Detailed'
$config.TestResult.Enabled = $true
$config.TestResult.OutputFormat = 'JUnitXml'
$config.TestResult.OutputPath = Join-Path $root 'reports/pester/junit.xml'
Invoke-Pester -Configuration $config
