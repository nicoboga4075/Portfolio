Write-Host "Checking GitLab Runner status..."
$status = gitlab-runner status | Out-String
if ($status -notmatch "Service is running") {
	Write-Host "gitlab-runner: Service is not running"	-ForegroundColor Orange
	gitlab-runner start | Out-Null
	Write-Host "Restarting the runner..."
	Start-Sleep -Seconds 5
	$statusAfterStart = gitlab-runner status | Out-String
	if ($statusAfterStart -notmatch "Service is running") {
         Write-Host "gitlab-runner: Service is not running" -ForegroundColor Red
         exit 1
    } else {
         Write-Host "gitlab-runner: Service is now running" -ForegroundColor Green
    }	
} else {
	Write-Host "gitlab-runner: Service is already running" -ForegroundColor Green
}
