Write-Output "Checking GitLab Runner status..."
# Get-Service reads the state of the Windows service: gitlab-runner status writes to stderr, which Out-String doesn't capture, and needs admin rights
function Test-RunnerRunning {
	(Get-Service gitlab-runner -ErrorAction SilentlyContinue).Status -eq 'Running'
}
if (-not (Test-RunnerRunning)) {
	# Write-Host takes -ForegroundColor (Write-Output prints it as text), and the console has no Orange
	Write-Host "gitlab-runner: Service is not running" -ForegroundColor Yellow
	Write-Output "Restarting the runner..."
	$startError = $null
	Start-Service gitlab-runner -ErrorAction SilentlyContinue -ErrorVariable startError
	Start-Sleep -Seconds 5
	if (-not (Test-RunnerRunning)) {
         Write-Host "gitlab-runner: Service is still not running, it couldn't be started" -ForegroundColor Red
         $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
         # Without admin rights Windows refuses to start a service ("Run with PowerShell" from the Explorer never has them)
         if (-not $isAdmin) {
              Write-Host "Starting a Windows service needs admin rights: run this script from a PowerShell opened as administrator, or run Start-Service gitlab-runner there" -ForegroundColor Red
         } elseif ($startError) {
              Write-Host "Start-Service failed: $($startError[0].Exception.Message)" -ForegroundColor Red
         }
         exit 1
    } else {
         Write-Host "gitlab-runner: Service is now running" -ForegroundColor Green
    }
} else {
	Write-Host "gitlab-runner: Service is already running" -ForegroundColor Green
}
