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

type CookieStoreSetOptions = Partial<CookieStoreGetObject> & {
	name: string
}

type CookieStoreDeleteOptions = {
	name: string,
	domain?: string
	path?: string,
	partitioned?: boolean,
}

interface CookieStoreGetObject {
	name: string,
	domain: string | null, expires: number | null, partitioned: boolean,
	path: string, sameSite: 'strict' | 'lax' | 'none', secure: boolean, value: string | null
}

declare type CookieStore = {
	getAll: (options?: CookieStoreGetOptions) => Promise<CookieStoreGetObject[]>,
	addEventListener: (type: 'change', listener: (event: CookieEvent) => void) => void,
	removeEventListener: (type: 'change', listener: (event: CookieEvent) => void) => void,
	onchange: (listener: (event: CookieEvent) => void) => void,
	get: (nameOrOptions?: string | {name?: string, url?: `http${'s' | ''}://${string}` }) => Promise<CookieStoreGetObject>,
	set: (options: CookieStoreSetOptions) => Promise<undefined>,
	delete: (options: CookieStoreDeleteOptions) => Promise<undefined>
}

declare namespace globalThis {
	var cookieStore: CookieStore | undefined;
}