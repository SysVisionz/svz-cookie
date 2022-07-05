# TempMocks

This module allows you to build a temporary object emulating how a normal server works with your mock data, complete with limited caching behaviors.

## Installation
To install, in terminal type

```
	npm i --save-dev temp-mocks
```

then, in your project,

```
import TempMocks from 'temp-mocks';
```  

## Constructor

TempMocks(path)

## Class Variables

* **path**  
type: ***String***  
The directory path to the current mock data.

* **value**  
type:***String***  
Retrieves or sets the value for the cookie of the given **name** value.

**NOTE:** The following values cannot retrieve the current parameters of a cookie. They are defined within the SuperCookie, and modify the cookie accordingly, but until they are set these values are **undefined**.

* **path**  
type: ***String***  
The path value of the cookie.

* **domain**  
type: ***String***  
Retrieves or sets the provided **domain** parameter for the cookie of the given **name**

* **secure**  
type: ***Boolean***  
Retrieves or sets the provided **secure** parameter for the cookie of the given **name**

* **expires**  
type: ***Date***||***String***  
Retrieves or sets the provided **expires** paramemeter for the cookie of the given **name**

* **maxAge**  
type: ***Number***  
Retrieves or sets the provided **max-age** parameter for the cookie of the given **name**

* **sameSite**  
type: ***String***  
Retrieves or sets the provided **samesite** parameter for the cookie of the given **name**

* **parameters**  
type: ***Object***  
Retrieves or sets the provided parameters for the cookie of the given **name** in the format of the names used here (ie: maxAge rather than "max-age")

## Methods

* **delete()**  
Deletes the cookie of the given **name**

## Static Methods

* **set(name, value, [parameters])**  
Sets the cookie with the given **name** value to **value** with the parameters provided. **parameters** are in the naming format provided previously.

* **get(name)**  
type: ***String***
Retrieves the value for the cookie of the **name** provided.

* **delete(name)**  
Deletes the cookie of the given **name**

* **getFull()**  
type: ***Object***
Gets all cookies currently available as individual SuperCookies

## Version History

3.0 - The rework for typescript and cookies building properly, complete with retyping for primitive object types, is good to go!  

3.1 - Remodeled the constructor to not include value, as that is typically defined through usage and many times would require putting an undefined entry in the middle.