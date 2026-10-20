# Test Suite Template

The suites live in `tests/robot/`, one folder per section of the list below, with the nominal and degraded cases in separate subfolders. The writing rules are in [CONTRIBUTING.md](CONTRIBUTING.md#add-a-robot-framework-test), and the `robot-test` skill (`.claude/skills/robot-test/SKILL.md`) writes and runs a test following this file.

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

- **Test name**: `TC_<SECTION>_<Nominal|Degraded>_<NNNN>` followed by a real sentence, numbered after the last id of the section in the list below.
- **No `[Arguments]` in a test case**: Robot Framework 7 rejects it (`Setting 'Arguments' is not allowed with tests or tasks`). A test takes its values from `*** Variables ***`, or uses `[Template]` for data-driven cases (one row per equivalence class or boundary value).
- **Known Error**: optional; when used, add the tag `Disabled`.

## Run the tests

| Action | Command |
|---|---|
| Install | `pip install -r tests/robot/requirements.txt` (the versions the CI runs) |
| Check the syntax only | `robot --dryrun --output NONE --log NONE --report NONE tests/robot` |
| Run against the built site (no Netlify functions) | `ELEVENTY_PREVIEW=1 npx eleventy`, `node .claude/skills/robot-test/serve-build.mjs` (it serves on a free port and prints its address), then `robot --outputdir reports/robot --variable BASE_URL:<that address> tests/robot` |
| Run against `npm run dev` (with the Netlify functions) | `robot --outputdir reports/robot tests/robot` |

The reports (`output.xml`, `log.html`, `report.html`, screenshots on failure) go to `reports/robot/`, which is git-ignored.

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
