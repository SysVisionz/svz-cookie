type CookieStoreKey = 'name' | 'domain' | 'expires' | 'path' | 'sameSite' | 'secure' | 'value'

type SuperCookieSetOptions = {
	domain?: string,
	/** 
	 * string will be processed into a Date Object then into a number.
	 * number will be used as provided.
	 * Date will be converted to a number.
	 * null will be converted to 0, deleting the cookie.
	 * false will be converted to 34560000000, which is the maximum cookie lifespan.
	 */
	expires?: Date | number | string | null | false,
	/** always converts to string */
	name?: string | number,
	partitioned?: boolean,
	path?: string,
	sameSite?: 'strict' | 'lax' | 'none',
	secure?: boolean,
	value: string,
	noNullExpires?: boolean
}

interface SuperCookieDefaults extends Omit<CookieStoreSetOptions, 'expires' | 'name' | 'noNullExpires'>{
	expires?: Date | false
	name: string
}

interface CookieStoreGetReturn extends Omit<CookieStoreSetOptions, 'value' | 'expires' | 'name' | "noNullExpires" >{
	expires: number,
	name: string,
	value: string
}

type ChangeObject = {
	domain: string | null, expires: string | number, name: string, partitioned: boolean,
	path: string, sameSite: 'strict' | 'lax' | 'none', secure: boolean, value: string
}

interface CookieInstanceEvent extends CookieEvent {
	target: ChangeObject
}

export default class SuperCookie<V = any>{
	pVals: SuperCookieDefaults;
	name: string;
	changing: boolean
	static get cookieStore() {return typeof window === 'undefined' ? null : window.cookieStore || null}
	static get __dCookie() { return typeof window === 'undefined' ? null : window.document.cookie}
	__listeners: Map<(event: CookieEvent) => void, (evt: CookieEvent) => void> = new Map();
	constructor(name: string, parameters: Partial<Omit<SuperCookieSetOptions, 'name'>> = {}){
		this.name = name;
		SuperCookie.cookieStore.get(name).then((cookie) => {
			let curr = SuperCookie.__formatter.supercookie(cookie)
		})
		if (!name){}
		this.addEventListener((event) => {
			if (!this.changing){
				const thisChange = event.changed.find((cookie) => cookie.name === this.name)
				if (thisChange){
					const {
						domain, expires, path, sameSite, value
					} = thisChange
					this.domain = domain;
					this.expires = expires;
					this.path = path;
					this.sameSite = sameSite[0].toLowerCase() + sameSite.substring(1) as "strict" | "lax" | "none";
					this.value = value;
				}
			} else {
				this.changing = false;
			}
		})
		this.refresh('value', 'domain', 'expires', 'path', 'sameSite')
	}

	toJSON = (): SuperCookieDefaults => ({
		name: this.name,
		domain: this.domain,
		expires: this.expires,
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
			this.__listeners.set(listener, (event: CookieEvent) => {
				if (event.changed.find((cookie) => cookie.name === this.name)){
					listener(event)
				}
			})
		}
	}

	removeEventListener(listener: (event: CookieInstanceEvent) => void){
		const theListener = this.__listeners.get(listener)
		this.__listeners.delete(listener)
		SuperCookie.cookieStore.removeEventListener('change', theListener)
	}

	getCookie = () => {
		return SuperCookie.cookieStore.get(this.name)
	}


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
		this.parameters.value
	}

	get host(){
		return this.parameters.host;
	}

	get path(){
		return this.parameters.path;
	}

	get domain(){
		return this.parameters.domain;
	}

	get expires(){
		return this.parameters.expires;
	}
	
	get secure(){
		return this.parameters.secure;
	}

	get maxAge(){
		return this.parameters.maxAge;
	}

	get sameSite(){
		return this.parameters.sameSite;
	}

	get httpOnly(){
		return this.parameters.httpOnly
	}
	
	get parameters(): CookieParams{
		return this.pVals;
	}

	set value (value) {
		typeof value === 'object'
		? SuperCookie.set(this.name, this.value, value) 
		: SuperCookie.set(this.name, value, this.parameters);
	}

	set = (value: Partial<CookieParams>) => {
		this.getCookie().then((cookie) => {
			let changing: Partial<CookieParams> = {}
			
			for (const i in value){
				if (value[i as keyof CookieParams] !== cookie[i as keyof typeof cookie]){
					this.changing[i]
				}
			}
		})
	}

	// #region value conversion
	static __valueConvert = (value: any, topLevel?: boolean): string => {
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
				? topLevel ? `${value.constructor.name}:${JSON.stringify(this.__valueConvert(value))}` : 
				value instanceof Array 
					? value.map((v) => this.__valueConvert(v))
					: Object.entries(value).reduce((value: {[key: string]: any}, entry: [string, any]) => ({...value, [entry[0]]: typeObject(entry[1])}), {})
			: value;
		}
	}
	// #endregion

	// #region formatter
	static __formatter: {
		/** this is to ensure standardization of internal supercookie behaviors for matching purposes, no matter what the user inputs. */
		supercookie: (cookie: Partial<CookieStoreGetReturn> | Partial<CookieStoreSetOptions>, options: {preserveFalsyExpirations?: boolean}) => Partial<CookieStoreGetOptions>,
		cookie: (cookie: Partial<CookieStoreSetOptions>) => Partial<CookieStoreGetReturn>
	} = new Proxy({} as {superCookie: (cookie: Partial<CookieStoreGetOptions>) => Partial<CookieStoreGetOptions, cookie: (cookie: Partial<CookieStoreSetOptions>) => void}, {
		cookie: (cookie: Partial<CookieStoreSetOptions>): CookieStore => {
			for (const i in cookie){
				switch(i){
					case 'expires':
						if (cookie.expires !== undefined){
							cookie.expires = (cookie.expires instanceof Date ? cookie.expires : new Date(
								cookie.expires === false ? new Date().getTime() + 34560000000
								: cookie.expires === null ? 0 
								: cookie.expires)).getTime()
							if (typeof cookie.expires !== 'string' && isNaN(cookie.expires)){
								throw new TypeError('Invalid Date')
							}
							cookie.expires = cookie.expires instanceof Date ? cookie.expires.getTime() : cookie.expires;
						}				
						break;
					case 'sameSite':
						cookie.sameSite = cookie.sameSite[0].toUpperCase() + cookie.sameSite.substring(1)
						break;
					case 'value':

						
				}
			}
		}
	}
	// #endregion



	set expires(value: string | number | false | Date){
	}

	set httpOnly(value){
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
		if (!this.httpOnly) {
			this.pVals = parameters
		}
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

	static set (name: string, value: any, parameters?: CookieParams) {
		if (name){

			value = typeObject(value, true)
			// #region setting Cookie
			// This is necessary because the cookieStore API set functionality operates exclusively as a promise, and we require a synchronous operation.
			let cookieString = name + '=' + encodeURIComponent(value) + ';';
			if (parameters){
				for (const i in parameters){
					if (typeof i !== 'symbol' && parameters[i as keyof CookieParams]){
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
			throw 'TypeError: Requires name argument';
	    }
	}

    static get (name: string, asPlainObject?: boolean) {
		return this.getFull(asPlainObject)[name]
	}

	__fromGet = <K extends keyof CookieStoreGetOptions>(key: K, value: CookieStoreGetOptions[K]): void => {
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
		apply: (t, toRefresh: CookieStoreKey[]) => {
			return new Promise<CookieStoreGetOptions>((resolve, rej) => {
				SuperCookie.cookieStore?.get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
					toRefresh.forEach((key) => {
						this.__fromGet(key, cookie[key])
					})
					resolve(this.toJSON())
				}).catch(err => rej(err)) || resolve (this.toJSON())
			})
		},
		get: (t, key: CookieStoreKey) => {
			return () => new Promise<CookieStoreGetOptions>((resolve) => {
				SuperCookie.cookieStore?.get({name: this.name}).then((cookie: CookieStoreGetOptions) => {
					this.__fromGet(key, cookie[key])
					resolve(this.toJSON())
				}) || resolve(this.toJSON())
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

	addEventListener(action: (event: CookieEvent) => void){
		const val = (evt: CookieEvent) => {
			if (evt.changed.find((cookie) => cookie.name === this.name)){
				action(evt)
			}
		}
		this.__listeners.set(action, val)
		SuperCookie.cookieStore?.addEventListener('change', val)
	}

	removeEventListener(listener: (event: CookieEvent) => void){
		const val = this.__listeners.get(listener)
		this.__listeners.delete(listener)
		SuperCookie.cookieStore?.removeEventListener('change', val)
	}

    static delete(name: string, pathAndDomain: {path?: string, domain?: string}): void;
	static delete(name: string, path?: string): void
	static delete(name: string, pathOrPathAndDomain?: string | {path?: string, domain?: string}) {
		if (typeof pathOrPathAndDomain === 'string'){
			pathOrPathAndDomain = {path: pathOrPathAndDomain}
		}
    }

}

cookieStore?.addEventListener('change', SuperCookie.__runListeners)