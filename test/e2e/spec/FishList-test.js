const assert = require('power-assert');
const chrome = require('selenium-webdriver/chrome');
const {Builder, By, Key, until} = require('selenium-webdriver');

describe('FishList', function() {

  this.timeout(20000);

  let driver;

  beforeEach(() => {
    driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless())
      .build();
  });

  afterEach(() => {
    driver.quit();
  });


  it('test', async () => {
    await driver.get('http://localhost:8080');
    const title = await driver.getTitle();
    assert(title === 'Not Match');
  });

});
