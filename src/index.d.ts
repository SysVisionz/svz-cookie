export type CookieParams = {
	/** the defined date when the cookie will expire */
	expires?: Date,
	/** the defined maximum age when the cookie will expire */
	maxAge?: number,
	/** the path where this cookie is received */
	path?: string,
	/** which hosts can receive this cookie */
	domain?: string,
	/** Indicates that the cookie is sent to the server only when a request is made with the https: scheme */
	secure?: boolean,
	/** Indicates that the cookie cannot be accessed through client side scripts */
	httpOnly?: boolean,
	/** if your cookie should be restricted to a first-party or same-site context. */
	sameSite?: 'Strict' | 'Lax' | 'None',
}
declare interface SVZCookie{
	toJSON: () => any,
	name: string,
	prefixes: {
		host: boolean
		secure: boolean
	};
}
declare class SVZCookie implements SVZCookie{
    constructor(name: string, value: any, parameters: CookieParams)
    toJSON: () => SVZCookie["value"];
    value: any;
    parameters: CookieParams;
    expires: CookieParams["expires"];
    path: CookieParams["path"];
    maxAge: CookieParams["maxAge"];
    domain: CookieParams["domain"];
    secure: CookieParams["secure"];
    httpOnly: CookieParams["httpOnly"];
    sameSite: CookieParams["sameSite"];
    /** deletes your cookie */
    delete: () => void;
    static get: {
        (name: string, asPlainObject?: false | undefined): SVZCookie 
        (name: string, asPlainObject?: true): any;
    }
    static set: (name: string, value: any, parameters: CookieParams) => void;
    static getFull: {
        (asPlainObject?: false | undefined): {[name: string]: SVZCookie}
        (asPlainObject?: true): {[name: string]: any}
    }
    static delete: (name: string) => void;
}

export default SVZCookie