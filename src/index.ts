type CookieStoreKeys = 'name' | 'domain' | 'expires' | 'path' | 'sameSite' | 'secure' | 'value'

type CookieStoreGetOptions = {
	name?: string,
	domain?: string,
	expires?: number,
	path?: string,
	secure?: boolean,
	sameSite?: 'Strict' | 'Lax' | 'None'
	value?: string
}

type CookieStoreSetOptions = {
	name: string,
	value: string,
	domain?: string,
	path?: string,
	secure?: boolean,
	httpOnly?: boolean,
	sameSite?: 'Strict' | 'Lax' | 'None',
	expires?: Date | number,
	maxAge?: number
}

type CookieStoreDeleteOptions = {
	name: string,
	domain?: string,
	path?: string,
	secure?: boolean,
	session?: boolean,
	sameSite?: 'Strict' | 'Lax' | 'None'
}

interface CookieEvent extends Event {
	changed: [{
		domain: string | null, expires: string | number, name: string, partitioned: boolean,
		path: string, sameSite: 'strict' | 'lax' | 'none', secure: boolean, value: string
	}]
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

declare global {
	interface Window {
		cookieStore?: CookieStore
	}
}

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

const cookieStore = window?.cookieStore as CookieStore;

export default class SuperCookie<V = any>{
	pVals: CookieParams;
	name: string;
	__listeners: ((event: CookieEvent) => void)[] = [];
	constructor(name: string, parameters: CookieParams = {}){
		this.name = name;
		this.pVals = parameters;
		if (cookieStore){
            cookieStore.addEventListener('change', (event) => {
				const thisChange = event.changed.find((cookie) => cookie.name === this.name)
				if (thisChange){
					const {
						domain, expires, path, sameSite, value
					} = thisChange
					this.domain = domain;
					this.expires = expires;
					this.path = path;
					this.sameSite = sameSite[0].toUpperCase() + sameSite.substring(1) as "Strict" | "Lax" | "None";
					this.value = value;
				}
			})
        }
	}

	toJSON = () => {
	    return this.value
    }

	valueOf(){
		return this.value
	}

	get value(){
		return SuperCookie.get(this.name, true)
	}

	getValue = () => new Promise<V>((resolve) => {
		this.refresh(['value']).then(() => {
			resolve(this.value as V)
		})
	})

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

	getSameSite = () => new Promise<'Strict' | 'Lax' | 'None'>((resolve) => {
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

	set expires(value: string | number | Date){
		if (!(value instanceof Date)){
			value = new Date(value)
		}
		if (isNaN(value.getTime())){
			throw new TypeError('Invalid Date')
		}
		this.parameters.expires = value;
		SuperCookie.set(this.name, this.value, this.parameters)
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
		SuperCookie.delete(this.name, {path: this.path, domain: this.domain})
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
			if (parameters){
				for (const i in parameters){
					if (parameters[i as keyof CookieParams]){
						switch(i) {
							case 'expires':
								const date= typeof parameters?.expires === 'object' ? parameters?.expires : new Date(parameters?.expires);
								cookieString += ' expires=' + date.toUTCString() + ';';
								break;
							case 'path':
								cookieString += 'path=' + parameters?.path + ';';
								break;
							case 'secure':
								cookieString += parameters?.[i] ? ' secure;': "";
								break;
							case 'sameSite':
								cookieString += ' samesite='+parameters?.sameSite + ';';
								break;
							case 'maxAge':
								cookieString += ' max-age='+parameters?.maxAge + ';';
								break;
							case 'domain':
								cookieString += ' domain='+parameters?.domain + ';';
								break;
							case 'httpOnly':
								cookieString += parameters?.[i] ? ' HttpOnly;' : '';
								break;
							case 'prefix':
								cookieString = `${parameters?.[i] === 'host' 
									? '__Host-'
									: parameters?.[i] === 'secure' ? '__Secure-' : ''}${cookieString}`
						}
					}
				}
			}
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
				this.sameSite = (value as string)[0].toUpperCase() + (value as string).substring(1) as 'Strict' | 'Lax' | 'None';
				break;
			case 'secure':
				this.secure = value as boolean;
				break;
			case 'value':
				this.value = value as string;
				break;
		}
	}

	get asGetOptions(): CookieStoreGetOptions{
		return {
			name: this.name,
			domain: this.domain,
			expires: (this.expires as Date).getTime(),
			path: this.path,
			sameSite: this.sameSite,
			secure: this.secure,
			value: this.value
		}
	}

	refresh = new Proxy<CookieRefreshOptions>((() => {}) as unknown as CookieRefreshOptions, {
		apply: (t, [toRefresh]: [CookieStoreKeys[]]) => {
			return new Promise<CookieStoreGetOptions>((resolve) => {
				cookieStore.get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
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
					resolve(this.asGetOptions)
				})
			})
		},
		get: (t, key: CookieStoreKeys) => {
			return () => new Promise<CookieStoreGetOptions>((resolve) => {
				cookieStore.get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
					this.__fromGet([key, cookie[key]])
					resolve(this.asGetOptions)
				})
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

	addEventListener(type: 'change', listener: (event: CookieEvent) => void){
		this.__listeners.push(listener)
	}

	static addEventListener = window?.cookieStore?.addEventListener

    static delete(name: string, pathAndDomain: {path?: string, domain?: string}): void;
	static delete(name: string, path?: string): void
	static delete(name: string, pathOrPathAndDomain?: string | {path?: string, domain?: string}) {
		if (typeof pathOrPathAndDomain === 'string'){
			pathOrPathAndDomain = {path: pathOrPathAndDomain}
		}
		const {path, domain} = pathOrPathAndDomain || {}
		document.cookie=`${name}=null; max-age=0; ${path ? `path=${path};` : ''}${domain ? `domain=${domain};` : ''}`
    }

}