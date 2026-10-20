*** Settings ***
Documentation     Keywords of the Home test suites
Resource          ../resource.robot

*** Variables ***
${PHONE_WIDTH}    390
${PHONE_HEIGHT}   844

*** Keywords ***
Suite Setup For Home
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens the English home page for the suite
    ...
    ...    Arguments :
    ...        - None
    ...
    ...    Returns :
    ...        - None
    ${browserId}=    Open The Portfolio On    /en
    Set Suite Variable    ${__sessionId}    ${browserId}

Suite Teardown For Home
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Closes the browsers of the suite
    ...
    ...    Arguments :
    ...        - None
    ...
    ...    Returns :
    ...        - None
    Close All Browsers

The Hero Shows The Name
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Checks the name shown in the hero of the home page
    ...
    ...    Arguments :
    ...        - (_string_) *name* : the expected name
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${name}
    Wait Until Element Contains    css:#home-section h1    ${name}

Switch The Language To
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Clicks the link of a language in the language switcher
    ...
    ...    Arguments :
    ...        - (_string_) *lang* : the language to switch to, such as fr
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${lang}
    Click Element    css:#language-switcher a[hreflang="${lang}"]

The Address Ends With
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Waits until the address of the page ends with a path
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the expected end of the address, such as /fr
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${path}
    Wait Until Location Contains    ${path}
    ${location}=    Get Location
    Should End With    ${location}    ${path}

Resize The Window To ${width} By ${height}
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Resizes the browser window
    ...
    ...    Arguments :
    ...        - (_integer_) *width* : the width in pixels
    ...        - (_integer_) *height* : the height in pixels
    ...
    ...    Returns :
    ...        - None
    Set Window Size    ${width}    ${height}

The Menu Is Folded
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Checks that the menu links are hidden and the Menu button is shown
    ...
    ...    Arguments :
    ...        - None
    ...
    ...    Returns :
    ...        - None
    Element Should Not Be Visible    id:ftco-nav
    Element Should Be Visible    css:.navbar-toggler

Open The Menu
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Clicks the Menu button of the navigation bar
    ...
    ...    Arguments :
    ...        - None
    ...
    ...    Returns :
    ...        - None
    Click Button    css:.navbar-toggler

The Menu Shows The Link
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Waits until the menu is open and shows a link
    ...
    ...    Arguments :
    ...        - (_string_) *text* : the text of the link, such as Projects
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${text}
    Wait Until Element Is Visible    id:ftco-nav
    Wait Until Element Is Visible    xpath://div[@id="ftco-nav"]//a[normalize-space()="${text}"]

Open ${path} On A Phone And Find The Menu Link ${text}
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens a home page in a phone-sized window, checks the menu is folded, then unfolds it and finds one of its links
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the home page, such as /en
    ...        - (_string_) *text* : the text of a menu link in that language
    ...
    ...    Returns :
    ...        - None
    Resize The Window To ${PHONE_WIDTH} By ${PHONE_HEIGHT}
    Go To The Page    ${path}
    The Menu Is Folded
    Open The Menu
    The Menu Shows The Link    ${text}
