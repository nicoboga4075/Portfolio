*** Settings ***
Documentation     Keywords and variables shared by at least two test folders
Library           SeleniumLibrary

*** Variables ***
${PORT}           8888
${BASE_URL}       http://localhost:${PORT}
${BROWSER}        headlesschrome
${WIDTH}          1366
${HEIGHT}         900

*** Keywords ***
Open The Portfolio On
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens a browser on a page of the portfolio, at the size of a laptop screen
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the site path, such as /en or /fr/blog
    ...
    ...    Returns :
    ...        - (_string_) *browserId* : the id of the opened browser
    [Arguments]    ${path}
    ${browserId}=    Open Browser    ${BASE_URL}${path}    ${BROWSER}
    Set Window Size    ${WIDTH}    ${HEIGHT}
    RETURN    ${browserId}

Go To The Page
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens a page of the portfolio in the current browser
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the site path, such as /en or /fr/blog
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${path}
    Go To    ${BASE_URL}${path}

The Page Language Is
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Checks the language of the page, read from the lang attribute of its html element
    ...
    ...    Arguments :
    ...        - (_string_) *lang* : the expected language, such as en or fr
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${lang}
    Element Attribute Value Should Be    css:html    lang    ${lang}
