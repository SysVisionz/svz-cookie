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
    this.t = document.getElementById('loaded')
  }
  get text(){ return this.t.innerText}
  set text(v){ this.t.innerText = ['number', 'string'].includes(typeof v) ? v : JSON.stringify(v)}
}
window.elem = new Elem('loaded')`)
  })

  after(async function () {
    if (driver) {
      await driver.quit()
    }
  });

  testVal = async (script: string): Promise<string | {[key: string]: any}> => {
    const isPromise = !!script.match(/^new Promise/)
    script = isPromise ?`
${script}.then(v => {
  elem.text = await (async () => return {${script}})()
});`:`
elem.text = (() => {${script}})()`
    console.log(script)
    return await (isPromise ? driver.executeAsyncScript(script) : driver.executeScript(script))
  }

  it("should input values in a form and check their sum", async function () {
    expect (await testVal(`
      new SuperCookie({name: "hi", value: "clarice"})
      const check = SuperCookie.getAllSync()
      return check;
`)).to.eql('{name: "hi", value: "clarice"}');
    expect(await testVal(`new Promise((res, rej) => {
  bonk = new SuperCookie('hi', 'clarice')
  bonk.get().then(got => res(got.value))
})`)).to.eql('clarice')
  })
})