# Pester tests of .gitlab/runner_status.ps1, the status-job of the GitLab pipeline: the gitlab-runner service already running, started by the script, or still stopped, with Get-Service, Start-Service and Start-Sleep mocked, so no real service and no admin rights
BeforeAll {
    $script:runnerStatus = Join-Path $PSScriptRoot '../../.gitlab/runner_status.ps1'
    # Get-Service and Start-Service only exist on Windows: stand-ins elsewhere, for Pester to mock
    if (-not (Get-Command Get-Service -ErrorAction SilentlyContinue)) {
        function global:Get-Service { [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', 'Name')] param($Name) }
        function global:Start-Service { [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', 'Name')] param($Name) }
    }

    # Runs the script, and returns its exit code and everything it printed, Write-Host included
    function Invoke-RunnerStatus {
        $output = & $script:runnerStatus 6>&1 2>&1 | Out-String
        [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
}

Describe 'runner_status.ps1' {
    BeforeEach {
        $global:LASTEXITCODE = 0
        Mock Start-Sleep {}
    }

    It 'says the service is running, does not start it and exits with 0' {
        Mock Get-Service { [PSCustomObject]@{ Status = 'Running' } }
        Mock Start-Service {}
        $result = Invoke-RunnerStatus
        $result.Output | Should -Match 'Service is already running'
        $result.ExitCode | Should -Be 0
        Should -Invoke Start-Service -Times 0 -Exactly
    }

    It 'starts a stopped service once and exits with 0 once it runs' {
        $script:state = 'Stopped'
        Mock Get-Service { [PSCustomObject]@{ Status = $script:state } }
        Mock Start-Service { $script:state = 'Running' }
        $result = Invoke-RunnerStatus
        $result.Output | Should -Match 'Service is not running'
        $result.Output | Should -Match 'Service is now running'
        $result.ExitCode | Should -Be 0
        Should -Invoke Start-Service -Times 1 -Exactly
        Should -Invoke Start-Sleep -Times 1 -Exactly -ParameterFilter { $Seconds -eq 5 }
    }

    It 'exits with 1 when the service is still stopped after the start' {
        Mock Get-Service { [PSCustomObject]@{ Status = 'Stopped' } }
        Mock Start-Service {}
        $result = Invoke-RunnerStatus
        $result.Output | Should -Match 'still not running'
        $result.ExitCode | Should -Be 1
        Should -Invoke Start-Service -Times 1 -Exactly
    }

    It 'exits with 1 when the service does not exist' {
        Mock Get-Service {}
        Mock Start-Service {}
        $result = Invoke-RunnerStatus
        $result.ExitCode | Should -Be 1
    }
}
