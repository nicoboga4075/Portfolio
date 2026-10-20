---
name: robot-test
description: Writes a Robot Framework test of the portfolio (SeleniumLibrary, browser end-to-end) following ROBOT_FRAMEWORK.md and the Robot Framework section of CONTRIBUTING.md - the folder layout, the suite template, the TC_<SECTION>_<Nominal|Degraded>_<NNNN> ids, the documentation blocks, the keyword rules - runs it against the built site and adds it to the test list of ROBOT_FRAMEWORK.md. Use it whenever the user asks for a Robot Framework, Robot, robot or acceptance / end-to-end test in Robot syntax, a .robot suite, a test case or keyword for one of the sections (Home, About, Resume, Services, Projects, Blog, Contact), or to fill a nominal or degraded case of ROBOT_FRAMEWORK.md, even if they don't say "Robot Framework".
---

# Write a Robot Framework test

The reference is **ROBOT_FRAMEWORK.md** (the suite template and the test list) and the "Add a Robot Framework test" section of **CONTRIBUTING.md** (the writing rules). Read both before writing anything: ROBOT_FRAMEWORK.md gives the layout, the template and the run commands; this skill adds a worked example and the steps.

## Layout

The template imports `../_resource.robot` and `../../libs/utility.py`, which gives this layout under `tests/robot/` (`tests/` is already a SonarCloud test folder and a 404 on the live site):

```
tests/robot/
├── resource.robot                 # keywords and variables used by at least 2 section folders (BASE_URL, BROWSER, opening the site)
├── libs/
│   ├── utility.py                 # Python keywords used by at least 2 section folders
│   └── <section>/_resource.py     # Python keywords of one section, when Robot keywords are not enough
└── <section>/                     # home, about, resume, services, projects, blog, contact (the sections of ROBOT_FRAMEWORK.md)
    ├── _resource.robot            # keywords of this section, imports ../resource.robot
    ├── nominal/<section>_nominal.robot
    └── degraded/<section>_degraded.robot
```

Create the shared files the first time they are needed, then reuse them: never copy a keyword into a second `_resource.robot` (move it to `resource.robot` instead).

## The suite

Start from the template of ROBOT_FRAMEWORK.md:

- **No `[Arguments]` in a test case**: Robot 7 fails with `Setting 'Arguments' is not allowed with tests or tasks`. A test takes its values from `*** Variables ***`, or uses `[Template]` for data-driven cases (one row per equivalence class or boundary value).
- **Test id and name**: `TC_<SECTION>_<Nominal|Degraded>_<NNNN> <a real sentence>`, numbered after the last id of that section in ROBOT_FRAMEWORK.md, e.g. `TC_HOME_Nominal_0001 Open the English home page and read the name in the hero`. Nominal = the expected path works; Degraded = wrong input, missing data, network or API error, narrow screen.
- `Metadata    Criticality    Low|Medium|High`, and `[Tags]` with the section and the case type (`Home    Nominal`); add `Disabled` when the test documents a *Known Error*.
- `${__sessionId}    __DEFINED_BY_SETUP__` in `*** Variables ***`, set by the suite setup with `Set Suite Variable`.

```robot
*** Settings ***
Documentation     Home page
...               Home page nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For Home
Suite Teardown    Suite Teardown For Home
Metadata          Criticality    Low

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_HOME_Nominal_0001 Open the English home page and read the name in the hero
    [Tags]    Home    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Open the English home page and check that the hero shows the name of the author
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  None
    ...
    ...        Boundary values  None
    The Hero Shows The Name    Nicolas BOGALHEIRO
```

The section resource opens the browser once for the suite:

```robot
*** Settings ***
Documentation     Keywords of the Home test suites
Resource          ../resource.robot

*** Keywords ***
Suite Setup For Home
    ${browserId}=    Open The Portfolio On    /en
    Set Suite Variable    ${__sessionId}    ${browserId}

Suite Teardown For Home
    Close All Browsers

The Hero Shows The Name
    [Arguments]    ${name}
    Wait Until Element Contains    css:h1    ${name}
```

And `resource.robot` holds what every section needs:

```robot
*** Settings ***
Documentation     Keywords and variables shared by at least two test folders
Library           SeleniumLibrary

*** Variables ***
${BASE_URL}       http://localhost:${PORT}
${BROWSER}        headlesschrome

*** Keywords ***
Open The Portfolio On
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens a browser on a page of the portfolio
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the site path, such as /en or /fr/blog
    ...
    ...    Returns :
    ...        - (_string_) *browserId* : the id of the opened browser
    [Arguments]    ${path}
    ${browserId}=    Open Browser    ${BASE_URL}${path}    ${BROWSER}
    RETURN    ${browserId}
```

## Writing rules (from CONTRIBUTING.md)

- Test and keyword names are real sentences (`Login as 'admin' and delete user 'maintenance'`), never function-like names (`LoginAdminDeleteUser`).
- A keyword does one thing: opening the browser, going to a page and filling a field are separate keywords.
- One argument: `[Arguments]`. Two or more: embedded in the name (`Fill The Contact Form With ${name} ${email} ${message}`). Never both in one keyword.
- Every custom keyword has the documentation block (`**Applies to :**`, description, `Arguments :`, `Returns :`) shown above.
- Python keywords use `@keyword("Name")` and take their arguments at the end of the call (`Print Debug    My label    My text`).
- No `Sleep`: wait with `Wait Until Element Is Visible`, `Wait Until Element Contains`, `Wait Until Page Contains Element`...
- Each suite is independent: what a test creates, the same suite cleans up. A suite must pass when run alone.
- Suite setup and teardown only hold what most of the suite's tests need.
- Prefer stable selectors of the pages: ids (`id:ftco-nav`, `id:contact-section`), then `css:` on classes, `xpath:` last. Read the page in `_includes/` (or `.eleventy/` after a build) to pick them.
- Test both languages when the behaviour depends on the text: `/en` and `/fr`.

## Run it

Robot Framework and SeleniumLibrary must be installed (`pip install -r tests/robot/requirements.txt`, the versions the CI runs); Selenium Manager downloads the Chrome driver itself.

1. Check the syntax first: `robot --dryrun --output NONE --log NONE --report NONE tests/robot`
2. Build and serve the site, then run the suite against it:
   - Static pages (fast, no Netlify functions): `ELEVENTY_PREVIEW=1 npx eleventy`, then `node .claude/skills/robot-test/serve-build.mjs` in the background (it serves on a free port and prints its address), then `robot --outputdir reports/robot --variable BASE_URL:<that address> tests/robot/<section>`
   - Pages that call a Netlify function (contact form, CV date, visit counter): `npm run dev` then `robot --outputdir reports/robot tests/robot/<section>`
3. Read `reports/robot/log.html` on a failure (SeleniumLibrary saves a screenshot next to it). `reports/` is git-ignored.
4. Stop the server you started.

## Then

- Add the test to the list of ROBOT_FRAMEWORK.md, under its section and case type (`### 1.1. Nominal Cases`...): `- **TC_HOME_Nominal_0001**: Open the English home page and read the name in the hero`.
- Commit the suite, its resources and ROBOT_FRAMEWORK.md with the `✅` gitmoji (CLAUDE.md), or ask first if the user hasn't said to commit.
