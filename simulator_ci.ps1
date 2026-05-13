function Invoke-WithTimestamp {
    param(
        [string]$Command,
        $LogPath
    )

    $scriptBlock = [scriptblock]::Create($Command)

    & $scriptBlock 2>&1 |
    ForEach-Object { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $_" } |
    Tee-Object -FilePath $LogPath -Append
}

# Load powershell-yaml if not installed
if (-not (Get-Module -ListAvailable -Name powershell-yaml)) {
    Install-Module -Name powershell-yaml -Force -Scope CurrentUser
}
Import-Module powershell-yaml

# Load pipeline config
$yamlPath = ".\.gitlab-ci.yml"
if (-not (Test-Path $yamlPath)) {
    Write-Output "❌ .gitlab-ci.yml not found!" -ForegroundColor Red
    exit 1
}
$ciConfig = ConvertFrom-Yaml (Get-Content $yamlPath -Raw)

# Stages list
$stages = $ciConfig.stages
if (-not $stages) {
    Write-Output "❌ No stages defined." -ForegroundColor Red
    exit 1
}

# Simulated environment variables
$env:CI_PROJECT_DIR = (Get-Location).Path
$env:CI_PIPELINE_ID = (Get-Random -Minimum 1000 -Maximum 9999)

# Log and results folders
$logDir = ".\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir }

$results = @()

Write-Output "`n🚀 Local GitLab CI Simulator (Windows Runner)`n" -ForegroundColor Cyan

foreach ($stage in $stages) {
    Write-Output "=== Stage: $stage ===" -ForegroundColor Yellow

    $jobs = $ciConfig.Keys | Where-Object {
        ($ciConfig[$_] -is [hashtable]) -and
        ($ciConfig[$_].ContainsKey('stage')) -and
        ($ciConfig[$_]['stage'] -eq $stage)
    } | ForEach-Object {
        [PSCustomObject]@{ Name = $_; Value = $ciConfig[$_] }
    }

    foreach ($job in $jobs) {
        $jobName = $job.Name
        $jobValue = $job.Value
        $env:CI_JOB_NAME = $jobName
        $jobStart = Get-Date
        $logPath = "$logDir\$jobName.log"

        Write-Output "`n▶️  Job: $jobName`n" -ForegroundColor Green
        "=== Job: $jobName ===" | Out-File $logPath

		$dangerousPatterns = "Remove-Item|Remove-ItemProperty|Clear-Content|Clear-Item|Clear-ItemProperty|Stop-Computer|Restart-Computer|Format-Volume|Stop-Process|Set-ExecutionPolicy|Uninstall-Module|Remove-Module|Start-Process|New-Item|rm|rmdir|unlink|shutdown|reboot|halt|mkfs|dd|:\(\)\s*\{\s*:\|\s*:\&\s*\};:|curl\s+\|\s*sh|wget\s+\|\s*sh|mv|chmod|chown|killall|kill\s+-9"

        foreach ($cmd in $jobValue.script) {
			if ($cmd -match $dangerousPatterns) {
				Write-Output "⚠️  Skipping dangerous command: $cmd" -ForegroundColor Red
				Add-Content -Path $logPath -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ⚠️  Skipped command: $cmd"
				continue
			}
            try {
                Invoke-WithTimestamp -Command $cmd -LogPath $logPath
            } catch {
                Write-Output "❌ Error: $cmd" -ForegroundColor Red
                $results += @{ job=$jobName; stage=$stage; status="failed"; duration=0 }
                exit 1
            }
        }

        $jobEnd = Get-Date
        $duration = [math]::Round(($jobEnd - $jobStart).TotalSeconds, 2)
        Write-Output "`n✅ Job finished in $duration sec`n" -ForegroundColor Green
        $results += @{ job=$jobName; stage=$stage; status="success"; duration=$duration }
    }
}

$results | ConvertTo-Json | Out-File "$logDir\pipeline-result.json"

Write-Output "`n🎉 Pipeline completed!" -ForegroundColor Cyan
Write-Output "📊 Logs: $logDir"
Write-Output "📑 Summary: $logDir\pipeline-result.json`n"

Read-Host -Prompt "Press Enter to exit"