Write-Output "Checking GitLab Runner status..."
$status = Gitlab-Runner status | Out-String
if ($status -notmatch "Service is running") {
	Write-Output "gitlab-runner: Service is not running"	-ForegroundColor Orange
	Gitlab-Runner start | Out-Null
	Write-Output "Restarting the runner..."
	Start-Sleep -Seconds 5
	$statusAfterStart = Gitlab-Runner status | Out-String
	if ($statusAfterStart -notmatch "Service is running") {
         Write-Output "gitlab-runner: Service is not running" -ForegroundColor Red
         exit 1
    } else {
         Write-Output "gitlab-runner: Service is now running" -ForegroundColor Green
    }
} else {
	Write-Output "gitlab-runner: Service is already running" -ForegroundColor Green
}
