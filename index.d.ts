export type CookieParams = {
	/** the defined date when the cookie will expire */
	expires?: Date,
	/** the defined maximum age when the cookie will expire, in minutes */
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
    /** whether your cookie has the __Host or __Secure prefix */
    prefix?: 'host' | 'secure'
}
declare class SuperCookie<V = any>{
    constructor(name: string, parameters?: CookieParams)
    name: string;
    toJSON: () => SuperCookie["value"];
    value: V;
    parameters: CookieParams;
    expires: CookieParams["expires"];
    path: CookieParams["path"];
    maxAge: CookieParams["maxAge"];
    domain: CookieParams["domain"];
    secure: CookieParams["secure"];
    httpOnly: CookieParams["httpOnly"];
    sameSite: CookieParams["sameSite"];
    prefix: CookieParams["prefix"]
    /** deletes your cookie */
    delete: () => void;
    static get: {
        (name: string, asPlainObject?: false | undefined): SuperCookie 
        (name: string, asPlainObject?: true): any;
    }
    static set: (name: string, value: any, parameters: CookieParams) => void;
    static getFull: {
        (asPlainObject?: false | undefined): {[name: string]: SuperCookie}
        (asPlainObject?: true): {[name: string]: any}
    }
    static delete: (name: string, path?: string) => void;
}

declare global {
    interface Window {
        cookieStore?: {
            delete(name: string): Promise<undefined>;
            delete({name, url, path}:{name: string, url: string, path: string}): Promise<undefined>;
            get(name: string): Promise<{name: string, value: string, domain: string, path: string, expires: number, secure: boolean, sameSite: 'lax' | 'strict' | 'none'}>;
            get({name, url}: {name: string, url: string}): Promise<{name: string, value: string, domain: string, path: string, expires: number, secure: boolean, sameSite: 'lax' | 'strict' | 'none'}>;
            getAll(name?: string): Promise<{name: string, value: string, domain: string, path: string, expires: number, secure: boolean, sameSite: 'lax' | 'strict' | 'none'}[]>
            getAll({name, url}?: {name?: string, url?: string}): Promise<{name: string, value: string, domain: string, path: string, expires: number, secure: boolean, sameSite: 'lax' | 'strict' | 'none'}[]>
            set(name: string, value: string): Promise<undefined>;
            set({name, value, expires, domain, path, sameSite}: {
                name: string,
                value: string,
                expires?: number,
                domain?: string,
                path?: string,
                sameSite?: 'strict' | 'lax' | 'none'
            }): Promise<undefined>
        }
    }
}

export default SuperCookie