import { Builder, By, WebDriver } from "selenium-webdriver";
import { expect } from "chai";
import os from "os"
// import Utils from "./utils"

interface TestVal {
  (script: `${string | "\n"}SuperCookie${string | "\n"}return ${string}${string | "\n"}`): Promise<string | { [key: string]: any }>;
  (script: `new Promise((res, rej) => {${string | "\n"}SuperCookie${string | "\n"}res(${string})${string | "\n"}`): Promise<string | { [key: string]: any }>;
}


import { Options } from "selenium-webdriver/chrome.js";
describe("Basic test of cookie retrieval functionality", function () {
  this.timeout(60000)
  let driver: WebDriver;
  let testVal: TestVal;
  before(async function () {
    const chromeOptions = new Options
    chromeOptions.setChromeBinaryPath(`${os.homedir()}/chrome-linux64/chrome`); // Set the path to the Chrome binary
    chromeOptions.addArguments('--headless'); // Run Chrome in headless mode
    chromeOptions.addArguments('--no-sandbox'); // Bypass OS security model
    chromeOptions.addArguments('--disable-dev-shm-usage'); // Overcome limited resource problems
    driver = await new Builder().forBrowser("chrome").setChromeOptions(chromeOptions).build();
    driver.get('http://localhost:3000')
    await driver.findElement(By.id("loaded"))
    await driver.executeScript(`
class Elem {
  constructor(id){
    this.id = id
  }
  get text(){ return this.t.innerText}
  set text(v){ this.t}
}
window.elem = new Elem('loaded')`)
  })

  after(async function () {
    if (driver) {
      await driver.quit()
    }
  });

  testVal = async (script: string, ...args: any[]): Promise<string | {[key: string]: any}> => {
    const isPromise = !!script.match(/^new Promise/)
    script = `const done = arguments[arguments.length-1]
    const setText = (v) => document.getElementById('loaded').innerText = ['string', 'number'].includes(typeof v) ? v : JSON.stringify(v)
    ${isPromise ? `(() => {${script}.then(v => {
      setText(v)
      done()
    })})(...arguments)` : ` setText((() => {${script}})(...arguments))`}`
    await driver.executeAsyncScript(script, args)
    return await driver.findElement(By.id("loaded")).getText()
  }

  it("should input values in a form and check their sum", async function () {
    expect( await testVal(`new SuperCookie({'hi', 'clarice'});
return 'hi'`)).to.eql('hi')
    expect (await testVal(`new Promise((res, rej) => {
      new SuperCookie({name: "hi", value: "clarice"}).then(cookie => {res(cookie.asObject())})
    })`)).to.eql('{name: "hi", value: "clarice"}');
    expect(await testVal(`new Promise((res, rej) => {
    new SuperCookie('hi', 'clarice').then(bonk => res(got.value))
})`)).to.eql('clarice')
  })
})