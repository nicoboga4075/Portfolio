Write-Output "Checking GitLab Runner status..."
# Get-Service reads the state of the Windows service: gitlab-runner status writes to stderr, which Out-String doesn't capture, and needs admin rights
function Test-RunnerRunning {
	(Get-Service gitlab-runner -ErrorAction SilentlyContinue).Status -eq 'Running'
}
if (-not (Test-RunnerRunning)) {
	# Write-Host takes -ForegroundColor (Write-Output prints it as text), and the console has no Orange
	Write-Host "gitlab-runner: Service is not running" -ForegroundColor Yellow
	Write-Output "Restarting the runner..."
	Start-Service gitlab-runner -ErrorAction SilentlyContinue
	Start-Sleep -Seconds 5
	if (-not (Test-RunnerRunning)) {
         Write-Host "gitlab-runner: Service is not running" -ForegroundColor Red
         exit 1
    } else {
         Write-Host "gitlab-runner: Service is now running" -ForegroundColor Green
    }
} else {
	Write-Host "gitlab-runner: Service is already running" -ForegroundColor Green
}
