type CookieStoreKeys = 'name' | 'domain' | 'expires' | 'path' | 'sameSite' | 'secure' | 'value'

type CookieStoreGetOptions = {
	domain?: string,
	expires?: number,
	name: string,
	partitioned?: boolean,
	path?: string,
	sameSite?: 'strict' | 'lax' | 'none',
	secure?: boolean,
	value?: string
}

type CookieStoreSetOptions = {
	domain?: string,
	expires?: Date | number,
	name: string,
	partitioned?: boolean,
	path?: string,
	sameSite?: 'strict' | 'lax' | 'none',
	secure?: boolean,
	value: string
}

type CookieStoreDeleteOptions = {
	name: string,
	partitioned?: boolean,
	path?: string,
	domain?: string
	url?: string
}

type ChangeObject = {
	domain: string | null, expires: string | number, name: string, partitioned: boolean,
	path: string, sameSite: 'strict' | 'lax' | 'none', secure: boolean, value: string
}
interface CookieEvent extends Omit<Event, 'target'> {
	changed: ChangeObject[]
}

type CookieRefreshOptions = {
	(toRefresh: CookieStoreKeys[]): Promise<CookieStoreGetOptions>,
	name: ()  => Promise<CookieStoreGetOptions>,
	domain: ()  => Promise<CookieStoreGetOptions>,
	expires: ()  => Promise<CookieStoreGetOptions>,
	path: ()  => Promise<CookieStoreGetOptions>,
	sameSite: ()  => Promise<CookieStoreGetOptions>,
	secure: ()  => Promise<CookieStoreGetOptions>,
	value: ()  => Promise<CookieStoreGetOptions>,
}

type CookieStore = {
	getAll: (options?: CookieStoreGetOptions) => Promise<[]>,
	addEventListener: (type: 'change', listener: (event: CookieEvent) => void) => void,
	get: (options?: CookieStoreGetOptions) => Promise<CookieStoreGetOptions>,
	set: (options: CookieStoreSetOptions) => Promise<undefined>,
	delete: (options: CookieStoreDeleteOptions) => Promise<undefined>
}

interface CookieInstanceEvent extends CookieEvent {
	target: ChangeObject
}

declare global {
	type Windwow = Window & {cookieStore?: CookieStore}
}

type CookieChanges = {
    domain: string;
    expires: string | number;
    name: string;
    partitioned: boolean;
    path: string;
    sameSite: "strict" | "lax" | "none";
    secure: boolean;
    value: string;
}

export type CookieParams = {
	/** the name of the cookie */
	name: string,
	/** the defined date when the cookie will expire */
	expires?: number,
	/** the defined maximum age when the cookie will expire, in minutes */
	maxAge?: number,
	/** the path where this cookie is received */
	path?: string,
	/** which hosts can receive this cookie */
	domain?: string,
	/** Indicates that the cookie is domain locked. If this is true, secure will be ignored, since this is more strict. */
	host?: boolean,
	/** Indicates that the cookie is sent to the server only when a request is made with the https: scheme */
	secure?: boolean,
	/** Indicates that the cookie cannot be accessed through client side scripts */
	httpOnly?: boolean,
	/** if your cookie should be restricted to a first-party or same-site context. */
	sameSite?: 'strict' | 'lax' | 'none',
    /** whether your cookie has the __Host or __Secure prefix */
    prefix?: 'host' | 'secure'
}

const {cookieStore, document}: {cookieStore?: CookieStore, document?: Document} = typeof window === 'undefined' ? {} : window;

export default class SuperCookie<V = any>{

	pVals: CookieParams = {} as CookieParams;
	cookieStore: CookieStore | undefined;
	__listeners: {f: (event: CookieInstanceEvent) => void, ef: (event: CookieEvent) => void}[] = [];
	static __listeners: ((event: CookieEvent) => void)[] = [];

	constructor(name: string, parameters: Omit<CookieParams, 'name'> & {name?: string} = {}){
		this.pVals = {name, ...parameters};
		const {name: n, domain, expires, partitioned, path, sameSite, secure}: CookieStoreGetOptions = this.pVals;
		(
			cookieStore || 
			{get: (options: CookieStoreGetOptions) => new Promise((res) => res(undefined))}
		).get({name: n, domain, expires, partitioned, path, sameSite, secure}).then((cookie) => {
			if (cookie) {
				this.pVals = cookie;
			}
		})
	}

	toJSON = () => ({
		name: this.name,
		domain: this.domain,
		expires: (this.expires as Date).getTime(),
		path: this.path,
		sameSite: this.sameSite,
		secure: this.secure,
		value: this.value
    })
	
	toString = () => {
		const p = () => {
			const params: string[] = [`${this.name}=${this.value}`, this.expires && `expires=${this.expires}`, this.path && `path=${this.path}`, this.domain && `domain=${this.domain}`]
			if (this.secure){
				params.push('Secure')
			}
			if (this.httpOnly){
				params.push('HttpOnly')
			}
			if (this.host){
				params.unshift('__Host-')
			}
			else if (this.secure){
				params.unshift('__Secure-')
			}
			if (this.sameSite){
				params.push(`SameSite=${this.sameSite}`)
			}
			return params.filter((a) => a).join('; ')
		}
	}

	addEventListener(listener: (event: CookieInstanceEvent) => void){
		const theListener = (event: CookieEvent) => {
			this.__listeners.push({
				f: listener
				ef: (event: CookieEvent) => {
					new Proxy(event, {
						get: (t, key: keyof CookieEvent) => {
							if (key === 'target'){
								return t.changed.find((change) => {
									this.pVals 
								})
							}
							return t[key]
						}
					})
				}
			})
		}
	}

	get name(){ return this.pVals.name }

	static addEventListener(listener: (changes: CookieChanges[]) => void){
		this.__listeners.push(listener)
	}

	removeEventListener(listener: (changes: CookieChanges) => void){
		this.__listeners = this.__listeners.filter((l) => l !== listener)
	}

	static removeEventListener(listener: (changes: CookieChanges[]) => void){
		this.listeners = this.listeners.filter((l) => l !== listener)
	}

	valueOf(){
		return this.value
	}

	get value(){
		for (const elem of document.cookie.split(';')){
			let [key, value]: string[] = elem.split('=')
			if (key.trim() === this.name){
				return decodeURIComponent(value)
			}
		}
	}

	get path(){
		return this.parameters.path;
	}

	getPath = () => new Promise<string>((resolve) => {
		this.refresh(['path']).then(() => {
			resolve(this.path)
		})
	})

	get domain(){
		return this.parameters.domain;
	}

	get host(){
		return this.parameters.host;
	}

	getDomain = () => new Promise<string>((resolve) => {
		this.refresh(['domain']).then(() => {
			resolve(this.domain)
		})
	})

	get expires(){
		return this.parameters.expires;
	}

	getExpires = () => new Promise<Date>((resolve) => {
		this.refresh(['expires']).then(() => {
			resolve(this.expires as Date)
		})
	})
	
	get secure(){
		return this.parameters.secure;
	}

	getSecure = () => new Promise<boolean>((resolve) => {
		this.refresh(['secure']).then(() => {
			resolve(this.secure)
		})
	})

	get maxAge(){
		return this.parameters.maxAge;
	}

	get sameSite(){
		return this.parameters.sameSite;
	}

	getSameSite = () => new Promise<'strict' | 'lax' | 'none'>((resolve) => {
		this.refresh(['sameSite']).then(() => {
			resolve(this.sameSite)
		})
	})

	get httpOnly(){
		return this.parameters.httpOnly
	}
	
	get parameters(): CookieParams{
		return this.pVals;
	}

	set value (value) {
		SuperCookie.set(this.name, value, this.parameters);
	}

	set expires(value: string | number | false | Date){
		if (value !== undefined){
			if (!(value instanceof Date)){
				value = new Date(value === false ? "2038-01-19 04:14:07" 
					: value === null ? 0 
						: value)
			}
			if (isNaN(value.getTime())){
				throw new TypeError('Invalid Date')
			}
			this.parameters.expires = value;
			SuperCookie.set(this.name, this.value, this.parameters)
		}
	}

	set httpOnly(value){
		this.parameters.httpOnly = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set secure(value){
		this.parameters.secure = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set path(value){
		this.parameters.path = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set domain(value){
		this.parameters.domain = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set maxAge(value){
		this.parameters.maxAge = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set parameters(parameters: CookieParams){
		if (parameters.maxAge){
			parameters.maxAge
		}
		this.pVals = parameters;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set sameSite(value){
		this.pVals.sameSite = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	set prefix(value: CookieParams["prefix"]){
		this.pVals.prefix = value;
		SuperCookie.set(this.name, this.value, this.parameters)
	}

	delete(){
		SuperCookie.delete({name: this.name, path: this.path, domain: this.domain})
	}

	static set (name: string, value: any, parameters: CookieParams) {
		if (name){
			const typeObject = (value: any, topLevel?: boolean): string => {
				if (value === undefined){
					return 'undefined:undefined'
				}
                if (value === null){
                    return 'null:null'
                }
                switch (value.constructor.name) {
                    case 'Date':
                        return `${value.constructor.name}:${value.toJSON()}`;
                    case 'Symbol':
                        return `${value.constructor.name}:${value.toString().substring(7, value.toString().length - 1)}`
                    case 'Boolean':
                    case 'BigInt':
                        return `${value.constructor.name}:${value}`;
                    default:
                        return typeof value === 'object'
						? topLevel ? `${value.constructor.name}:${JSON.stringify(typeObject(value))}` : 
						value instanceof Array 
							? value.map((v) => typeObject(v))
							: Object.entries(value).reduce((value: {[key: string]: any}, entry: [string, any]) => ({...value, [entry[0]]: typeObject(entry[1])}), {})
					: value;
				}
			}
			value = typeObject(value, true)
			let cookieString = name + '=' + encodeURIComponent(value) + ';';

			document.cookie = cookieString;
		}
		else {
			throw 'TypeError: Requires (name, value, [parameters]) arguments';
	    }
	}

    static get (name: string, asPlainObject?: boolean) {
		return this.getFull(asPlainObject)[name]
	}

	__fromGet = <K extends keyof CookieStoreGetOptions>([key, value]: [K, CookieStoreGetOptions[K] ]): void => {
		switch (key) {
			case 'name':
				this.name = value as string;
				break;
			case 'domain':
				this.domain = value as string;
				break;
			case 'expires':
				this.expires = value as number;
				break;
			case 'path':
				this.path = value as string;
				break;
			case 'sameSite':
				this.sameSite = (value as string)[0].toLowerCase() + (value as string).substring(1) as 'strict' | 'lax' | 'none';
				break;
			case 'secure':
				this.secure = value as boolean;
				break;
			case 'value':
				this.value = value as string;
				break;
		}
	}

	refresh = new Proxy<CookieRefreshOptions>((() => {}) as unknown as CookieRefreshOptions, {
		apply: (t, [toRefresh]: [CookieStoreKeys[]]) => {
			return new Promise<CookieStoreGetOptions>((resolve) => {
				if (SuperCookie.getCookieStore()){
					SuperCookie.getCookieStore().get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
						if (!toRefresh.length ){
							this.name = cookie.name;
							this.domain = cookie.domain;
							this.expires = cookie.expires;
							this.path = cookie.path;
							this.sameSite = cookie.sameSite;
							this.secure = cookie.secure;
							this.value = cookie.value;
						}
						toRefresh.forEach((key) => {
							this.__fromGet([key, cookie[key]])
						})
						resolve(this.toJSON())
					})
				}
				else {
					resolve (this.toJSON())
				}
			})
		},
		get: (t, key: CookieStoreKeys) => {
			return () => new Promise<CookieStoreGetOptions>((resolve) => {
				if (SuperCookie.getCookieStore()){
					SuperCookie.getCookieStore().get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
						this.__fromGet([key, cookie[key]])
						resolve(this.toJSON())
					})
				}
				else {
					resolve(this.toJSON())
				}
			})
		}
	})

	//** Retrieves all cookie elements for this document's cookies as an array of SuperCookies */
	static getFull(asPlainObject?: boolean): {[name: string]: any} {
		return document.cookie.split(';').reduce((cookie: {[name: string]: any}, val: string) => {
			let [key, valueOf]: string[] = val.split('=')
			key = key.trim()
			if (!asPlainObject){
				const params: CookieParams = {}
				if (key.match(/$__Host-/)){
					key = key.substring(7)
					params.prefix = "host"
				}
				if (key.match(/$__Secure-/)){
					key = key.substring(9)
					params.prefix = 'secure'
				}
				return {...cookie, [key]: new SuperCookie(key, params)}
			}
			val = decodeURIComponent(valueOf)
			const untype = (value: any): any => {
				if (value instanceof Array){
					return value.map(value => untype(value))
				}
				if (value instanceof Object){
					return Object.entries(value).reduce((val: {[key: string]: any}, entry: [string, any]) => ({...val, [entry[0]]: untype(entry[1])}), {})
				}
				if (typeof value === 'number' || (Number(value) == value && String(Number(value)) === value)){
					return Number(value)
				}
				if (typeof value === 'string' && !value.includes(":")){
					return value
				}
				if (typeof value === 'string' && value === 'null:null'){
					return null;
				}
				if (typeof value === 'string' && value === 'undefined:undefined'){
					return undefined;
				}
				const [identifier, ...decodedVal]: string[]=value.split(':')
				value = decodedVal.join(':')
				// @ts-ignore
				switch (identifier) {
					case 'Array':
					case 'Object':
						return untype(JSON.parse(value))
					case 'Date':
						return new Date(value);
					case 'Boolean':
						return value === 'true';
					case 'BigInt':
						return BigInt(value);
					case 'Symbol':
						return Symbol(value);
					default:
						return value;
				}
			}
			return {...cookie, [key]: untype(val)}
		}, {})
    }

    static delete(name: string): void;
	static delete(options: {
		name: string,
		partitioned?: boolean,
		path?: string,
		url?: string
	}): void
	static delete(nameOrOptions: string | {	name: string, partitioned?: boolean, path?: string, url?: string, domain?: string }) {
		if (typeof nameOrOptions === 'string'){
			if (cookieStore){
				cookieStore.delete({name: nameOrOptions}) 
			}
			else {
				document.cookie=`${name}=null; max-age=0;`
			}
		}
		else {
			if (cookieStore){
				cookieStore.delete(nameOrOptions)
			}
			else {
				const {name, path, url} = nameOrOptions
				const domain = nameOrOptions.domain || url ? new URL(url).hostname : undefined
				document.cookie = `${name}=null; max-age=0; ${path ? `path=${path};` : ''}${domain ? `domain=${domain};` : ''}`
			}
		}
    }

}

cookieStore?.addEventListener('change', SuperCookie.__runListeners)