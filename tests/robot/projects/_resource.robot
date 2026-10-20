*** Settings ***
Documentation     Keywords of the Projects test suites
Resource          ../resource.robot
Library           ../libs/utility.py
Library           ../libs/projects/_resource.py

*** Keywords ***
Suite Setup For Projects
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

Suite Teardown For Projects
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

The Page Shows The Project Cards
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Checks that the Projects section shows one card per card of _data/projects.json, in the same order
    ...
    ...    Arguments :
    ...        - (_list_) *cards* : the cards of _data/projects.json
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${cards}
    @{elements}=    Get WebElements    css:#projects-section .project
    ${count}=    Get Length    ${cards}
    Length Should Be    ${elements}    ${count}
    FOR    ${element}    ${card}    IN ZIP    ${elements}    ${cards}
        Should Be Equal    ${element.get_attribute('id')}    ${card}[id]
    END

Show The Details Of The Card
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Scrolls to a project card and moves the mouse over it, which shows its details and its Explore button
    ...
    ...    Arguments :
    ...        - (_string_) *id* : the id of the card, such as crm
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${id}
    Scroll Element Into View    id:${id}
    Mouse Over    id:${id}
    Wait Until Element Is Visible    css:#${id} .explore

Click The Explore Button Of The Card
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Clicks the Explore button of a project card, once its details are shown
    ...
    ...    Arguments :
    ...        - (_string_) *id* : the id of the card, such as crm
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${id}
    Click Element    css:#${id} .explore

The Project Page Shows The Title
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Waits until the heading of the project page shows the title of the project
    ...
    ...    Arguments :
    ...        - (_string_) *title* : the title of the project, without its HTML tags
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${title}
    Wait Until Element Contains    css:h1    ${title}

Open The Home Page And Find Every Project Card
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens a home page and checks its project cards against _data/projects.json
    ...
    ...    Arguments :
    ...        - (_string_) *path* : the home page, such as /en
    ...
    ...    Returns :
    ...        - None
    [Arguments]    ${path}
    ${projects}=    Read The Site Data    _data/projects.json
    Go To The Page    ${path}
    The Page Shows The Project Cards    ${projects}[cards]

Open The Project Page Of The Card In ${lang}
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens the home page in a language and the project page of the first card that has one, through its Explore button
    ...
    ...    Arguments :
    ...        - (_string_) *lang* : the language, such as en
    ...
    ...    Returns :
    ...        - None
    ${projects}=    Read The Site Data    _data/projects.json
    ${card}=    Find A Card With Its Own Page    ${projects}[cards]
    ${title}=    Remove The Tags    ${card}[title]
    Go To The Page    /${lang}
    Show The Details Of The Card    ${card}[id]
    Click The Explore Button Of The Card    ${card}[id]
    The Project Page Shows The Title    ${title}
    The Page Language Is    ${lang}
