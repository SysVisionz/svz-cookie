import SuperCookie from ".";

export interface CookieStoreCookie {
    "domain": string | null,
    "expires": number | null,
    "name": string,
    "partitioned": boolean,
    "path": string,
    "sameSite": "strict" | "lax" | "none",
    "value": string
}

export interface SuperCookieCore<V extends any = any> {
    domain?: string;
    /** Use Date for an actual date, undefined for session cookies. */
    expires?: Date;
    partitioned?: boolean
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    /** this can be used to set the time out from now in ms. It also is the current time to expiration when in a get request. */
    timeToExpiration?: number;
    value?: V
}

function doConversionTo<V extends string | number | boolean>(val: V): V
function doConversionTo(val: Date): `Date:${string}`
function doConversionTo(val: null): `null:null`
function doConversionTo(val: bigint): `BigInt:${string}`
function doConversionTo(val: symbol): `Symbol:${string}`
function doConversionTo(val: any): string
function doConversionTo(val: any){
    if (val === null){
            return 'null:null';
        }
        if (val instanceof Date){
            return `Date:${val.toISOString()}`
        }
        switch(typeof val){
            case 'object':
                switch(val.constructor.name){
                    case 'Symbol':
                        return `Symbol:${String(val).substring(7,String(val).length-1)}`
                    default:
                        return JSON.stringify(doConversion.to(val))
                }
            case 'bigint':
                return `BigInt:${String(val)}`
            case 'string':
            case 'number':
            case 'boolean':
                return val as string | number | boolean
            default:
                try {
                    return val?.toString()
                } catch(err) {
                    throw `invalid type submitted to key: ${val?.prototype?.name}`
                }
        }
} 

const doConversion = {
    to:  doConversionTo,
    from: (val: {[key: string]: any | any[]}): SuperCookieCore["value"] => {
        for (const i in val){
            if (typeof val[i] === 'string'){
                const [key, valueof] = val[i].split(':')
                switch(key){
                    case 'BigInt':
                        val[i] = BigInt(valueof)
                        break;
                    case 'Symbol':
                        val[i] = Symbol(valueof)
                        break;
                    case 'Date': 
                        val[i] = new Date(valueof)
                    case 'null':
                        val[i] = null;
                    case 'boolean':
                        val[i] = /true$/.test(val[i])
                    
                }
            }
            else if (val[i] && typeof val[i] === "object"){
                val[i] = doConversion.from(val[i])
            }
        }
        return {value: val};
    }
}

const decodeValue = (value: string) => {
    value = decodeURIComponent(value)
    return doConversion.from(/^JSON:/.test(value) ? JSON.parse(value.substring(5)) : value)
}

const cookieObject = {
    from: (value: string | CookieStoreCookie[] | null): {[key: string]: SuperCookieCore} => {
        if (typeof value ==='string'){
            return value.split(';').map(v => v.split('=')).reduce((cookies: {[key: string]: SuperCookieCore}, [key, value]) => {
                cookies[key] = decodeValue(value)
                return cookies
            }, {}) 
        }
        else {
            return value.reduce((cookies: {[key: string]: SuperCookieCore}, {domain, expires, name, partitioned, path, sameSite, value}) => {
                cookies[name] = {
                    value: decodeValue(value),
                    ...(domain === null ? {} : {domain}),
                    ...(expires === null ? {} : {expires: new Date(expires), timeToExpiration: expires - Date.now()}),
                    ...(partitioned === null ? {} : {partitioned}),
                    ...(path === null ? {} : {path}),
                    ...(sameSite === null ? {} : {sameSite}),
                }
                return cookies
            }, {})
        }
    },
    to: (name: string, {value, domain, path, partitioned, sameSite, timeToExpiration, expires = new Date(timeToExpiration + Date.now())}: SuperCookieCore): CookieStoreCookie => {
        const cookie: CookieStoreCookie = {
            name,
            value: encodeURIComponent(value && typeof value === 'object' ? `JSON:${JSON.stringify(doConversion.to(value))}` : doConversion.to(value)),
            domain: domain || null,
            path: path || null,
            partitioned: partitioned || null,
            sameSite: sameSite || null,
            expires: null
        }
        const expiration = (timeToExpiration ? Date.now() + timeToExpiration : expires?.getTime())
        if (expiration){
            cookie.expires = expiration
        }
        return cookie;
        
    }
}

function setSync (name: string, value: any): void
function setSync (name: string, options: Omit<SuperCookieCore, 'name'>): void
function setSync (name: string, value: any, options: Omit<SuperCookieCore, 'name' | 'value' >): void
function setSync (options: SuperCookieCore): void
function setSync (nameOrOptions: string | SuperCookieCore, valueOrOptions?: any, options?: Omit<SuperCookieCore, 'value' | 'name'>) {
    const isCookieObject = (type: 'name'|'value', val: any) => {
        if (typeof val !== 'object' || Array.isArray(val)) {
            return false;
        }
        if (type === 'name') {
            return true;
        }
        const keys = Object.keys(value)
        return keys.every(v => ['domain', 'partitioned', 'path', 'sameSite', 'value'].includes(v))
    }
    const {name, value}: SuperCookieCore & {name: string} = {
        ...options,
        name: (isCookieObject('name', nameOrOptions) ? (nameOrOptions as {name: string}).name : nameOrOptions) as string,
        value: isCookieObject('value', valueOrOptions) ? valueOrOptions.value : valueOrOptions as string,
    }
    if (typeof window !== 'undefined') {
        document.cookie = `${name}=${encodeURIComponent(doConversion.to(value))}${Object.keys(options).length ? '' : `; ${Object.entries(options).reduce((strings: string[], [key, value]) => {
            const v = value instanceof Date ? value.toISOString() : value as string | number | boolean
            strings.push(`${key}=${v}`)
            return strings
        }, [] as string[]).join('; ')}`}`
    }
}

function set (name: string, value: any): Promise<boolean>
function set (name: string, options: Omit<SuperCookieCore, 'name'>): Promise<boolean>
function set (name: string, value: any, options: Omit<SuperCookieCore, 'name' | 'value' >): Promise<boolean>
function set (options: SuperCookieCore): Promise<boolean>
function set (nameOrOptions: string | SuperCookieCore, valueOrOptions?: any, options?: Omit<SuperCookieCore, 'value' | 'name'>) {
    return new Promise((res,rej) => {
        const isCookieObject = (type: 'name'|'value', val: any) => {
            if (typeof val !== 'object' || Array.isArray(val)) {
                return false;
            }
            if (type === 'name') {
                return true;
            }
            const keys = Object.keys(value)
            return keys.every(v => ['domain', 'partitioned', 'path', 'sameSite', 'value'].includes(v))
        }
        const {name, value, ...opts}: SuperCookieCore & {name: string} = {
            ...options,
            name: (isCookieObject('name', nameOrOptions) ? (nameOrOptions as {name: string}).name : nameOrOptions) as string,
            value: isCookieObject('value', valueOrOptions) ? valueOrOptions.value : valueOrOptions as string,
        }
        const expires = (opts.expires ? opts.expires
        : opts.timeToExpiration ? new Date(Date.now() + opts.timeToExpiration)
        : undefined)?.getTime()
        const {domain, partitioned, path, sameSite} = opts
        const cookieObj = {
            name,
            value,
            ...(expires ? {expires} : {}),
            ...(domain ? {domain} : {}),
            ...(partitioned ? {partitioned}: {}),
            ...(path ? {path}: {}),
            ...(sameSite ? {sameSite} : {})
        }
        if (SuperCookieStore.cStore?.set){
            SuperCookieStore.cStore.set(cookieObj).then(async () => {
                return !!(await SuperCookieStore.get(cookieObj))
            })
        } else {
            SuperCookieStore.setSync(name, value, opts)
            res(true)
        }
    })
}


const SuperCookieStore = {
    cStore: cookieStore,
    getSync: function (name: string): SuperCookieCore {
        return SuperCookieStore.getAllSync()[name] || {};
    },
    get: async (...args: Parameters<CookieStore["get"]>) => {
        if (SuperCookieStore.cStore?.get){
            const full = await SuperCookieStore.cStore.get(...args).then((v) => cookieObject.from(Array.isArray(v) ? v as CookieStoreCookie[] : [v] as CookieStoreCookie[]))
            if(typeof args[0] === 'string' || args[0]?.name){
                return full[0] || {}
            }
            if (args[0]?.url){
                return full
            }
            throw "get requires a name string or {name: string, url: string} argument to function."
        }
        return SuperCookieStore.getSync(args[0] as string)
    },
    getAllSync:() => cookieObject.from(window.document.cookie),
    getAll: async( ) => {
        if (SuperCookieStore.cStore.getAll){
            return SuperCookieStore.cStore.getAll().then((v) => cookieObject.from(v as CookieStoreCookie[]))
        }
        return SuperCookieStore.getAllSync()
    },
    setSync,
    deleteSync: (nameOrParameters: string | {name: string, path?: string, domain?: string}) => {
            const params = (typeof nameOrParameters === 'string' ? {name: nameOrParameters} : nameOrParameters) as {name: string, path?: string, domain?: string}
            window.document.cookie=`${params.name}='';${params.path ? `path=${params.path};` : ''}${params.domain ? `domain=${params.domain};` : ''}Max-Age:-9999`
        },
    delete: async (...args: Parameters<CookieStore["delete"]>) => {
        if (SuperCookieStore.cStore.delete){
            await SuperCookieStore.cStore.delete(...args)
            return !await SuperCookieStore.get(...args)
        }
        SuperCookieStore.deleteSync(...args)
        return null;
    }
}

export default SuperCookieStore