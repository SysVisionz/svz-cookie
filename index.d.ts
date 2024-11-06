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