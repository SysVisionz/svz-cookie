import { Builder, By, WebDriver } from "selenium-webdriver";
import { assert, expect } from "chai";
import { describe } from "mocha";
import SuperCookie from "../dist/index.js";
import { Options } from "selenium-webdriver/chrome.js";
import os from "os"

  describe("Basic test of cookie retrieval functionality", function () {
    this.timeout(30000)
    let driver: WebDriver
    before(async function () {
      const chromeOptions = new Options();
      chromeOptions.setChromeBinaryPath(`${os.homedir()}/chrome-linux64/chrome`); // Set the path to the Chrome binary
      chromeOptions.addArguments('--headless'); // Run Chrome in headless mode
      chromeOptions.addArguments('--no-sandbox'); // Bypass OS security model
      chromeOptions.addArguments('--disable-dev-shm-usage'); // Overcome limited resource problems
      console.log('building driver')
      driver = await new Builder().forBrowser("chrome").setChromeOptions(chromeOptions).build();
      console.log('driver built')
    })
    after(async function () {
      if (driver){
        await driver.quit()
      }
    })
    it("should input values in a form and check their sum", async function (done) {
      // Navigate to a form page
      await driver.get(
        "http://localhost:3000"
      );
      console.log('site opened')
      console.log('driver up')
      await driver.findElement(By.id("loaded"))
      console.log('found loaded')
      // Wait for navigation and check if login was successful
      new SuperCookie('hello', 'world').then((tA) => {
        console.log(tA.asObject())
        expect(tA.asObject()).to.exist
        done()
      });
    })
  });