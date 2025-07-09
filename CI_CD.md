# CI/CD Installation

## Gitlab-Runner

- The `gitlab-runner` will execute the pipeline on the local computer.  
- Download the `gitlab-runner.exe` `64bit version` file from [official website](https://docs.gitlab.com/runner/install/windows.html).  
- Place this file in `C:\GitLab-Runner\gitlab-runner.exe` *(you must rename the file)*.  
Open an administrator prompt *(otherwise the installation will work but you will have problems during the CI/CD)* and run the following commands :
- `cd C:\GitLab-Runner`
- `.\gitlab-runner.exe install` : Installation of the service gitlab-runner
- `.\gitlab-runner.exe start` : Start the service
- `.\gitlab-runner.exe register`: Registration of the runner
    - Enter the gitlab URL `https://gitlab.com/`
    - Enter the registration token. You can get it on `Project ==> Settings ==> CI/CD ==> Runners ==> Project runners`
    - Enter the name of the runner
    - Enter the runner executor : `shell`
- Then edit the file `C:\GitLab-Runner\config.toml` and make sure the file looks like below.  
```toml
concurrent = 1
check_interval = 0
shutdown_timeout = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "<name>"
  url = "https://gitlab.com/"
  id = "<id>"
  token = "<token>"
  token_obtained_at = 2025-07-06T19:17:21Z
  token_expires_at = 0001-01-01T00:00:00Z
  executor = "shell"
  shell = "pwsh"
```
- Change pwsh for shell execution (to powershell for Windows runner or bash for Linux runner).
- Check the runner exists and is valid with 
	-`.\gitlab-runner.exe list`
	-`.\gitlab-runner.exe verify`
	-`.\gitlab-runner.exe status`
- The service can be stopped with `.\gitlab-runner.exe stop`.
- `.\gitlab-runner.exe` can be replaced by `gitlab-runner` in commands, adding `C:\GitLab-Runner` to PATH in system environment variables.
