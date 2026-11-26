# PSScriptAnalyzer settings of npm run lint:ps (lint-scripts.js): every default rule at the Error and Warning levels, which fail the lint
@{
    Severity     = @('Error', 'Warning')
    # These scripts only print to the console, and Write-Host is what takes -ForegroundColor (Write-Output prints it as text)
    ExcludeRules = @('PSAvoidUsingWriteHost')
}
