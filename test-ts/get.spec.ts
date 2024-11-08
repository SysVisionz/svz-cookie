import { Builder, By, WebDriver } from "selenium-webdriver";
import { expect } from "chai";
import os from "os"
// import Utils from "./utils"

interface TestVal {
  (script: `() => {${string | "\n"}new SuperCookie${string | "\n"}return ${string}${string | "\n"}}`): Promise<string | {[key: string]: any}>;
  (script: `() => new Promise((res, rej) => {${string | "\n"}new SuperCookie${string | "\n"}res(${string})${string | "\n"}})`): Promise<string | {[key: string]: any}>;
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
		  setTest = (val) => {
        try {
          val = JSON.stringify(val);
        } catch{
          val = val;
        }
        document.getElementById('loaded').innerText = val;
      }`)
      testVal = (script: string) => new Promise<string | {[key: string]: any}>(async (res, rej) => {
          await driver.executeScript(`
          const script = ${script}
          if (script.toString().includes("new Promise")){
            script().then(v => {
              setTest(v)
            })
          } 
          else {
            setTest(script())
          }`)
          return await setTimeout( async () => {
            res(await driver.findElement(By.id("loaded")).getText())
          }, 300)
      })
    })

    after(async function () {
      if (driver){
        await driver.quit()
      }
    });

    it("should input values in a form and check their sum", async function () {
      console.log(await testVal(`() => new Promise((res, rej) => {
        bonk = new SuperCookie('hi', 'clarice')
        bonk.get().then(got => res(got))
      })`))
  })
})