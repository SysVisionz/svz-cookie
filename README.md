# SuperCookie

This module provides four management classes for saving and retrieving objects, arrays, and all current javascript primitives into a named cookie without issue.

## Installation
To install, in terminal type

```
	npm i --save supercookie
```

then, in your project,

```
import SuperCookie from 'supercookie';
```  

## Constructor

new SuperCookie(name)

## Class Variables

* **REQUIRED**  
* **name**  
The name of the cookie. This is used to initialize the SupeCookie.  

* **Required to be a Cookie**  
* **value**  
type: ***any***  
This is applied by default either in the SuperCookie declaration or at the moment you pull the cookie. SuperCookie allows you to define this in any format, despite it being a string. It is marginally more inclusive then JSON format normally is, including, for instance, Bigint types.

* **cookie**  
type: ***Object***  
This is the Supercookie's representation as an object, in the way that is used by the cookieStore functionalities. Value is converted to a SuperCookie formatted string if it's an object.

* **Cookie parameters**  
**NOTE:** The following values can only be retrieved after the initial cookieStore fetch, which is indicated with **SuperCookie.prototype.ready**. Until this is true, they will return **undefined**, unless defined by the SuperCookie declaration.

* **domain**  
type:***string***  

* **expires**  
type:***Date | number | string | null | false***  
returns as: ***Date | false***  
When defined the behavior is different depending on how you do it. ***Date | number | string*** work as a normal Date object definition. ***null | false*** have special behaviors:  
***null***: this will delete the cookie by setting its expiration to 0.  
***false***: this will set the cookie's expiration as far into the future as possible (400 days).  
**Returning**: if the expiration is more than 300 days into the future, it will return ***false***, otherwise it will return the ***Date*** object of the expiration.  
**NOTE:** if you wish to override the ***false*** behavior and treat it purely as ***Date***, this can be done by setting **SuperCookie.prototype.preserveFalsyExpirations** to true.

* **partitioned**  
type:***boolean***  
* **path**  
type:***string***  
* **sameSite**  
type:***boolean***  
* **secure**  
type:***boolean***  

* **cookie**  
type: ***Object***  
This is a readonly value returning the cookie in the format used to apply it to cookieStore API. Generally you won't need to use this ever.

* **Parameters**  
* **parameters**  
type: ***Object*** | ***() => Object***  
Retrieves or sets the provided parameters for the cookie of the given **name** in the format of default SuperCookie formatting. 

* **ready**  
type: ***Boolean***  
This tells you whether the initial cookieStore fetch has completed.

* **preserveFalsyExpirations**  
If this is true, it sets the default behavior for the SuperCookie to return the exact expiration instead of false for applicable expirations when examining it.

## Methods

* **addEventListener**  
***(listener: (evt) => void) => void***  
This adds a listener to every time the targeted cookie is changed for ANY reason, not just when the SuperCookie modifies it.  
note: the evt.changed property is going to be returned as an array of values in the SuperCookie default format, instead of the cookieStore format.  
evt.change is a new property that will allow you to target the change specific to the targeted cookie.

* **asObject**  
***() => object***  
This returns the SuperCookie in its default structure as a basic object.  

* **copy**  
***(name: string) => SuperCookie***  
Copies this cookie into a new SuperCookie with the name given.

* **delete**  
***() => void***  
Deletes the targeted cookie  

* **deleteSync**  
***() => void***  
Deletes the targeted cookie syncronously  

* **equals**  
***(cookie: SuperCookieParameters | CookieStoreReturn) => boolean***  
Checks if the targeted SuperCookie's values are equal to the provided SuperCookie definition object or the return object from a cookieStore get call.

* **get**  
***() => Promise<SuperCookieDefaults>***  
retrieves a full SuperCookie defined directly from the cookieStore values.

* **getSync**  
***() => {name: string, value: any}***  
retrieves a partial SuperCookie object with only the **name** and **value** values applied, directly from the document cookie.

* **onReady**  
***() => void***  
This will run any time after the SuperCookie retrieves from the cookieStore. (essentially, any time you redefine a value or the targeted cookie is modified through other means)

* **removeEventListener**  
***(listener: (evt: SuperCookieEvent) => void) => void***  
Acts similarly to cookieStore.removeEventListener for the listeners defined by this SuperCookie instance.

* **set**  
***(value, parameters) => Promise<void>***  
***(parameters) => Promise<void>***  
This sets the SuperCookie's values to those provided, as well as the targeted cookie.

* **setSync**  
***(value, parameters) => void***  
***(parameters) => void***  
This will set the cookie using the document.cookie = functionality. It will be inherently slightly less reliable than the SuperCookie.prototype.set function.

* **then READONLY**  
type: ***(func: () => void) => void***  
Turns the initial readying of the SuperCookie into a promiselike. Note that it can only be applied BEFORE the initial retrieval of the cookieStore data.

* **toString**  
type ***() => string***
Returns the cookie in the style utilized by document.cookie format.

## Static Methods

* **addEventListener**  
***(listener: (evt) => void) => void***  
This adds a listener to every time cookies are changed for ANY reason, not just when the SuperCookie modifies it.  
note: the evt.changed property is going to be returned as an array of values in the SuperCookie default format, instead of the cookieStore format.  

* **copy**  
***(name: string, newName: string, options?: {preserveFalsyExpirations?: boolean}) => void***  
Copies the cookie **name** into a new cookie **newName**

* **delete**  
***(name: string, {path: string, domain: string}) => void***  
***(name: string, path?: string) => void***  
Deletes the cookie **name** matching **path** and **domain** when they are provided.

* **get**  
***(name: string, options?: {preserveFalsyExpirations: boolean}) => Promise<SuperCookieDefaults>***  
Retrieves the target cookie as a SuperCookieDefaults Object.

* **getAll**  
***({preserveFalsyExpirations: boolean}) => Promise<SuperCookieDefaults[]>***  
Retrieves all cookies available as SuperCookieDefaults Objects.

* **getSync**  
***(cookieName: string) => {name: string, value: any}***  
retrieves the the named cookie's values available directly from the document.cookie string.

* **getAllSync**  
***() => {name: string, value: string}[]***  
retrieves all cookies from the document.cookie string as an array.

* **equals**  
***(cookie1: SuperCookie | SuperCookieSetOptions | CookieStoreGetOptions, cookie2: SuperCookie | SuperCookieSetOptions | CookieStoreGetOptions) => boolean***  
Compares two SuperCookie style objects. SuperCookies, cookieStore get returns, or SuperCookie definition objects may be used.

* **removeEventListener**  
***(listener: (evt: SuperCookieEvent) => void) => void***  
Removes a listener defined by SuperCookie.

* **set**  
***(parameters: SuperCookieSetOptions) => Promise<void>***  
***(name: string, parameters?: SuperCookieSetOptions) => Promise<void>***  
***(name: string, value: any, parameters?: SuperCookieSetOptions) => Promise<void>***  
Sets the cookie that has the name referenced.

* **setSync**  
***(parameters: SuperCookieSetOptions) => void***  
***(name: string, parameters?: SuperCookieSetOptions) => void***  
***(name: string, value: any, parameters?: SuperCookieSetOptions) => void***  
Synchronously sets the cookie that has the name referenced. This may not function quite as reliable as set.

## Version History

3.0 - The rework for typescript and cookies building properly, complete with retyping for primitive object types, is good to go!  

3.1 - Remodeled the constructor to not include value, as that is typically defined through usage and many times would require putting an undefined entry in the middle.  

4.0 - implemented the ability to utilize the cookieStore functionality.  

5.0 - Absolute ground up refactor, properly incorporating cookieStore, fixing dozens of broken aspects. This is now awesome.