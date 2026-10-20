*** Settings ***
Documentation     Home page
...               Home page degraded cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For Home
Suite Teardown    Suite Teardown For Home
Metadata          Criticality    Medium

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_HOME_Degraded_0001 Open the home page on a phone and unfold the menu with the Menu button
    [Tags]    Home    Degraded
    [Documentation]
    ...    *Description*
    ...
    ...        On a phone-sized window the menu links are folded behind the Menu button: check they are hidden, then that the Menu button shows them, in English and in French
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  One language per row
    ...
    ...        Boundary values  A window of 390 by 844 pixels, below the 992 pixels of the folded menu
    [Template]    Open ${path} On A Phone And Find The Menu Link ${text}
    /en    Home
    /fr    Accueil
    [Teardown]    Resize The Window To ${WIDTH} By ${HEIGHT}
