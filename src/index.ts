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
export default class SuperCookie<V = any>{
	pVals: CookieParams;
	name: string;
	constructor(name: string, parameters: CookieParams = {}){
		this.name = name;
		// const {cookieStore} = window;
		// if (cookieStore){
        //     cookieStore.getAll({name}).then(cookiesList => {
		// 		cookiesList.find(cookie => {
		// 			if (!parameters){
		// 				return true;
		// 			}
		// 			for (const i in parameters){
						
		// 			}
		// 		})
		// 	})
        // }
        // else {
            this.pVals = parameters;
        // }
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
		SuperCookie.set(this.name, value, this.parameters);
	}

	set expires(value){
		this.parameters.expires = value;;
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
		SuperCookie.delete(this.name, this.path)
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

    static delete(name: string, path?: string) {
    	document.cookie=`${name}=null; max-age=0; ${path ? `path=${path}` : ''}`
    }

}