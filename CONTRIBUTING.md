# Contributing to Portfolio

Thank you for your interest in contributing to this portfolio.

## Getting Started

This repository is private : external contributions are limited.

## Development Workflow

This project uses multiple Git remotes to manage code across GitHub and GitLab and is deployed via Netlify.

### Git Remotes

- `github`: Points to the GitHub repository (fetch and push).
- `gitlab`: Points to the GitLab repository (fetch and push).
- `origin`: Configured to fetch from GitHub, but push to both GitHub and GitLab simultaneously.

### Common Git Commands

| Action                              | Command                    | Remote                       |
|-------------------------------------|----------------------------|------------------------------|
| Fetch latest changes                | `git fetch <remote>`       | `github`, `gitlab`, `origin` |
| Pull latest changes (fetch + merge) | `git pull <remote> main`   | `github`, `gitlab`, `origin` |
| Push changes to GitHub              | `git push github main`     | `github`                     |
| Push changes to GitLab              | `git push gitlab main`     | `gitlab`                     |
| Push changes to both at once        | `git push origin main`     | `origin`                     |
| List all remotes                    | `git remote`               | `github`, `gitlab`, `origin` |
| List all remote actions             | `git remote -v`            | `github`, `gitlab`, `origin` |

### Deployment with Netlify

- Netlify is connected to the GitHub repository only.
- Every push to the `main` branch triggers an automatic build and deployment on Netlify **if buid status is not set to Stopped and if "Lock auto-publishing" is not enabled**.
- Netlify does not receive code via Git commands directly, but via repository integration.
- Netlify automatically serves `index.html` when you visit a directory URL ending with a slash (e.g., /fr/ serves /fr/index.html). It also serves .html files when the extension is omitted in the URL, so /toto_fr will serve /toto_fr.html if that file exists. If a requested path does not match any file or redirect rule, Netlify serves the custom `/404.html` page if it is present in the site root. Otherwise, it displays its default 404 error page. Redirect rules in `_redirects` or `netlify.toml` are applied before this fallback behavior.
- Netlify builds run in a `Linux` (Ubuntu) environment. The shell used is `Bash`.

---

Make sure to push changes to the appropriate remote(s) depending on your workflow. 
- **For most cases, pushing to `origin` will update both GitHub and GitLab simultaneously**. It's possible to use directly `git push` in GitBash.
- To insure free mirroring between GitHub and GitLab:
  - If pushing was only on GitHub, use `git push gitlab main` to synchronise the repo on GitLab.
  - If pushing was only on GitLab, use the following commands to synchronize the repo on GitHub:
    - `git fetch gitlab` (**do not use `git pull gitlab`**)
    - `git checkout main` if not already on main branch
    - `git rebase gitlab/main` to keep the same history (**do not use `git merge gitlab/main`**)
    - `git push --force github main` to overwrite history

No ruleset is declared by default in GitHub but in GitLab, when importing the repo, the `main` branch is set with labels `default` and `protected`. **Push force is not allowed by default in GitLab**.

### Add a video (.mp4 only, < 10 min and < 100Mo)

- Record a video with Windows + Shift + S (Snipping Tool).
- Edit it possibly with `Movavi Editor`.
- Use `Microsoft Clipchamp` to generate subtitles thanks to IA and select the option 'Hide subtitles in video' while exporting to have a separated .srt file.
- Convert it with the command: `ffmpeg -i ${SRT_NAME}.srt ${SRT_NAME}.vtt`.
- Do the same for other languages, translating potentially with Microsoft Word.
- Open the video with `HandBrake` and select checkbox 'Optimized for the web' in Resume, button 'Clean' in Subtitles and uncheck 'Create markers' in Chapters.
- Export it with default quality (Fast1080p30).
- Mux subtitles (burn in) into the video with the command:`ffmpeg -i ${VIDEO_NAME}.mp4  -i ${VIDEO_NAME}_FR.srt  -i ${VIDEO_NAME}_EN.srt -map 0 -map 1 -map 2 -metadata:s:s:0 language=fra -metadata:s:s:1 language=eng -c:v copy -c:a copy -c:s mov_text ${NEW_VIDEO_NAME}.mp4` (for instance, for French and English).
- Open the video with `VLC Media Player`. Make sure in Advanced Preferences > Subtitles & OSD, 'Detect auto subtitles files' option is unchecked. Following the previous example, you should see only two tracks in Subtitles (Track 1 - French, Track 2 - English).
- In HTML, use .vtt files (as .srt files are in .gitignore) and the following element:
<video controls>
	  <track label="Français" kind="subtitles" srclang="fr" src="${RELATIVE_PATH_TO_FRENCH_SUBTITLES}.vtt">
	  <track label="English" kind="subtitles" srclang="en" src="${RELATIVE_PATH_TO_ENGLISH_SUBTITLES}.vtt" default>
	  <source src="${RELATIVE_PATH_TO_VIDEO}.mp4" type="video/mp4">
</video>
You may add the attribute default for one track so as to have automatically the matched subtitles when playing the video online. Avoid assign it to the same language track as the audio or the application language.

### Add a Robot Framework test

- Please use simple phrase to explain the test briefly. For example, `Login as 'admin' and delete user 'maintenance'` is clean but `Admin delete user` is harder to understand. 
- Use real phrases that make sense, avoid programming-like functions name `LoginAdminDeleteUser` which is a bad descriptor. Ideally, you should not have to use comments to describe the `test case` (even if you can use it if your test is complicated or do multiple actions as well as inside it to describe the different steps).
- All tests can be run in command prompt or terminal in `Visual Studio Code` with the command `robot .`.

| Action                              | Command                           |
|-------------------------------------|-----------------------------------|
| Run all tests						  | `robot <pathToFolder>`			  |
| Include tagged tests                | `robot -i <tag> <pathToFolder>`   |
| Exclude tagged tests                | `robot -e <tag> <pathToFolder>`   |
| Run an entire suite by name		  | `robot -s <name> <pathToFolder>`  |
| Run a single test case by name	  | `robot -t <name> <pathToSuite>`   |

Robot Framework automatically generates output.xml, log.html and report.html after every test run. If using `SeleniumLibrary`, screenshots are taken on test failures. Reports and logs include clickable links to screenshots for debugging. Output locations and file names can be customized using -o, -l and -r command-line options.

- Avoid using `Sleep` and prefer using `Wait Until ...` with the [official documentation](https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html).
- Test should be run without running the full suite.
- Keywords must have the fewest responsabilities : they should not implement too many actions. Open a browser, go to a page and fill an input have to be separated if possible.

#### Test Suite

Each `test suite` must be independant from others. That mean that you can't have one which create something and another that will delete or edit the first one. You should do it in the same file. We need to be able to run only one test suite and it should work.

#### Suite Setup & Suite Teardown

The `Setup` & `Teardown` functions are used before and after each test execution respectively. It means every code you use in those functions will be ran for every test case in your test suite. You should place code in this place only if it is needed for most of your test cases in your test suite.

#### Test Case - Description

A test case description should follow [this template](./ROBOT_FRAMEWORK.md)
```python
[Documentation]
    ...    *Description*
    ...
    ...        Try to update email field with numeric value
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  None
    ...
    ...        Boundary values  None
    ...
    ...    *Known Error*
    ...
    ...        <TO BE DEFINED>
``` 

With the parameters :
- Description : The description of your test case
- Methods description :
    - Equivalence classes : Python class or None
    - Boundary values : range of values or None
- Known Error : This parameter is optionnal, don't use it if you don't need it. It is used when a test failed and it would be fixed in another software version. You should add the tag `Disabled` in the section [Tags].

#### Local `_resource.robot` file

The `_resource.robot` should be used when you have multiple tests suites in a test folder. This allows you to use global `keywords *(or variables)*` in the tests suites. If you need a specific Python function, create a file under `./libs/<your_test_folder_name>/_ressource.py` or under.

#### Global `resource.robot` file

You should place keywords or variables in this file if they are used in at least 2 tests folders. It avoid duplicating the values in multiple `_resource.robot` files. This recommendation also apply to the `./libs/utility.py` file.

#### Tests case parameters

##### Custom Robot Keyword

If you have a custom keyword in the Robot format and use parameters, you should pass them as the following :
  - 1 parameter 
```py
My Keyword
  [Arguments]  ${myArg}
  ...
```
  - 2 parameters or more 
```py
My Keyword ${myArg1} ${myArg2} ${myArg3}
  ...
```

Don't mix both methods. **The following example is a thing you should <u>NEVER</u> do**
```py
My Keyword ${myArg1} ${myArg2} ${myArg3}
  [Arguments]  ${myArg4}
  ...
```

The  custom keywords must be documented clearly using the following pattern
```python
[Documentation]
...   **Applies to :** <Database, Selenium, File system, All...>
...
...    <Description>
...
...    Arguments :
...        - (_<argument_type>_) *<argument_name>* : <argument_usage>
...    
...    Returns :
...        - (_<return_type>_) *<return_name>* : <return_usage>
...    
```

##### Custom Python Keyword

If you have a Python function, you don't have the choice, you should use the parameters at the end of the keyword. For example :
```py
@keyword("Print Debug")
def printDebug(label, txt):
    ...

Print Debug  My label  My text
```

#### Documentation

- Robot Framework User Guide : https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html 
- Selenium Library : https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html  
- Database Library : https://docs.robotframework.org/docs/different_libraries/database

