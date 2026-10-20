*** Settings ***
Documentation     Home page
...               Home page nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For Home
Suite Teardown    Suite Teardown For Home
Metadata          Criticality    High

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_HOME_Nominal_0001 Open the English home page and read the name in the hero
    [Tags]    Home    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Open the English home page and check that it is in English and that the hero shows the name of the author of package.json
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  None
    ...
    ...        Boundary values  None
    ${package}=    Read The Site Data    package.json
    Go To The Page    /en
    The Page Language Is    en
    The Hero Shows The Name    ${package}[author][name]

# -----------------------------------------------------------------------------
TC_HOME_Nominal_0002 Switch the English home page to French and back with the language switcher
    [Tags]    Home    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Click FR in the language switcher of the English home page, check that the French home page opens, then click EN to come back
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  None
    ...
    ...        Boundary values  None
    Go To The Page    /en
    Switch The Language To    fr
    The Address Ends With    /fr
    The Page Language Is    fr
    Switch The Language To    en
    The Address Ends With    /en
    The Page Language Is    en
