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
export default class SVZCookie{
	pVals: CookieParams;
	name: string;
	constructor(name: string, value?: any, parameters: CookieParams = {}){
		this.name = name;
		this.pVals = parameters;
		if (value){
			this.value = value
		}
	}

	toJSON = () => {
	    return this.value
    }

	valueOf(){
		return this.value
	}

	get value(){
		return SVZCookie.get(this.name)
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
		SVZCookie.set(this.name, value, this.parameters);
	}

	set expires(value){
		this.parameters.expires = value;;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set path(value){
		this.parameters.path = value;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set domain(value){
		this.parameters.domain = value;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set maxAge(value){
		this.parameters.maxAge = value;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set parameters(parameters: CookieParams){
		if (parameters.maxAge){
			parameters.maxAge
		}
		this.pVals = parameters;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set sameSite(value){
		this.pVals.sameSite = value;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	set prefix(value: CookieParams["prefix"]){
		this.pVals.prefix = value;
		SVZCookie.set(this.name, this.value, this.parameters)
	}

	delete(){
		SVZCookie.delete(this.name)
	}

	static set (name: string, value: any, parameters: CookieParams) {
		if (name && value){
			switch(value.constructor.name){
				case 'Object':
				case 'Array':
					value = `JSON:${JSON.stringify(value)}`
				case 'Date':
					value = `${value.constructor.name}:${value.toJSON()}`
				case 'Number':
				case 'Boolean':
					value = `${value.constructor.name}:${value}`
				default: 
					value = typeof value === "object" ? `JSON:${JSON.stringify(value)}` : `String:${value}`
			}
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
								cookieString += parameters?.path?.charAt(0) === '/' ? parameters?.path : ' /' + parameters?.path + ';';
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

	//** Retrieves all cookie elements for this document's cookies as an array of SVZCookies */
	static getFull(asPlainObject?: boolean): {[name: string]: any} {
		return document.cookie.split(';').reduce((cookie: {[name: string]: any}, val: string) => {
			let [key, value]: any[] = val.split('=')
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
				return new SVZCookie(key, undefined, params)
			}
			const [identifier, ...decodedVal]: string[]= decodeURIComponent( value ).split(':')
			value = decodedVal.join(':')
			switch(identifier){
				case 'Array':
				case 'Object':
					value = JSON.parse(value)
				case 'Date':
					value = new Date(value)
				case 'Number':
					value = Number(value)
				case 'Boolean':
					value = value === 'true'
			}
			return {...cookie, [key]: value}
		}, {})
    }

    static delete(name: string) {
    	document.cookie= name+'=null; max-age=0;'
    }

}