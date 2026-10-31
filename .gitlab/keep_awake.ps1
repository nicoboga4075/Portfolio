# Keeps windows-local from sleeping while a job runs: started in the background by before_script, it holds a "system required" request until the job's shell exits, then Windows can sleep again
param(
    [Parameter(Mandatory)]
    [int]$JobPid
)

Add-Type -Namespace Win32 -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);'
# ES_CONTINUOUS | ES_SYSTEM_REQUIRED: held by this process until it exits; the screen can still turn off, and a PC already asleep is not woken up
[Win32.Power]::SetThreadExecutionState(0x80000001u) | Out-Null
Wait-Process -Id $JobPid -ErrorAction SilentlyContinue
