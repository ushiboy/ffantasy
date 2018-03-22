const assert = require('power-assert');
const chrome = require('selenium-webdriver/chrome');
const {Builder, By, Key, until} = require('selenium-webdriver');

class FishesList {

  constructor(driver) {
    this.driver = driver;
  }

  async open() {
    await this.driver.get('http://localhost:8080');
    return this;
  }

  async waitForRowToFinishLoading() {
    await this.driver.wait(async () => {
      const rows = await this._getRows();
      return rows.length !== 0;
    }, 5000);
    return this;
  }

  async getRowLength() {
    const rows = await this._getRows();
    return rows.length;
  }

  async getNameOfIndex(index) {
    const rows = await this._getRows();
    const cols = await rows[index].findElements(By.tagName('td'));
    return cols[1].getText();
  }

  async clickSelect() {
    await this.driver.findElement(By.id('select-button')).click();
    return this.driver.switchTo().alert();
  }

  async clickCheckBoxOfIndex(index) {
    const rows = await this._getRows();
    await rows[index].findElement(By.className('select-row')).click();
    return this;
  }

  async clickAllCheck() {
    const check = await this.driver.findElement(By.id('all-check'));
    check.click();
    return this;
  }

  async _getRows() {
    return this.driver.findElement(By.id('fishes-list')).findElements(By.tagName('tr'));
  }

}

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


  it('一覧が動的に読み込まれること', async () => {
    const p = new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();

    assert(await p.getRowLength() === 3);

    assert(await p.getNameOfIndex(0) === 'まぐろ')
    assert(await p.getNameOfIndex(1) === 'はまち')
    assert(await p.getNameOfIndex(2) === 'かつお')
  });

  it('未選択状態で"けってい"するとアラートがでること', async () => {
    const p =  new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();

    const alert = await p.clickSelect();
    assert(await alert.getText() === 'せんたくしてください');
  });

  it('一覧のアイテムを1件選択して"けってい"すると選択結果が表示されること', async () => {
    const p =  new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();

    await p.clickCheckBoxOfIndex(0);

    const alert = await p.clickSelect();
    assert(await alert.getText() === 'まぐろ');
  });

  it('一覧のアイテムを複数件選択して"けってい"すると選択結果が表示されること', async () => {
    const p =  new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();

    await p.clickCheckBoxOfIndex(1);
    await p.clickCheckBoxOfIndex(0);

    const alert = await p.clickSelect();
    assert(await alert.getText() === 'まぐろ,はまち');
  });

  it('全体チェックをするとすべてのアイテムが選択されること', async () => {
    const p =  new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();
    await p.clickCheckBoxOfIndex(0);
    const alert1 = await p.clickSelect();
    assert(await alert1.getText() === 'まぐろ');

    await alert1.accept();
    await p.clickAllCheck();

    const alert2 = await p.clickSelect();
    assert(await alert2.getText() === 'まぐろ,はまち,かつお');
  });

  it('全部チェックを外すとすべてのアイテムが選択解除になること', async () => {
    const p =  new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();
    await p.clickCheckBoxOfIndex(0);
    await p.clickCheckBoxOfIndex(1);
    await p.clickCheckBoxOfIndex(2);

    const alert1 = await p.clickSelect();
    assert(await alert1.getText() === 'まぐろ,はまち,かつお');

    await alert1.accept();
    await p.clickAllCheck();

    const alert2 = await p.clickSelect();
    assert(await alert2.getText() === 'せんたくしてください');
  });
});
