# Test Suite Template

The suites live in `tests/robot/`, one folder per section of the list below, with the nominal and degraded cases in separate subfolders. This file holds the layout, the template, the writing rules and the run commands.

```
tests/robot/
├── resource.robot                 # keywords and variables used by at least 2 section folders
├── libs/
│   ├── utility.py                 # Python keywords used by at least 2 section folders
│   └── <section>/_resource.py     # Python keywords of one section
└── <section>/                     # home, about, resume, services, projects, blog, contact
    ├── _resource.robot            # keywords of the section, imports ../resource.robot
    ├── nominal/<section>_nominal.robot
    └── degraded/<section>_degraded.robot
```

```robot
*** Settings ***
Documentation     Generate XXXXXXX
...               Generate XXXXXXX nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For XXXXX
Suite Teardown    Suite Teardown For XXXXX
Metadata          Criticality    Low

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_XXXXXX_Nominal_0001 Generate XXXXXX and verify YYYYYY
    [Tags]    Tag1    Tag2    Tag3
    [Documentation]
    ...    *Description*
    ...
    ...        This test Generate XXXXXX to verify YYYYYY
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  None
    ...
    ...        Boundary values  None
    ...
    ...    *Known Error*
    ...        <TO BE DEFINED>
    MyRobotKeyword    ${Parameter}
    MyOtherRobotKeyword    ${Parameter2}
```

- **Test name**: `TC_<SECTION>_<Nominal|Degraded>_<NNNN>` followed by a real sentence, numbered after the last id of the section in the list below. Nominal: the expected path works; Degraded: wrong input, missing data, network or API error, narrow screen.
- **No `[Arguments]` in a test case**: Robot Framework 7 rejects it (`Setting 'Arguments' is not allowed with tests or tasks`). A test takes its values from `*** Variables ***`, or uses `[Template]` for data-driven cases (one row per equivalence class or boundary value).
- **Documentation**: *Description* says what the test checks; *Methods description* gives the *Equivalence classes* (the classes of input the test covers, or `None`) and the *Boundary values* (the range of values tested, or `None`).
- **Known Error**: optional, only for a test that fails until a later version fixes it; when used, add the tag `Disabled` to `[Tags]`.

## Writing rules

### Names

- Test and keyword names are short real sentences: `Login as 'admin' and delete user 'maintenance'` is clear, `Admin delete user` is harder to understand.
- Never a programming-like name such as `LoginAdminDeleteUser`. A good name needs no comment; a comment is still fine inside a long test to mark its steps.

### Suites

- Each suite is independent of the others: what a test creates, the same suite edits or deletes. A suite must pass when run alone, and a test must pass without running the full suite.
- `Suite Setup` and `Suite Teardown` run once, before the first test and after the last test of the suite (`Test Setup` and `Test Teardown` run around each test): only put there what most of the suite's tests need.

### Resource files

- `<section>/_resource.robot`: the keywords and variables shared by the suites of one section folder. A Python keyword of one section goes in `libs/<section>/_resource.py`.
- `resource.robot`: the keywords and variables used by at least 2 section folders, so that they are never copied into several `_resource.robot` files. Same rule for the Python keywords of `libs/utility.py`.

### Keywords

- A keyword does one thing: opening a browser, going to a page and filling a field are separate keywords whenever possible.
- No `Sleep`: wait with the `Wait Until ...` keywords of [SeleniumLibrary](https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html) (`Wait Until Element Is Visible`, `Wait Until Element Contains`, `Wait Until Page Contains Element`).
- A Robot keyword with one argument takes it with `[Arguments]`:

```robot
My Keyword
    [Arguments]    ${myArg}
    ...
```

- A Robot keyword with 2 arguments or more embeds them in its name:

```robot
My Keyword ${myArg1} ${myArg2} ${myArg3}
    ...
```

- **Never mix both** in one keyword:

```robot
My Keyword ${myArg1} ${myArg2} ${myArg3}
    [Arguments]    ${myArg4}
    ...
```

- A Python keyword is named with `@keyword` and always takes its arguments at the end of the call:

```python
@keyword("Print Debug")
def printDebug(label, txt):
    ...
```

```robot
Print Debug    My label    My text
```

- Every custom keyword has this documentation block:

```robot
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
```

### Pages

- Prefer stable selectors: ids (`id:ftco-nav`, `id:contact-section`), then `css:` on classes, `xpath:` last. Read the page in `_includes/` (or `.eleventy/` after a build) to pick them.
- Test both languages (`/en` and `/fr`) when the behaviour depends on the text.

### After writing a test

- Add it to the list below, under its section and case type: `- **TC_HOME_Nominal_0001**: Open the English home page and read the name in the hero`.
- Commit the suite, its resources and this file with the `✅` gitmoji.

## Run the tests

| Action | Command |
|---|---|
| Install | `pip install --require-hashes -r tests/robot/requirements.txt` (the versions the CI runs) |
| Check the syntax only | `robot --dryrun --output NONE --log NONE --report NONE tests/robot` |
| Run against the built site (no Netlify functions) | `ELEVENTY_PREVIEW=1 npx eleventy`, `node tests/serve-build.mjs` (it serves on a free port and prints its address), then `robot --outputdir reports/robot --variable BASE_URL:<that address> tests/robot` |
| Run against `npm run dev` (with the Netlify functions) | `robot --outputdir reports/robot tests/robot` (`npm run robot`) |
| Include the tests of a tag | `robot -i <tag> <pathToFolder>` |
| Exclude the tests of a tag | `robot -e <tag> <pathToFolder>` |
| Run one suite by name | `robot -s <name> <pathToFolder>` |
| Run one test case by name | `robot -t <name> <pathToSuite>` |

The reports (`output.xml`, `log.html`, `report.html`, and the SeleniumLibrary screenshots of each failure, linked from the log and the report) go to `reports/robot/`, which is git-ignored; `-o`, `-l` and `-r` change their names.

## Documentation

- [Robot Framework User Guide](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html)
- [SeleniumLibrary](https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html)
- [Database Library](https://docs.robotframework.org/docs/different_libraries/database)

# Robot Framework Test List

Table of Contents
- [Robot Framework Test List](#robot-framework-test-list)
- [1. Home](#1-home)
    - [1.1. Nominal Cases](#11-nominal-cases)
    - [1.2. Degraded Cases](#12-degraded-cases)
- [2. About](#2-about)
    - [2.1. Nominal Cases](#21-nominal-cases)
    - [2.2. Degraded Cases](#22-degraded-cases)
- [3. Resume](#3-resume)
    - [3.1. Nominal Cases](#31-nominal-cases)
    - [3.2. Degraded Cases](#32-degraded-cases)
- [4. Services](#4-services)
    - [4.1. Nominal Cases](#41-nominal-cases)
    - [4.2. Degraded Cases](#42-degraded-cases)
- [5. Projects](#5-projects)
    - [5.1. Nominal Cases](#51-nominal-cases)
    - [5.2. Degraded Cases](#52-degraded-cases)
- [6. Blog](#6-blog)
    - [6.1. Nominal Cases](#61-nominal-cases)
    - [6.2. Degraded Cases](#62-degraded-cases)
- [7. Contact](#7-contact)
    - [7.1. Nominal Cases](#71-nominal-cases)
    - [7.2. Degraded Cases](#72-degraded-cases)

## 1. Home

### 1.1. Nominal Cases

- **TC_HOME_Nominal_0001**: Open the English home page and read the name in the hero
- **TC_HOME_Nominal_0002**: Switch the English home page to French and back with the language switcher

### 1.2. Degraded Cases

- **TC_HOME_Degraded_0001**: Open the home page on a phone and unfold the menu with the Menu button

## 2. About

### 2.1. Nominal Cases

### 2.2. Degraded Cases

## 3. Resume

### 3.1. Nominal Cases

### 3.2. Degraded Cases

## 4. Services

### 4.1. Nominal Cases

### 4.2. Degraded Cases

## 5. Projects

### 5.1. Nominal Cases

- **TC_PROJECTS_Nominal_0001**: Show every project card of the data on the home page, in the same order
- **TC_PROJECTS_Nominal_0002**: Open a project page from the Explore button of its card

### 5.2. Degraded Cases

## 6. Blog

### 6.1. Nominal Cases

- **TC_BLOG_Nominal_0001**: Show every blog card of the data on the home page, each linking to its article

### 6.2. Degraded Cases

## 7. Contact

### 7.1. Nominal Cases

### 7.2. Degraded Cases
