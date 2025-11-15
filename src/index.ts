import SuperCookieStore, {SuperCookieCore<V>} from './CookieStore'

interface SuperCookieChangeEvent extends Event {
	readonly changed: ReadonlyArray<SuperCookie>;
	readonly deleted: ReadonlyArray<SuperCookie>;
}

type SuperCookieEventHandler = (event: SuperCookieChangeEvent) => void

const SCOptions = ["domain", "expires", "name", "partitioned", "path","sameSite","value", "onReady"]


export default class SuperCookie<V = any>{
	private __pVals: SuperCookieCore<V>
	private static __listeners: Map<(event: SuperCookieChangeEvent) => void, (evt: CookieChangeEvent) => void> = new Map();
	
	constructor(parameters: {name: string} & SuperCookieCore<V>)
	constructor(name: string, parameters: SuperCookieCore<V>, )
	/** when using this style and not including parameters as the third argument, the value MUST NOT be an object with a key called "value", or this will break. */
	constructor(name: string, value?: SuperCookieCore<V>["value"], parameters?: Partial<Omit<SuperCookieCore<V>, 'name' | 'value'>>)
	constructor(
		nameOrParameters: string | number | Omit<SuperCookieCore<V>, 'name'> & {name: string | number},
		valueOrParameters?: V | Partial<Omit<SuperCookieCore<V>, 'name'>>,
		parameters?: Partial<Omit<SuperCookieCore<V>, 'name' | 'value'>>
	){
		const {name, value, ...params}: {name: string, value: SuperCookieCore<V>['value']} & SuperCookieCore<V> = SuperCookie.__sortFromArgs<V>(nameOrParameters, valueOrParameters, parameters)
		if (!name){
			throw `SuperCookie always requires a name value.`
		}
		this.__pVals.name = name;
		// SuperCookies should always have name and value variables from the point they are set, formatted correctly.
		const curr = SuperCookie.__getAllSimpleSync()[name] ?? {name, value}
		if (!value && !curr){
			this.value = null;
		}
		this.__pVals = SuperCookie.__formatter.superCookie(value ? {name, value, ...params}: {...curr, ...(value ? {value}: {}), ...params, ...(this.preserveFalsyExpirations === undefined ? {} : {preserveFalsyExpirations: params.preserveFalsyExpirations})}) as SuperCookieDefaults<V>
		this.set = this.set.bind(this)
		this.onReady = params.onReady?.bind(this)
		SuperCookie.get(name, {preserveFalsyExpirations: params.preserveFalsyExpirations}).then((cookie) => {
			if (cookie && cookie.expires === null){
				delete cookie.expires
			}
			if (!cookie?.value && value){
				this.set({...cookie, ...this.parameters()}).then(() => {
					this.__theThenValue?.(this as SuperCookie);
					this.__thenHolder = null;
					this.addEventListener((event) => {
						if (this.ready && !this.equals(event.change)){
							this.__pVals = SuperCookie.__formatter.superCookie({...event.change, ...{preserveFalsyExpirations: this.preserveFalsyExpirations}}) as SuperCookieDefaults<V>
						}
					})
				}).catch(err => {
					throw err?.message ? err.message : err
				})
			}
		}).catch(err => {
			console.error(err?.message || err)
		})
	}

// #region parameter setters and getters.	

	nameVal: string;

	set name(_v){
		throw "name is read only"
	};

	get name() {
		return this.__pVals.name
	}
	
	get value(){
		return this.parameters.value || SuperCookieStore.getSync(this.name)?.value
	}			
	
	set value(value){
		this.parameters.value = value;
	}
	
	get domain(){
		return this.parameters.domain;
	}
	
	set domain(value){
		this.parameters.domain = value;
	}
	
	get expires(){
		return this.parameters.expires;
	}
	
	set expires(value: string | number | false | Date | null){
		this.parameters.expires = value as any
	}
	
	get partitioned() {
		return this.parameters.partitioned
	}

	set partitioned(v){
		this.parameters.partitioned = v;
	}
	
	get path(){
		return this.parameters.path;
	}
	
	set path(value){
		this.parameters.path = value;
	}

	get sameSite(){
		return this.parameters.sameSite;
	}		
	
	set sameSite(sameSite){
		this.parameters.sameSite = sameSite;
	}	
	
	get secure(){
		return this.parameters.secure;
	}
	
	set secure(value){
		this.parameters.secure = value;
	}
	
	get cookie () {
		return this.__formatter.cookie(this.__pVals)
	}

	set cookie (v) {
		throw "cookie is readonly"
	}

	get parameters(): SuperCookieDefaults<V> & {(): SuperCookieDefaults} {
		return new Proxy(() => this.__pVals, {
			apply: (t, thisArg, args) => {
				return this.__pVals
			},
			get: (t, p, r) => {
				return this.__pVals[p as keyof typeof this.__pVals]
			},
			set: (t: SuperCookieDefaults<V>, p: keyof SuperCookieDefaults<V>, v, r) => {
				const val = (SuperCookie.__formatter.superCookie[p as keyof typeof SuperCookie.__formatter.superCookie] as (v: any, preserveFalsyExpirations?: boolean) => SuperCookieDefaults<V>[keyof SuperCookieDefaults])(v, this.preserveFalsyExpirations)
				this.ready = false;
				switch (p){
					case 'expires':
						this.__pVals.expires = this.__formatter.superCookie.expires(val as number);
						break;
					case 'preserveFalsyExpirations':
					case 'partitioned':
					case "secure":
						this.__pVals[p] = val as boolean
						break;
					case 'name':
					case 'domain':
					case 'path':
						this.__pVals[p] = val as string
						break;
					case 'value':
						this.__pVals.value = val as V
						break
					case 'onReady':
						this.onReady = val as () => void
						break;
					case 'sameSite':
						this.sameSite = val as 'strict' | 'lax' | 'none'
						break;
					default:
						console.error(`Invalid parameter ${p} submitted to SuperCookie.parameters`)
				}
				this.get().then(curr => {
					if (!this.equals(curr)){
						this.set().then(() => {
							this.ready = true;
							this.onReady?.()
						})
					}
				})
				return true;
			}
		})
	}

	set parameters(parameters: Omit<SuperCookieSetOptions<V>, 'name'> & {name: string | number}){
		this.__pVals = this.__formatter.superCookie(parameters) as SuperCookieDefaults<V>
		if (this.ready){
			this.ready = false;
			this.get().then((cookie) => {
				if (!this.equals(cookie)){
					this.set().then(() => {
						this.ready = true;
						this.onReady?.()
					})
				}
			})
		}
	}
	
	ready: boolean = false;
	
	preserveFalsyExpirations: boolean;

// #endregion

// #region private methods

	private get __theThenValue() {
		if (this.__thenHolder === null){
			throw "then has already been retrieved. SuperCookie.then should never be retrieved outside of internal processes."
		}	
		return this.__thenHolder;
	}	
	
	private __thenHolder: (cookie: SuperCookie) => void;
	
// #endregion
	

//#region throws or private actions or variables

	set then (v: (func: (thisArg: SuperCookie) => void) => void) {
		throw "then is read only"
	}

	private get __listeners() {
		return SuperCookie.__listeners
	}

	private __formatter: Formatter<V> = {
		superCookie: new Proxy((() => {}) as unknown as Formatter["superCookie"], {
			apply: (t, thisArg, [v, options]: [SuperCookieSetOptions, {preserveFalsyExpirations: boolean}] | [SuperCookieSetOptions]) => {
				const {preserveFalsyExpirations = this.preserveFalsyExpirations} = options || {}
				return SuperCookie.__formatter.superCookie(v, {preserveFalsyExpirations})
			},
			get: (t, p, r) => {
				return SuperCookie.__formatter.superCookie[p as keyof typeof SuperCookie.__formatter.superCookie]
			}
		}),
		cookie: new Proxy((() => {}) as unknown as Formatter["cookie"], {
			apply: (t, thisArg, [v, options]: [SuperCookieSetOptions, {preserveFalsyExpirations: boolean}] | [SuperCookieSetOptions]) => {
				const {preserveFalsyExpirations = this.preserveFalsyExpirations} = options || {}
				return SuperCookie.__formatter.cookie(v, {preserveFalsyExpirations})
			},
			get: (t, p, r) => {
				return SuperCookie.__formatter.cookie[p as keyof typeof SuperCookie.__formatter.cookie]
			}
		})
	}

	private set __theThenValue (func: (cookie: SuperCookie) => void) {
		if (this.__thenHolder === null){
			throw "Then has already been returned. Cannot set the then function now."
		}
		this.__thenHolder = func
	}
	// #endregion

	// #region methods

	addEventListener(listener: (event: TargetedSuperCookieEvent) => void){
		const l = (evt: CookieEvent) => {
			const changed = evt.changed.map(v => SuperCookie.__formatter.superCookie(v))
			const change = changed.find(v => SuperCookie.equals({name: this.name, path: this.path}, {name: v.name, path: v.path}))
			if (!change){
				return;
			}
			const e: TargetedSuperCookieEvent = new Proxy (evt as unknown as TargetedSuperCookieEvent, {
				get: (t, path, r) => {
					const p: keyof typeof t | 'change' = path as keyof typeof t | 'change';
					switch (p){
						case 'change':
							return change
						case 'changed':
							return changed;
						default:
							return typeof t[p] === 'function' ? t[p].bind(t) : t[p]
					}
				}
			})
			listener(e)
		}
		this.__listeners.set(listener, l as unknown as (evt: CookieEvent) => void)
		SuperCookie.__cookieStore?.addEventListener('change', l)
	}

	asObject = (): SuperCookieDefaults => ({
		name: this.name,
		value: this.value as any,
		...(this.domain !== undefined ? {domain: this.domain}: {}),
		...(this.expires !== undefined ? {expires: this.expires as Date | false}: {}),
		...(this.path !== undefined ? {path: this.path}: {}),
		...(this.sameSite !== undefined ? {sameSite: this.sameSite}: {}),
		...(this.secure !== undefined ? {secure: this.secure}: {}),
	})
	
	copy = (name: string) => {
		return new SuperCookie(this.parameters)
	}

	delete = () => {
		return SuperCookie.delete(this.name, {path: this.path, domain: this.domain})
	}

	deleteSync = () => this.setSync({expires: null})

	equals = (cookie: CookieStoreGetReturn | SuperCookieSetOptions) =>  SuperCookie.equals(this, cookie)

	get = (): Promise<SuperCookieDefaults<V>> => this.ready ? SuperCookie.get(this.name, {preserveFalsyExpirations: this.preserveFalsyExpirations}) : new Promise<SuperCookieDefaults<V>>((res) => {res(this.getSync() as SuperCookieDefaults)})

	getSync = (): {name: string, value: string} => SuperCookie.getSync(this.name)

	onReady: () => void;
	
	removeEventListener(listener: (event: SuperCookieEvent) => void){
		const val = this.__listeners.get(listener)
		this.__listeners.delete(listener)
		SuperCookie.__cookieStore?.removeEventListener('change', val)
	}

	set <SV = V> (parameters?: Omit<SuperCookieCore<V><V>, 'name'>): Promise<void>
	/** when using this style and not including parameters as the second argument, the value MUST NOT be an object with a key called "value", or this will break. */
	set <SV = V>(value?: SuperCookieSetOptions["value"], parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>): Promise<void>
	set <SV = V>(
		valueOrParameters?: SV | Partial<Omit<SuperCookieCore<V><SV>, 'name'>>,
		parameters?: Partial<Omit<SuperCookieCore<V>, 'name' | 'value'>>
	){
		this.ready = false;
		if (!valueOrParameters){
			valueOrParameters = this.__prune('name') as SV
		}
		else if (!parameters){
			parameters = typeof valueOrParameters === 'object' && Object.keys(valueOrParameters).every(v => SCOptions.includes(v)) ? undefined : this.__prune('name', 'value')
		}
		let {name, value = this.value, ...params} = SuperCookie.__sortFromArgs<SV>(this.parameters.name, valueOrParameters, parameters)
		return new Promise((res, rej) => {
			SuperCookie.set(name, value, params).then(v => {
				this.ready = true;
				this.onReady?.()
				this.get().then(v => {
					if (!v){
						console.log('This cookie has been deleted.')
						this.__pVals = {name: this.name} as SuperCookieDefaults;
					}
					else {
						this.__pVals = {...v, ...(this.onReady ? {onReady: this.onReady}: {}), ...(this.preserveFalsyExpirations ? {preserveFalsyExpirations: this.preserveFalsyExpirations}: {})};
					}
					res(true)
				})
			})
		})
	}

	setSync <SV = V>(parameters?: Omit<SuperCookieCore<V><SV>, 'name'>): void;
	setSync <SV = V>(value: any, parameters?: Omit<SuperCookieCore<V><SV>, 'name' | 'value'>): void 
	setSync <SV = V>(valueOrParameters?: any | Omit<SuperCookieCore<V><SV>, 'name'>, parameters?: Omit<SuperCookieCore<V><SV>, 'name' | 'value'>) {
		SuperCookie.setSync(this.name as string, valueOrParameters, parameters)
	}
	
	get then(){
		if (this.ready){
			throw "SuperCookie.prototype.then can only be utilized before the SuperCookie is in ready state."
		}
		else {
			return (func: (thisArg: SuperCookie) => void) => {
				this.__theThenValue = () => {
					func(this)
				}
			}
		}
	}

	//todo: #3 this is borked right now. Fix it before release.
	toString = () => {
		const params: string[] = [`${this.name}=${this.value}`, this.expires && `expires=${this.expires}`, this.path && `path=${this.path}`, this.domain && `domain=${this.domain}`]
		if (this.secure){
			params.unshift('__Secure-')
		}
		if (this.sameSite !== undefined){
			params.push(`SameSite=${this.sameSite}`)
		}
		return params.filter((a) => a).join('; ')
	}
	// #endregion

	//#region Statics
	static addEventListener <V = any>(listener: (evt: SuperCookieEvent<V>) => void){
		const val = (evt: CookieEvent) => {
			listener(new Proxy(evt as unknown as SuperCookieEvent, {
				get: (t, key, r) => {
					if (key === 'changed'){
						return evt.changed.map(v =>  this.__formatter.superCookie(v))
					}
					else {
						return typeof evt[key as keyof typeof evt] === 'function' ? (evt[key as keyof typeof evt] as () => {}).bind(evt) : evt[key as keyof typeof evt]
					}
				}
			}))
		}
		this.__listeners.set(listener, val)
		SuperCookie.__cookieStore?.addEventListener('change', val as unknown as (evt: CookieEvent) => void)
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
	
    static delete(name: string, pathAndDomain: {path?: string, domain?: string}): void;
	static delete(name: string, path?: string): void
	static delete(name: string, pathOrPathAndDomain?: string | {path?: string, domain?: string}) {
			const {path, domain}: {path?: string, domain?: string} = pathOrPathAndDomain 
				? typeof pathOrPathAndDomain === 'string'
					? {path: pathOrPathAndDomain}
					: pathOrPathAndDomain
				: {}
			const options: {name: string, path?: string, domain?: string} = {
				name,
				...(path === undefined ? {} : {path}),
				...(domain === undefined ? {} : {domain}),
			}
			this.__cookieStore.delete(options)
    }

    static get (name: string, options?: {preserveFalsyExpirations?: boolean}) {
		return new Promise<SuperCookieDefaults>(res => {
			this.getAll(options).then(cookies => {
				res(cookies.find(v => v.name === name) || {name, value: null})
			})
		})
	}

	//** Retrieves all cookie elements for this document's cookies as an object of SuperCookies indexed by name. */
	static getAll(options: {preserveFalsyExpirations?: boolean}): Promise<SuperCookieDefaults[]> { return new Promise((res, rej) => {
		SuperCookie.__cookieStore.getAll().then((cookies: CookieListItem[]) => {
			const processed = cookies.map((cookie) =>  {
				for (const i in cookie){
					if (cookie[i as keyof typeof cookie] === null){
						delete cookie[i as keyof typeof cookie]
					}
				}
				return this.__formatter.superCookie(cookie, options) as SuperCookieDefaults
			})
			res(processed)
    	}).catch((err: Error) => {
			rej({message : err?.message || err})
		})
	})}

	static getSync = (cookieName: string, options?: {preserveFalsyExpirations?: boolean}): {name: string, value: string} => {
		const {name, value} = this.getAllSync(options).find(v => v.name === cookieName) ?? {name: cookieName, value: null}
		return {name, value}
	}

	static getAllSync = (options?: {preserveFalsyExpirations?: boolean}) => {
		return this.__dCookie?.split(';')?.map((v) => {
			const [tname, tvalue] = v.trim().split('=')
			const {name, value} = this.__formatter.superCookie({name: tname, value: tvalue}, options) as SuperCookieDefaults;
			return {name, value}
		}) || []
	}

	
	static equals = (cookie1: SuperCookie | SuperCookieSetOptions | CookieStoreGetReturn, cookie2: SuperCookie | SuperCookieSetOptions | CookieStoreGetReturn): boolean => {
		cookie1 = cookie1 instanceof SuperCookie ? cookie1.asObject() : SuperCookie.__formatter.superCookie(cookie1)
		cookie2 = cookie2 instanceof SuperCookie ? cookie2.asObject() : SuperCookie.__formatter.superCookie(cookie2)
		return this.__compareObject(cookie1, cookie2)
	}
	
	static removeEventListener(listener: (changes: CookieEvent) => void){
		return SuperCookie.__cookieStore.removeEventListener('change', listener as unknown as (evt: CookieEvent) => void)
	}
	
	static set <V = any> (parameters: SuperCookieSetOptions<V> & {name: string | number}): Promise<void>
	static set <V = any>(name: SuperCookieSetOptions['name'], parameters?: Omit<SuperCookieSetOptions<V>, 'name'>): Promise<void>
	/** when using this style and not including parameters as the third argument, the value MUST NOT be an object with a key called "value", or this will break. */
	static set <V = any>(name: SuperCookieSetOptions['name'], value: V, parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>): Promise<void>
	static set <V = any>(
		nameOrParameters: string | number | SuperCookieSetOptions<V> & {name: string | number},
		valueOrParameters?: V | Partial<Omit<SuperCookieSetOptions<V>, 'name'>>,
		parameters?: Partial<Omit<SuperCookieSetOptions, 'name' | 'value'>>
	){
		const {name, value, ...params} = this.__sortFromArgs<V>(nameOrParameters, valueOrParameters, parameters);
		const cookieStyle: CookieStoreSetOptions = SuperCookie.__formatter.cookie({name, value, ...params}) as CookieStoreSetOptions
		const size=new Blob([`${cookieStyle.name}=${cookieStyle.value}`]).size
		if (size >= 4096){
			throw "Your cookie is too large! Setting it would result in serious problems!"
		}
		if (size > 3800){
			console.warn(`Your cookie is ${size} bytes, which is approaching the maximum of 4096 bytes. Consider refactoring this cookie.`)
		}
		return SuperCookie.__cookieStore.set(cookieStyle as CookieInit)
	}

	static setSync <SV = any>(params?: SuperCookieCore<V><SV>): void;
	static setSync <SV = any>(name: string, params?: Omit<SuperCookieCore<V><SV>, 'name'>): void;
	static setSync <SV = any>(name: string, value: SV, params?: Omit<SuperCookieCore<V><SV>, 'name' | 'value'>): void 
	static setSync <SV = any>(nameOrParameters: string | SuperCookieCore<V><SV>, valueOrParameters?: SV | Omit<SuperCookieCore<V><SV>, 'name'>, parameters?: Omit<SuperCookieCore<V><SV>, 'name' | 'value'>) {
		const {name, value, ...params} = this.__formatter.cookie(this.__sortFromArgs<SV>(nameOrParameters, valueOrParameters, parameters))
		if (name && value){
			// #region setting Cookie
			// This is necessary because the cookieStore API set funcname: string, value: SuperCookieCore<V><SV>['value']} & SuperCookieCore<V><SV>tionality operates exclusively as a promise, and we require a synchronous operation.
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
	
	private static get __cookieStore() {return (typeof window === 'undefined' ? null : window.cookieStore || null)
		|| {
			get: (value) => 
		}
	} 

	private csFallback = {
		
	}
	
	private static get __dCookie() { return typeof window === 'undefined' ? null : window.document.cookie}
	
	private __prune = <K extends (keyof SuperCookieDefaults<V>)[]>(...args: K): Omit<SuperCookieDefaults<V>, K[number]> => {
		let superCookie: Omit<SuperCookieDefaults<V>, K[number]>  = this.asObject()
		for (const key of args){
			delete superCookie[key as keyof typeof superCookie]
		}
		return superCookie
	}
	
	private static __compareObject = (obj: {[key: string]: any}, obj2: {[key: string]: any}) => {
		for (const i of Object.keys({...obj, ...obj2})){
			const val1 = obj[i as keyof typeof obj]
			const val2 = obj2[i as keyof typeof obj2]
			if ([null, undefined].includes(val1) && [null, undefined].includes(val2) ){
				continue;
			}
			else if (typeof val1 !== typeof val2 || (val1 && typeof val1 === 'object' ? !this.__compareObject(val1, val2) : val1 !== val2 )){
				return false;
			}
		}
		return true;
	}
	
	// #region to Cookie value
	private static __cookievalueConvert = (value: any, topLevel?: boolean): string | {[key: string]: any} | string[] => {
		if (value === undefined){
			return 'undefined:undefined'
		}
		if (value === null){
			return 'null:null'
		}
		switch (value.constructor.name) {
			case 'Date':
				return `${value.constructor.name}:${value}`;
				case 'Symbol':
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
		
		// #region formatter
		private static __formatter: Formatter= new Proxy<Formatter>({} as Formatter, {
			get: <K extends 'superCookie' | 'cookie'>(_t: Formatter, p: K, _r: Formatter) => {
				if (!['superCookie', 'cookie'].includes(p)){
					throw new TypeError('Invalid Formatter option attempted')
				}
				return new Proxy<Formatter[K]>((() => {}) as unknown as Formatter[K], {
					apply: (t, thisArg, [params, options]: Parameters<(K extends "superCookie" ? Formatter["superCookie"]["apply"] : Formatter["cookie"]["apply"])>) => {
						let retVal: any = {}
						for (const i in params){
							if (i === 'expires' || ![undefined, null].includes(params[i])){
								retVal[i] = thisArg[p][i](params[i])
						}
					}
					return retVal
				},
				get: <P extends keyof (Formatter["cookie"] & Formatter["superCookie"])>(obj: Formatter[K], key: P, ref: Formatter[K])=> {
					return (v: any, options?: {preserveFalsyExpirations?: boolean}) => {
						if (v?.preserveFalsyExpirations){
							var preserveFalsyExpirations: boolean = v?.preserveFalsyExpirations
							delete v.preserveFalsyExpirations
						}
						else {
							var preserveFalsyExpirations = options?.preserveFalsyExpirations || false
						}
						switch(key){
							case 'expires':
								if (p === 'cookie'){
									if (v !== undefined){
										v = (v instanceof Date ? v : new Date(
											v === false ? new Date().getTime() + 34560000000
											: v === null ? 0 
											: v))
											return v.getTime()
									}
								}
								else {
									v = v instanceof Date 
										? v 
										: [undefined, false, null].includes(v)
											? v  
											: new Date(v)
									if (v instanceof Date && v.getTime() > new Date().getTime() + 25920000000 && !preserveFalsyExpirations){
										return false
									}
									return v;
								}
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
	
	private static __getAllSimpleSync = <V = any>() => {
		return this.__dCookie?.split(';')?.reduce((full, v) => {
			const [name, value] = v.trim().split('=') as [SuperCookieDefaults["name"], SuperCookieDefaults["value"]]
			full[name] = {name, value};
			return full;
		}, {} as {[key: string]: SuperCookieDefaults<V>}) || {}
	}
	
	private static __sortFromArgs = <V extends any>(
		nameOrParameters?: string | number | (Omit<SuperCookieCore<V>, 'name'> & {name: string | number}),
		valueOrParameters?: Partial<Omit<SuperCookieCore<V>, 'name'>> | any,
		params?: Partial<Omit<SuperCookieCore<V>, 'name' | 'value'>>
	): Partial<Omit<SuperCookieDefaults<V>, "name" | 'value'>> & {name: string, value: V} => {
		if (!nameOrParameters){
			return null
		}
		const name: string = !(typeof nameOrParameters === 'object') ? String(nameOrParameters) : String(nameOrParameters.name)
		const value: SuperCookieCore<V><V>["value"] = params
		? valueOrParameters
		: typeof valueOrParameters === 'object'
			? Object.keys(valueOrParameters).every(v => SCOptions.includes(v)) ? valueOrParameters.value : valueOrParameters
			: valueOrParameters
		const parameters: SuperCookieCore<V> = params ? params : typeof nameOrParameters === 'object' ? nameOrParameters : (valueOrParameters as Omit<SuperCookieCore<V><V>, 'name'>)?.value && valueOrParameters
		return {name, value, ...parameters} as Partial<Omit<SuperCookieDefaults<V>, "name" | 'value'>> & {name: string, value: V}
	}

	// #region to SuperCookie value
	private static __superCookieValueConvert = (value: any, topLevel?: boolean): any => {
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
		const [identifier, ...decodedVal]: string[]=value?.split(':')
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

}