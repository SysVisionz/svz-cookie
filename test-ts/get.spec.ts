import puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";
import type SuperCookie from '../dist'

declare global {
  interface Window {
	SuperCookie: typeof SuperCookie;
  }
}

class Utils 
{
	id: string
	browser: Browser
	page: Page
	thenHolder: ((utils: Utils) => void) | null = null
	ready: boolean;
	cookie: SuperCookie
	window: Window 
	SuperCookie: SuperCookie
	constructor(id: string){
    console.log('constructing')
		new Promise<{page: Page, browser: Browser}>(async (res, rej) => {
			const browser = await puppeteer.launch()
			const page = await browser.newPage();
			await page.goto("http://localhost:3000")
      console.log('what')
			res({page, browser})
		}).then(({page, browser}) => {
			this.page.evaluate(() => {
				this.window = window as Window
				this.page = page;
				this.browser = browser;
				this.thenValue?.(this)
				this.ready = true;
        console.log('this')
        console.log(this)
			})
		})
		this.id = `#${id}`
	};
	then = (func: (utils: Utils) => void) => {
		this.thenValue = func;
	}
	
	set thenValue (v: (utils: Utils) => void){
		this.thenHolder = v;
	}

	get thenValue (): null | ((utils: Utils) => void) {
		if (this.ready){
			throw "then will only run once, before ready state is complete.";
		}
		else {
			const holder = this.thenHolder
			this.thenHolder = null;
			return holder;
		}
	}

	get elem(){
		return this.page.locator(`#${this.id}`)
	}
	setText = async (v: string) => {
		return await this.elem.fill(v)
	}

	getText = async () => {
		const t = await this.elem.waitHandle()
		return await t?.evaluate(el => el.textContent)
	}
}

interface TestVal {
  (script: `${string | "\n"}SuperCookie${string | "\n"}return ${string}${string | "\n"}`): Promise<string | { [key: string]: any }>;
  (script: `new Promise((res, rej) => {${string | "\n"}SuperCookie${string | "\n"}res(${string})${string | "\n"}`): Promise<string | { [key: string]: any }>;
}

console.log('started')
it("should set cookies, then retrieve them as expected.", () => new Promise((res, rej) => {
  const boop = new Utils('loaded').then((util) => {
    console.log('loaded')
    console.log(util.SuperCookie.getSync())
    util.browser.close()
    res(true)
  })
}))