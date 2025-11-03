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

export interface SuperCookieCore {
    domain?: string;
    /** Use Date for an actual date, undefined for session cookies. */
    expires?: Date;
    partitioned?: boolean
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    /** this can be used to set the time out from now in ms. It also is the current time to expiration when in a get request. */
    timeToExpiration?: number;
    value: any
}

const doConversion = {
    to: <V extends any>(val: V): V extends Date | number | string | bigint ? string | number | boolean : any => {
        if (val === null){
            return 'null:null';
        }
        if (val instanceof Date){
            return `Date:${(val as Date).toISOString()}`
        }
        switch(typeof val){
            case 'object':
                switch(val.constructor.name){
                    case 'Symbol':
                        return `Symbol:${String(val).substring(7,String(val).length-1)}`
                    default:
                        return doConversion.to(val)
                }
            case 'bigint':
                return `BigInt:${String(val)}`
            default:
                return val as any
        }
    },
    from: (val: {[key: string]: any | any[]}): SuperCookieCore => {
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

const boop: keyof CookieStore  = ''

interface SuperCookieStore {
    getSync: (name: string) => CookieStoreCookie
    get: (...args: Parameters<CookieStore["get"]>) => Promise<SuperCookieCore | {[name: string]: SuperCookieCore}>
    getAll: () => Promise<{[name: string]: CookieStoreCookie}>
    getAllSync: () => {[name: string]: CookieStoreCookie}
    delete: (...args: Parameters<CookieStore["delete"]>) => Promise<boolean | null>
    deleteSync: (nameOrParameters: string | {name: string, domain: string, path: string}) => void
    addEventListener<K extends keyof CookieStoreEventMap>(type: K, listener: (this: CookieStore, ev: CookieStoreEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof CookieStoreEventMap>(type: K, listener: (this: CookieStore, ev: CookieStoreEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export default new Proxy<SuperCookieStore>((typeof window === 'undefined' ? {} : cookieStore || {}) as SuperCookieStore, {
    get: (t, p, r) => {
        const cStore = t as unknown as CookieStore;
        switch (p){
            case 'getSync':
                return (...args: [string] | [{name: string}]) => {
                    if (typeof args[0] === 'object'){
                        if (!args[0].name){
                            return null
                        }
                        return {[args[0].name]: r.getAllSync()[args[0].name] || {}}
                    }
                    else {
                        return {[args[0]]: r.getAllSync()[args[0]] || {}};
                    }
                }
            case 'get':
                return async (...args: Parameters<CookieStore["get"]>) => {
                if (t.get){
                    const full = await cStore.get(...args).then((v) => cookieObject.from(Array.isArray(v) ? v as CookieStoreCookie[] : [v] as CookieStoreCookie[]))
                    if(typeof args[0] === 'string' || args[0]?.name){
                        return full[0] || {}
                    }
                    if (args[0]?.url){
                        return full
                    }
                    throw "get requires a name string or {name: string, url: string} argument to function."
                }
                return r.getSync(...args)
            }
            case 'getAllSync':
                return () => cookieObject.from(window.document.cookie)
            case 'getAll':
                return async( ) => {
                    if (cStore.getAll){
                        return cStore.getAll().then((v) => cookieObject.from(v as CookieStoreCookie[]))
                    }
                    return r.getAllSync()
                }
            case 'deleteSync':
                return (nameOrParameters: string | {name: string, path?: string, domain?: string}) => {
                    const params = (typeof nameOrParameters === 'string' ? {name: nameOrParameters} : nameOrParameters) as {name: string, path?: string, domain?: string}
                    window.document.cookie=`${params.name}='';${params.path ? `path=${params.path};` : ''}${params.domain ? `domain=${params.domain};` : ''}Max-Age:-9999`
                }
            case 'delete':
                return async (...args: Parameters<CookieStore["delete"]>) => {
                    if (cStore.delete){
                        await cStore.delete(...args)
                        return !await r.get(...args)
                    }
                    r.deleteSync(...args)
                    return null;
                }
        }
    },
    set: () => {
        throw 'the cookieStore proxy is readonly'
    }
}