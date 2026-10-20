*** Settings ***
Documentation     Blog section
...               Blog section nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py
Suite Setup       Suite Setup For Blog
Suite Teardown    Suite Teardown For Blog
Metadata          Criticality    Medium

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__

*** Test Cases ***
# -----------------------------------------------------------------------------
TC_BLOG_Nominal_0001 Show every blog card of the data on the home page, each linking to its article
    [Tags]    Blog    Nominal
    [Documentation]
    ...    *Description*
    ...
    ...        Open the home page in each language and check that the Blog section shows one card per entry of _data/blog.json, in the same order, with its title in that language and a link to its article of _data/articles.json on the blog page
    ...
    ...    *Methods description*
    ...
    ...        Equivalence classes  One language per row
    ...
    ...        Boundary values  None
    [Template]    Open The Home Page In ${lang} And Find Every Blog Card
    en
    fr
