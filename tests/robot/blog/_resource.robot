*** Settings ***
Documentation     Keywords of the Blog test suites
Resource          ../resource.robot
Library           ../libs/utility.py

*** Keywords ***
Suite Setup For Blog
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

Suite Teardown For Blog
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

The Blog Card ${position} Shows ${title} And Links To ${href}
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Checks the title of a blog card of the home page and the link of its image
    ...
    ...    Arguments :
    ...        - (_integer_) *position* : the position of the card, from 1
    ...        - (_string_) *title* : the expected title
    ...        - (_string_) *href* : the expected link, such as /en/blog#mcs
    ...
    ...    Returns :
    ...        - None
    ${card}=    Set Variable    css:#blog-section .col-md-4:nth-child(${position}) .blog-entry
    # The cards fade in once scrolled into view, and a hidden title has no text for Selenium
    Scroll Element Into View    ${card}
    Wait Until Element Is Visible    ${card} h3
    Element Text Should Be    ${card} h3    ${title}
    Element Attribute Value Should Be    ${card} a.article-image    href    ${BASE_URL}${href}

Open The Home Page In ${lang} And Find Every Blog Card
    [Documentation]
    ...   **Applies to :** Selenium
    ...
    ...    Opens the home page in a language and checks its blog cards against _data/blog.json and _data/articles.json
    ...
    ...    Arguments :
    ...        - (_string_) *lang* : the language, such as en
    ...
    ...    Returns :
    ...        - None
    ${blog}=    Read The Site Data    _data/blog.json
    ${articles}=    Read The Site Data    _data/articles.json
    Go To The Page    /${lang}
    ${count}=    Get Length    ${blog}[entries]
    Page Should Contain Element    css:#blog-section .blog-entry    limit=${count}
    FOR    ${index}    ${entry}    IN ENUMERATE    @{blog}[entries]    start=1
        ${article}=    Set Variable    ${articles}[${index - 1}]
        The Blog Card ${index} Shows ${entry}[title][${lang}] And Links To /${lang}/blog#${article}[slug]
    END
