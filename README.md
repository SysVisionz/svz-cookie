# SVZCookie

This module provides four management classes for manipulating Numbers, Objects, Cookies, and Dates in ways with multiple use cases I've employed on a number of occasions.

## Installation
To install, in terminal type

```
	npm i --save svz-cookie
```

then, in your project,

```
import SVZCookie from 'svz-cookie';
```  

## Constructor

new SVZCookie(name)

## Class Variables

* **name**  
type: ***String***  
The cookie being utilized by SVZCookie.

* **value**  
type:***String***  
Retrieves or sets the value for the cookie of the given **name** value.

**NOTE:** The following values cannot retrieve the current parameters of a cookie. They are defined within the SVZCookie, and modify the cookie accordingly, but until they are set these values are **undefined**.

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
Gets all cookies currently available as individual SVZCookies

## Version History

1.0  
Initial release.

1.1
-Refactor, and addition of cookie as the valueOf.
-JSON.parse and toJSON will now return the JSON as object contents of the cookie, rather than the cookie object itself.
-getFull now returns all cookies as SVZCookies.