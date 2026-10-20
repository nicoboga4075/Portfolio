*** Settings ***
Documentation     Projects section
...               Projects section nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For Projects
Suite Teardown    Suite Teardown For Projects
Metadata          Criticality    Medium

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_PROJECTS_Nominal_0001 Show every project card of the data on the home page, in the same order
    [Tags]    Projects    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Open the home page in each language and check that the Projects section shows one card per card of _data/projects.json, in the same order
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  One language per row
    ...
    ...        Boundary values  None
    [Template]    Open The Home Page And Find Every Project Card
    /en
    /fr

# -----------------------------------------------------------------------------
TC_PROJECTS_Nominal_0002 Open a project page from the Explore button of its card
    [Tags]    Projects    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Move the mouse over the first card with its own project page, click its Explore button and check that the project page opens in the same language with the title of the project
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  One language per row
    ...
    ...        Boundary values  None
    [Template]    Open The Project Page Of The Card In ${lang}
    en
    fr
