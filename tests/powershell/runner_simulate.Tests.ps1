# Pester tests of .gitlab/runner_simulate.ps1 (npm run simu:ci), run in a temporary folder with ConvertFrom-Yaml returning the pipeline of each test, and powershell-yaml, Install-Module and Read-Host mocked
BeforeAll {
    $script:simulator = Join-Path $PSScriptRoot '../../.gitlab/runner_simulate.ps1'
    # ConvertFrom-Yaml comes from powershell-yaml: a stand-in when it isn't installed, for Pester to mock
    if (-not (Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue)) {
        function global:ConvertFrom-Yaml { [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', 'Yaml')] param($Yaml) }
    }

    # Runs the simulator in the temporary folder on this pipeline (null for no .gitlab-ci.yml), and returns its exit code and everything it printed
    function Invoke-Simulator($Pipeline) {
        Push-Location $TestDrive
        try {
            if ($null -ne $Pipeline) {
                New-Item -ItemType Directory -Path .gitlab -Force | Out-Null
                Set-Content .gitlab/.gitlab-ci.yml 'read by ConvertFrom-Yaml, mocked'
                # A global variable, the one scope the mock of ConvertFrom-Yaml reads from
                Set-Variable -Name SimulatorPipeline -Scope Global -Value $Pipeline
            }
            $global:LASTEXITCODE = 0
            $output = & $script:simulator 6>&1 2>&1 | Out-String
            [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
        } finally {
            Pop-Location
        }
    }
}

Describe 'runner_simulate.ps1' {
    BeforeEach {
        Get-ChildItem $TestDrive -Force | Remove-Item -Recurse -Force
        Mock Get-Module { [PSCustomObject]@{ Name = 'powershell-yaml'; ModuleBase = 'modules' } } -ParameterFilter { $Name -eq 'powershell-yaml' }
        Mock Import-Module {} -ParameterFilter { $Name -eq 'powershell-yaml' }
        Mock Install-Module {}
        Mock Read-Host {}
        Mock ConvertFrom-Yaml { Get-Variable -Name SimulatorPipeline -Scope Global -ValueOnly }
    }

    Context 'refuses to run' {
        It 'without .gitlab/.gitlab-ci.yml' {
            $result = Invoke-Simulator $null
            $result.Output | Should -Match 'gitlab-ci.yml not found'
            $result.ExitCode | Should -Be 1
        }

        It 'without stages' {
            $result = Invoke-Simulator @{ 'build-job' = @{ stage = 'build'; script = @('Write-Output x') } }
            $result.Output | Should -Match 'No stages defined'
            $result.ExitCode | Should -Be 1
        }

        It 'when the YAML cannot be read' {
            Mock ConvertFrom-Yaml { throw 'bad YAML' }
            $result = Invoke-Simulator @{}
            $result.Output | Should -Match "Can't read .gitlab/.gitlab-ci.yml with powershell-yaml: bad YAML"
            $result.ExitCode | Should -Be 1
        }
    }

    It 'installs powershell-yaml only when it is missing' {
        Mock Get-Module {} -ParameterFilter { $Name -eq 'powershell-yaml' }
        Invoke-Simulator ([ordered]@{ stages = @('build') }) | Out-Null
        Should -Invoke Install-Module -Times 1 -Exactly -ParameterFilter { $Name -eq 'powershell-yaml' }
    }

    It 'runs the jobs stage by stage in the order of stages, and writes the log of each job and the summary' {
        $result = Invoke-Simulator ([ordered]@{
            stages = @('build', 'test')
            'test-job' = @{ stage = 'test'; script = @('Add-Content order.txt test') }
            'build-job' = @{ stage = 'build'; script = @('Add-Content order.txt build', 'Write-Output "built"') }
            variables = @{ A = 'b' }
        })
        $result.ExitCode | Should -Be 0
        $result.Output | Should -Match 'Pipeline completed'
        Get-Content (Join-Path $TestDrive 'order.txt') | Should -Be @('build', 'test')
        Get-Content (Join-Path $TestDrive 'logs/build-job.log') -Raw | Should -Match '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} built'
        $summary = Get-Content (Join-Path $TestDrive 'logs/pipeline-result.json') -Raw | ConvertFrom-Json
        $summary.job | Should -Be @('build-job', 'test-job')
        $summary.stage | Should -Be @('build', 'test')
        $summary.status | Should -Be @('success', 'success')
        $summary | ForEach-Object { $_.duration | Should -BeGreaterOrEqual 0 }
        Should -Invoke Read-Host -Times 1 -Exactly
    }

    It 'skips and logs the dangerous commands, but runs a command that only contains one in a word' {
        $result = Invoke-Simulator ([ordered]@{
            stages = @('build')
            'build-job' = @{ stage = 'build'; script = @('Remove-Item important.txt', 'rm -rf x', 'Add-Content ran.txt "git add done"') }
        })
        $result.ExitCode | Should -Be 0
        $result.Output | Should -Match 'Skipping dangerous command: Remove-Item important.txt'
        $result.Output | Should -Match 'Skipping dangerous command: rm -rf x'
        Get-Content (Join-Path $TestDrive 'ran.txt') | Should -Be 'git add done'
        Get-Content (Join-Path $TestDrive 'logs/build-job.log') -Raw | Should -Match 'Skipped command: Remove-Item important.txt'
    }

    It 'stops the pipeline with exit code 1 on a failing command' {
        $result = Invoke-Simulator ([ordered]@{
            stages = @('build', 'test')
            'build-job' = @{ stage = 'build'; script = @('throw "boom"', 'Add-Content after.txt x') }
            'test-job' = @{ stage = 'test'; script = @('Add-Content after.txt y') }
        })
        $result.ExitCode | Should -Be 1
        $result.Output | Should -Match 'Error: throw "boom"'
        Join-Path $TestDrive 'after.txt' | Should -Not -Exist
        Join-Path $TestDrive 'logs/pipeline-result.json' | Should -Not -Exist
    }
}

AfterAll {
    Remove-Variable SimulatorPipeline -Scope Global -ErrorAction SilentlyContinue
}
