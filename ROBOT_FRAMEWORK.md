# Test Suite Template

```python
*** Settings ***
Documentation     Generate XXXXXXX
...               Generate XXXXXXX nominal cases
Resource          ../_resource.robot
Library           String
Library           SeleniumLibrary
Library           ../../libs/utility.py

*** Settings ***
Suite Setup       Suite Setup For XXXXX
Suite Teardown    Suite Teardown For XXXXX

Metadata    Criticality   Low

*** Variables ***
${__sessionId}            __DEFINED_BY_SETUP__


*** Test Cases ***
 # -----------------------------------------------------------------------------
TC_XXXXXX_Nominal_0001
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
    [Arguments]   ${Parameter}    ${Parameter2}
    MyRobotKeyword ${Parameter}
    MyOtherRobotKeyword ${Parameter2}
```

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

### 1.2. Degraded Cases

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

### 5.2. Degraded Cases

## 6. Blog

### 6.1. Nominal Cases

### 6.2. Degraded Cases

## 7. Contact

### 7.1. Nominal Cases

### 7.2. Degraded Cases
