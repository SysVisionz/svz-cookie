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
	expires?: number,
	name: string,
	path?: string,
	sameSite?: 'strict' | 'lax' | 'none',
	secure?: boolean,
	value: string
}

type CookieStoreDeleteOptions = {
	name: string,
	domain?: string
	path?: string,
	partitioned?: boolean,
}

interface CookieEvent extends Omit<Event, 'target'> {
	changed: ChangeObject[]
}

declare type CookieStore = {
	getAll: (options?: CookieStoreGetOptions) => Promise<[]>,
	addEventListener: (type: 'change', listener: (event: CookieEvent) => void) => void,
	removeEventListener: (type: 'change', listener: (event: CookieEvent) => void) => void,
	get: (nameOrOptions?: string | {name?: string, url?: `http${'s' | ''}://${string}` }) => Promise<CookieStoreGetOptions>,
	set: (options: CookieStoreSetOptions) => Promise<undefined>,
	delete: (options: CookieStoreDeleteOptions) => Promise<undefined>
}

declare namespace globalThis {
	var cookieStore: CookieStore | undefined;
}