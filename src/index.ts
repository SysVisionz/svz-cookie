interface SuperCookieInitOptions<V = any> {
	domain?: string,
	/** 
	 * string will be processed into a Date Object then into a number.
	 * number will be used as provided.
	 * Date will be converted to a number.
	 * null will be converted to 0, deleting the cookie.
	 * false will be converted to 34560000000 (400 days), which is the maximum cookie lifespan.
	 * Note that when converting back from a cookie, values of greater than 25920000000 (300 days) will be assumed to be equivalent to false.
	 * If you wish to skip this conversion, set preserveFalsyExpirations to true.
	 */
	expires?: Date | number | string | null | false,
	/** always converts to string */
	name: string | number,
	partitioned?: boolean,
	path?: string,
	sameSite?: 'strict' | 'lax' | 'none',
	secure?: boolean,
	value?: V,
	preserveFalsyExpirations?: boolean
}

interface SuperCookieSetOptions<V = any> extends Omit<SuperCookieInitOptions<V>, 'name' | 'value'> {
	name?: string | number
	value?: V
}

interface SuperCookieDefaults<V = any> extends Omit<SuperCookieSetOptions<V>, 'expires' | 'name' >{
	expires?: Date | false
	name: string
}

interface CookieStoreGetReturn extends Omit<CookieStoreSetOptions, 'value' | 'expires' | 'name' | "preserveFalsyExpirations" >{
	expires: string,
	name: string,
	value: string
}

type DirectFormatter<K extends 'cookie' | 'superCookie'> = (cookie: (K extends 'superCookie' ? Partial<CookieStoreGetReturn> | Partial<SuperCookieInitOptions> : Partial<SuperCookieInitOptions>), options?: {preserveFalsyExpirations?: boolean}) => (K extends "cookie" ? Partial<CookieStoreSetOptions>
	: K extends "superCookie" ? Partial<SuperCookieDefaults>
	: never)

interface Formatter {
	cookie: {
		(...args: Parameters<DirectFormatter<'cookie'>> ): ReturnType<DirectFormatter<'cookie'>>,
	} & Omit<{
		[K in keyof CookieStoreSetOptions]: (value: CookieStoreSetOptions[K]) => CookieStoreSetOptions[K]
	}, 'expires'> & {
		'expires': (value: CookieStoreSetOptions['expires'], preserveFalsyExpirations?: boolean) => number
	}
	superCookie: {
		(...args: Parameters<DirectFormatter<'superCookie'>>): ReturnType<DirectFormatter<'superCookie'>>
	} & Omit<{ 
		[K in keyof (CookieStoreSetOptions & CookieStoreGetReturn)]: (value: CookieStoreSetOptions[K] & CookieStoreGetReturn[K]) => SuperCookieDefaults
	}, 'expires'> & {
		'expires': (value: CookieStoreSetOptions['expires'] & CookieStoreGetReturn["expires"], preserveFalsyExpirations?: boolean) => SuperCookieDefaults["expires"]
	}
}

export default class SuperCookie<V = any>{
	__pVals: SuperCookieDefaults;
	changing: boolean
	static get cookieStore() {return typeof window === 'undefined' ? null : window.cookieStore || null}
	static get __dCookie() { return typeof window === 'undefined' ? null : window.document.cookie}
	__listeners: Map<(event: CookieEvent) => void, (evt: CookieEvent) => void> = new Map();
	constructor(parameters: Omit<SuperCookieInitOptions<V>, 'name'> & {name: string | number})
	constructor(name: SuperCookieInitOptions['name'], parameters?: Omit<SuperCookieInitOptions<V>, 'name'>)
	/** when using this style and not including parameters as the third argument, the value MUST NOT be an object with a key called "value", or this will break. */
	constructor(name: SuperCookieInitOptions['name'], value: SuperCookieInitOptions["value"], parameters?: Partial<Omit<SuperCookieInitOptions, 'name' | 'value'>>)
	constructor(
		nameOrParameters: string | number | Omit<SuperCookieInitOptions, 'name'> & {name: string | number},
		valueOrParameters?: V | Partial<Omit<SuperCookieInitOptions, 'name'>>,
		parameters?: Partial<Omit<SuperCookieInitOptions, 'name' | 'value'>>
	){
		const {name, value, ...params}: {name: string, value: SuperCookieInitOptions<V>['value']} & SuperCookieInitOptions = SuperCookie.__sortFromArgs<V>(nameOrParameters, valueOrParameters, parameters)
		if (!name){
			throw `SuperCookie always requires a name value.`
		}
		this.set = this.set.bind(this)
		SuperCookie.get(name, {preserveFalsyExpirations: params.preserveFalsyExpirations}).then((cookie) => {
			if (!cookie){
				if(!value){
					throw(`Cookie ${name} does not exist and no value was provided! You must immediately give cookie a value!`)
				}
				else {
					cookie = {} as SuperCookieDefaults
				}
			}
			this.__pVals = {
				...cookie,
				...SuperCookie.__formatter.superCookie({name, value, ...params}, {preserveFalsyExpirations: params.preserveFalsyExpirations})
			} as SuperCookieDefaults
			if (!this.equals(cookie)){
				console.log('setting new values for cookie')
				this.set().then(() => {
					SuperCookie.get(name).then(v => {
						this.ready = true;
						this.parameters = v
					}).catch(err => {throw err?.message ? err.message : err})
				}).catch(err => {
					throw err?.message ? err.message : err
				})
			}
		}).catch(err => {
			console.error(err?.message || err)
		})
		if (!name){}
		this.addEventListener((event) => {
			const vals: SuperCookieDefaults = (({domain, expires, path, sameSite, value}: Partial<SuperCookieDefaults>) => ({
				domain, expires, path, sameSite, value
			}))(SuperCookie.__formatter.superCookie(event.change)) as SuperCookieDefaults
			this.__pVals = vals
		})
	}

	__prune = <K extends (keyof SuperCookieDefaults<V>)[]>(...args: K): Omit<SuperCookieDefaults<V>, K[number]> => {
		let superCookie: Omit<SuperCookieDefaults<V>, K[number]>  = this.parameters
		for (const key of args){
			delete superCookie[key as keyof typeof superCookie]
		}
		return superCookie
	}

	asObject = (): SuperCookieDefaults => ({
		name: this.name,
		domain: this.domain,
		expires: this.expires as Date | false,
		path: this.path,
		sameSite: this.sameSite,
		secure: this.secure,
		value: this.value as any
    })
	
	toString = () => {
		const p = () => {
			const params: string[] = [`${this.name}=${this.value}`, this.expires && `expires=${this.expires}`, this.path && `path=${this.path}`, this.domain && `domain=${this.domain}`]
			if (this.secure){
				params.push('Secure')
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

	static addEventListener(listener: (evt: CookieEvent) => void){
		return SuperCookie.cookieStore.addEventListener('change', listener)
	}

	static removeEventListener(listener: (changes: CookieEvent) => void){
		return SuperCookie.cookieStore.removeEventListener('change', listener)
	}

	valueOf(){
		return this.value
	}

	get name(){
		return String(this.parameters.name)
	}

	get value(){
		return this.parameters.value
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

	get sameSite(){
		return this.parameters.sameSite;
	}
	
	get parameters(): SuperCookieDefaults<V>{
		return this.__pVals;
	}

	get preserveFalsyExpirations(){
		return this.parameters.preserveFalsyExpirations;
	}

	ready: boolean = false;

	// #region to Cookie value
	static __cookievalueConvert = (value: any, topLevel?: boolean): string => {
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
				? topLevel ? `${value.constructor.name}:${JSON.stringify(this.__cookievalueConvert(value))}` : 
				value instanceof Array 
					? value.map((v) => this.__cookievalueConvert(v))
					: Object.entries(value).reduce((value: {[key: string]: any}, entry: [string, any]) => ({...value, [entry[0]]: this.__cookievalueConvert(entry[1])}), {})
			: value;
		}
	}
	// #endregion

	// #region to SuperCookie value
	static __superCookieValueConvert = (value: any, topLevel?: boolean): any => {
		if (value instanceof Array){
			return value.map(value => this.__superCookieValueConvert(value))
		}
		if (value instanceof Object){
			return Object.entries(value).reduce((val: {[key: string]: any}, entry: [string, any]) => ({...val, [entry[0]]: this.__superCookieValueConvert(entry[1])}), {})
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
				return this.__superCookieValueConvert(JSON.parse(value))
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
	// #endregion

	get cookie () {
		return SuperCookie.__formatter.cookie(this.__pVals)
	}

	// #region formatter
	static __formatter: Formatter= new Proxy<Formatter>({} as Formatter, {
		get: <K extends 'superCookie' | 'cookie'>(_t: Formatter, p: K, _r: Formatter) => {
			if (!['superCookie', 'cookie'].includes(p)){
				throw new TypeError('Invalid Formatter option attempted')
			}
			return new Proxy<Formatter[K]>((() => {}) as unknown as Formatter[K], {
				apply: (t, thisArg, [params, options]: Parameters<(K extends "superCookie" ? Formatter["superCookie"]["apply"] : Formatter["cookie"]["apply"])>) => {
					let retVal: any = {}
					for (const i in params){
						if (![undefined, null].includes(params[i])){
							retVal[i] = thisArg[p][i](params[i])
						}
					}
					return retVal
				},
				get: <P extends keyof (Formatter["cookie"] & Formatter["superCookie"])>(obj: Formatter[K], key: P, ref: Formatter[K])=> {
					return (v: any, options?: {preserveFalsyExpirations?: boolean}) => {
						const {preserveFalsyExpirations} = options || {}
						switch(key){
							case 'expires':
								if (p === 'cookie'){
									if (v !== undefined){
										v = (v instanceof Date ? v : new Date(
											v === false ? new Date().getTime() + 34560000000
											: v === null ? 0 
											: v))
										return v.toUTCString()
									}
								}
								else {
									v = v instanceof Date ? v : v === undefined ? undefined : new Date(v)
									if (v.getTime() > new Date().getTime() + 25920000000 && !preserveFalsyExpirations){
										return false
									}
								}
								return v;
								case 'value':
									return p === 'cookie' ? this.__cookievalueConvert(v, true) : typeof v === 'string' ? this.__superCookieValueConvert(v) : v
							case 'name':
								v = v.toString()
							case 'sameSite':
							case 'domain':
							case 'path':
								return v
							case 'secure':
							case 'partitioned' as keyof CookieStoreSetOptions:
								return v;
							default:
								throw new TypeError('Invalid parameter submitted')
						}
					}
				}
			})
		}
	})
	// #endregion

	set name(value) {
		this.__pVals.name = String(value)
	}

	set expires(value: string | number | false | Date | null){
		this.__pVals.expires = SuperCookie.__formatter.superCookie({expires: value}).expires
	}

	set secure(value){
		this.__pVals.secure = value;
	}

	set path(value){
		this.__pVals.path = value;
	}

	set domain(value){
		this.__pVals.domain = value;
	}

	set parameters(parameters: Omit<SuperCookieSetOptions<V>, 'name'> & {name: string | number}){
		this.__pVals = SuperCookie.__formatter.superCookie(parameters) as SuperCookieDefaults<V>
	}

	set sameSite(sameSite){
		this.__pVals.sameSite = sameSite;
	}

	set preserveFalsyExpirations(value){
		this.__pVals.preserveFalsyExpirations = value
	}

	delete(){
		SuperCookie.delete(this.name, {path: this.path, domain: this.domain})
	}

	copy = (name: string) => {
		return new SuperCookie(this.parameters)
	}

	static copy (name: string, newName: string, {preserveFalsyExpirations}: {preserveFalsyExpirations?: boolean} = {}) {
		return SuperCookie.get(name).then(({domain, expires, partitioned, path, sameSite, value, secure}) => new SuperCookie(newName, {
			domain,
			expires,
			partitioned,
			path,
			sameSite,
			secure,
			value,
			preserveFalsyExpirations
		}))
	}

	static __sortFromArgs = <V extends any>(
		nameOrParameters?: string | number | (Omit<SuperCookieInitOptions, 'name'> & {name: string | number}),
		valueOrParameters?: Partial<Omit<SuperCookieInitOptions, 'name'>> | any,
		params?: Partial<Omit<SuperCookieInitOptions, 'name' | 'value'>>
	) => {
		if (!nameOrParameters){
			return null
		}
		const {name, value, ...parameters}: {name: string, value: SuperCookieInitOptions<V>['value']} & SuperCookieInitOptions = {
			name: !(typeof nameOrParameters === 'object') ? String(nameOrParameters) : String(nameOrParameters.name),
			value: params 
				? valueOrParameters
				: typeof valueOrParameters === 'object' && valueOrParameters.value ? valueOrParameters.value : valueOrParameters,
			...(params ? params : typeof nameOrParameters === 'object' ? nameOrParameters : (valueOrParameters as Omit<SuperCookieInitOptions<V>, 'name'>)?.value && valueOrParameters)
		}
		return {name, value, ...parameters}
	}

	set <SV = V> (parameters?: Omit<SuperCookieInitOptions<V>, 'name'>): Promise<void>
	/** when using this style and not including parameters as the second argument, the value MUST NOT be an object with a key called "value", or this will break. */
	set <SV = V>(value?: SuperCookieSetOptions["value"], parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>): Promise<void>
	set <SV = V>(
		valueOrParameters?: SV | Partial<Omit<SuperCookieInitOptions<SV>, 'name'>>,
		parameters?: Partial<Omit<SuperCookieInitOptions, 'name' | 'value'>>
	){
		return SuperCookie.set(this.name, valueOrParameters, parameters)
	}

	
	static set <V = any> (parameters: SuperCookieSetOptions<V> & {name: string | number}): Promise<void>
	static set <V = any>(name: SuperCookieSetOptions['name'], parameters?: Omit<SuperCookieSetOptions<V>, 'name'>): Promise<void>
	/** when using this style and not including parameters as the third argument, the value MUST NOT be an object with a key called "value", or this will break. */
	static set <V = any>(name: SuperCookieSetOptions['name'], value: SuperCookieSetOptions["value"], parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>): Promise<void>
	static set <V = any>(
		nameOrParameters: string | number | SuperCookieSetOptions<V> & {name: string | number},
		valueOrParameters?: V | Partial<Omit<SuperCookieSetOptions<V>, 'name'>>,
		parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>
	){
		const {name, value, ...params} = this.__sortFromArgs<V>(nameOrParameters, valueOrParameters, parameters);
		return SuperCookie.cookieStore.set(SuperCookie.__formatter.cookie({name, value, ...params}) as CookieStoreSetOptions)
	}

	setSync <SV = V>(parameters?: Omit<SuperCookieInitOptions<SV>, 'name'>): void;
	setSync <SV = V>(value: any, parameters?: Omit<SuperCookieInitOptions<SV>, 'name' | 'value'>): void 
	setSync <SV = V>(valueOrParameters?: any | Omit<SuperCookieInitOptions<SV>, 'name'>, parameters?: Omit<SuperCookieInitOptions<SV>, 'name' | 'value'>) {
		SuperCookie.setSync(this.name as string, valueOrParameters, parameters)
	}

	
	static setSync <SV = any>(params?: SuperCookieInitOptions<SV>): void;
	static setSync <SV = any>(name: string, params?: Omit<SuperCookieInitOptions<SV>, 'name'>): void;
	static setSync <SV = any>(name: string, value: SV, params?: Omit<SuperCookieInitOptions<SV>, 'name' | 'value'>): void 
	static setSync <SV = any>(nameOrParameters: string | SuperCookieInitOptions<SV>, valueOrParameters?: SV | Omit<SuperCookieInitOptions<SV>, 'name'>, parameters?: Omit<SuperCookieInitOptions<SV>, 'name' | 'value'>) {
		const {name, value, ...params} = this.__sortFromArgs<SV>(nameOrParameters, valueOrParameters, parameters)
		if (name && value){
			// #region setting Cookie
			// This is necessary because the cookieStore API set funcname: string, value: SuperCookieInitOptions<SV>['value']} & SuperCookieInitOptions<SV>tionality operates exclusively as a promise, and we require a synchronous operation.
			let cookieString = name + '=' + encodeURIComponent(value) + ';';
			if (params){
				const theParams = SuperCookie.__formatter.cookie(params)
				for (const i in theParams){
					if (![undefined, null].includes(theParams[i as keyof CookieStoreGetReturn])){
						switch(i) {
							case 'expires':
								cookieString += ` expires=${theParams.expires};`;
								break;
							case 'path':
								cookieString += ` path=${theParams.path};`;
								break;
							case 'secure':
								cookieString += theParams.secure ? ' secure;': "";
								break;
							case 'sameSite':
								cookieString += ` samesite=${theParams.sameSite};`;
								break;
							case 'domain':
								cookieString += ` domain=${theParams.domain};`;
								break;
							case 'partitioned':
								cookieString += theParams.partitioned ? ' partitioned;': "";
								break;
						}
					}
				}
			}
			document.cookie = cookieString;
		}
		else {
			throw 'TypeError: Requires both name and value arguments';
	    }
	}

	get = SuperCookie.get(this.name, {preserveFalsyExpirations: this.preserveFalsyExpirations})

    static get (name: string, options?: {preserveFalsyExpirations?: boolean}) {
		return new Promise<SuperCookieDefaults>(res => {
			this.cookieStore ? this.getAll(options).then(cookies => {res(cookies[name])})
			: this.getSync(name)
		})
	}

	getSync = (): {name: string, value: string} => SuperCookie.getSync(this.name)

	static getSync = (cookieName: string): {name: string, value: string} => {
		const [name, value] = this.__dCookie.split(';').map(v => v.trim()).find(v => v.match(RegExp(`^${name}=`))).split('=') as [string, string]
		return {name, value}
	}

	equals = (cookie: CookieStoreGetReturn | SuperCookieSetOptions) =>  SuperCookie.equals(this.__pVals, cookie)

	static __compareObject = (obj: {[key: string]: any}, obj2: {[key: string]: any}) => {
		for (const i of Object.keys({...obj, ...obj2})){
			const val1 = obj[i as keyof typeof obj]
			const val2 = obj2[i as keyof typeof obj2]
			if ([null, undefined].includes(val1) && [null, undefined].includes(val2) ){
				continue;
			}
			else if (typeof val1 !== typeof val2){
				console.error(`failed type check: ${typeof val1} !== ${typeof val2}`);
				return false;
			}
			else if (typeof val1 === 'object' ? !this.__compareObject(val1, val2) : val1 !== val2 ){
				return false;
			}
		}
		return true;
	}

	static equals = (cookie1: SuperCookieSetOptions | CookieStoreGetOptions, cookie2: SuperCookieSetOptions | CookieStoreGetReturn): boolean => {
		cookie1 = SuperCookie.__formatter.superCookie(cookie1)
		cookie2 = SuperCookie.__formatter.superCookie(cookie2)
		return this.__compareObject(cookie1, cookie2)
	}

	//** Retrieves all cookie elements for this document's cookies as an object of SuperCookies indexed by name. */
	static getAll(options: {preserveFalsyExpirations?: boolean}): Promise<{[name: string]: SuperCookieDefaults}> { return new Promise((res) => {
		SuperCookie.cookieStore.getAll().then((cookies) => {
			const processed = cookies.reduce((full: {[name: string]: SuperCookieDefaults}, cookie) => {
				const newCookie = SuperCookie.__formatter.superCookie(cookie, options) as SuperCookieDefaults
				return {...full, [newCookie.name]: newCookie}
			}, {} as {[name: string]: SuperCookieDefaults})
			res(processed)
    	})
	})}

	addEventListener(listener: (event: TargetedCookieEvent) => void){
		const val = (evt: CookieEvent) => {
			const cookie = evt.changed.find((cookie) => cookie.name === this.name)
			if (cookie){
				listener(new Proxy(evt as TargetedCookieEvent, {
					get: (t, key, r) => {
						if (key === 'change'){
							return cookie
						}
						else {
							return typeof evt[key as keyof typeof evt] === 'function' ? (evt[key as keyof typeof evt] as () => {}).bind(evt) : evt[key as keyof typeof evt]
						}
					}
				}))
			}
		}
		this.__listeners.set(listener, val)
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
		const {path, domain}: {path?: string, domain?: string} = pathOrPathAndDomain 
			? typeof pathOrPathAndDomain === 'string'
				? {path: pathOrPathAndDomain}
				: pathOrPathAndDomain
			: {}
		const options: Omit<CookieStoreSetOptions, 'name'> = {
			...(path === undefined ? {} : {path}),
			...(domain === undefined ? {} : {domain}),
			expires: null
		}
		this.set(name, options)
    }

}