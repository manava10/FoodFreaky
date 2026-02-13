const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const headless = process.env.HEADLESS !== "0";

const options = new chrome.Options();
if (headless) {
  options.addArguments("--headless=new");
}
options.addArguments("--window-size=1280,900");

(async function smokeHomeToRestaurants() {
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(baseUrl);

    const orderNowButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Order Now')]")),
      10000
    );
    await orderNowButton.click();

    await driver.wait(until.urlContains("/restaurants"), 10000);

    await driver.wait(
      until.elementLocated(
        By.xpath("//h2[contains(., 'Restaurants Near You')]")
      ),
      10000
    );

    console.log("PASS: Home -> Restaurants flow");
  } catch (error) {
    console.error("FAIL: Home -> Restaurants flow");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
