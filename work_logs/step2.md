# Step2

既存のアプリケーションを壊す不安を抑えるために、自動でテストをできるようにする。

単体テストするにはコードが蜜結合すぎるので、ひとまずE2Eテストを作る。


## 作業内容

### mocha, power-assertでテスト環境の基盤を作る

mochaとpower-assertでテストできる環境を構築する。

環境気にせずにECMAScript201xで書きたいのでbabelも入れておく。

```
$ npm install -D mocha \
    power-assert \
    babel-preset-env \
    babel-preset-power-assert \
    babel-polyfill \
    babel-register
```

babelの設定。

```
$ vi .babelrc
```

```json
{
  "presets": [
    "env"
  ],
  "plugins": [
  ],
  "env": {
    "development": {
      "presets": [
        "power-assert"
      ]
    }
  }
}
```

testディレクトリを作成し、mochaのrequireオプションで読ませるためのsetup.jsファイルを作成する。

```
$ mkdir test
$ vi test/setup.js
```

```javascript
require('babel-polyfill');
require('babel-register')();
```


動作確認のためのテストケースを追加する。このファイルは後でE2Eテストに使う。

```
$ mkdir -p test/e2e/spec
$ vi test/e2e/spec/FishList-test.js
```

```javascript
const assert = require('power-assert');

describe('FishList', function() {

  it('test', () => {
    assert(true === false);
  });

});
```

package.jsonのscriptsにmochaを追加する。


```
$ vi package.json
```

```
  ...
  "scripts": {
    "serve": "http-server ./src -p 8080",
    "mocha": "mocha --require test/setup.js"
  },
  ...
```

テストを実行して動作確認する。

```
$ npm run -s mocha test/e2e/spec/FishList-test.js


  FishList
    1) test


  0 passing (88ms)
  1 failing

  1) FishList
       test:

      AssertionError [ERR_ASSERTION]:   # test/e2e/spec/FishList-test.js:6

  assert(true === false)
              |
              false

  [boolean] false
  => false
  [boolean] true
  => true

      + expected - actual

      -false
      +true

      at Decorator._callFunc (node_modules/empower-core/lib/decorator.js:110:20)
      at Decorator.concreteAssert (node_modules/empower-core/lib/decorator.js:103:17)
      at decoratedAssert (node_modules/empower-core/lib/decorate.js:49:30)
      at powerAssert (node_modules/empower-core/index.js:63:32)
      at Context.<anonymous> (test/e2e/spec/FishList-test.js:6:5)
```

### seleniumでE2Eテストできる環境を作る

seleniumをインストール

```
$ npm i -D selenium-webdriver
```

chromeのwebdriverを取得してきて設置する。

バージョンが上がるたびにドライバーを更新することがあるので、gitignore対象にしておく。

```
$ mkdir test/e2e/driver
$ cd test/e2e/driver
$ wget https://chromedriver.storage.googleapis.com/2.37/chromedriver_linux64.zip
$ unzip chromedriver_linux64.zip
$ rm chromedriver_linux64.zip
```

E2Eテスト用の雛形を作る

```
$ vi test/e2e/spec/FishList-test.js
```

```javascript
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
```

webdriverのパスを解決するためにsetup.jsに追記する。

```
$ test/setup.js
```

```javascript
require('babel-polyfill');
require('babel-register')();

const path = require('path');
const driversDirPath = path.join(__dirname, './e2e/driver');
process.env.PATH = process.env.PATH + ':' + driversDirPath;
```

動作確認する。

別ターミナルでWebサーバを起動しておく。

```
$ npm run serve
```

テストを実行する。

```
$ npm run -s mocha test/e2e/spec/FishList-test.js

  FishList
    1) test


  0 passing (489ms)
  1 failing

  1) FishList
       test:

      AssertionError [ERR_ASSERTION]:   # test/e2e/spec/FishList-test.js:26

  assert(title === 'Not Match')
         |     |
         |     false
         "Classic"

  --- [string] 'Not Match'
  +++ [string] title
  @@ -1,9 +1,7 @@
  -Not Match
  +Classic


      + expected - actual

      -false
      +true

      at Decorator._callFunc (node_modules/empower-core/lib/decorator.js:110:20)
      at Decorator.concreteAssert (node_modules/empower-core/lib/decorator.js:103:17)
      at decoratedAssert (node_modules/empower-core/lib/decorate.js:49:30)
      at powerAssert (node_modules/empower-core/index.js:63:32)
      at Suite._callee$ (test/e2e/spec/FishList-test.js:26:5)
      at tryCatch (node_modules/regenerator-runtime/runtime.js:65:40)
      at Generator.invoke [as _invoke] (node_modules/regenerator-runtime/runtime.js:303:22)
      at Generator.prototype.(anonymous function) [as next] (node_modules/regenerator-runtime/runtime.js:117:21)
      at step (test/e2e/spec/FishList-test.js:6:191)
      at /storage/cottage/ushiboy/Junk/f/test/e2e/spec/FishList-test.js:6:361
      at <anonymous>
      at process._tickCallback (internal/process/next_tick.js:160:7)
```

### E2Eテストを書く

seleniumでE2Eを書くときに、そのままベタ書きすると後でメンテが辛いコードになる。

例えば「一覧の読み込みを待って列の値を確認する」テスト場合、次の様になる。

```javascript
  it('一覧が動的に読み込まれること', async () => {
    await driver.get('http://localhost:8080');
    let rows;
    await driver.wait(async () => {
      rows = await driver.findElement(By.id('fishes-list')).findElements(By.tagName('tr'));
      return rows.length !== 0;
    }, 5000);

    assert(rows.length === 3);

    const cols1 = await rows[0].findElements(By.tagName('td'));
    assert(await cols1[1].getText() === 'まぐろ');
    const cols2 = await rows[1].findElements(By.tagName('td'));
    assert(await cols2[1].getText() === 'はまち');
    const cols3 = await rows[2].findElements(By.tagName('td'));
    assert(await cols3[1].getText() === 'かつお');
  });
```


WebDriverのAPIでDOM触って、要素から取り出した値をアサーションにかけるみたいなのの繰り返しになる。

書いたばかりはいいけど、後から見返した時に何していたのかだいたい忘れる。

そこで、[Page Object](https://github.com/SeleniumHQ/selenium/wiki/PageObjects)を利用する。

具体的には次のようなPage Objectを用意する。

```javascript
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

  async _getRows() {
    return this.driver.findElement(By.id('fishes-list')).findElements(By.tagName('tr'));
  }

}
```

Page Objectを使ってテストを書く。

```javascript
  it('一覧が動的に読み込まれること', async () => {
    const p = new FishesList(driver);
    await p.open();
    await p.waitForRowToFinishLoading();

    assert(await p.getRowLength() === 3);

    assert(await p.getNameOfIndex(0) === 'まぐろ')
    assert(await p.getNameOfIndex(1) === 'はまち')
    assert(await p.getNameOfIndex(2) === 'かつお')
  });
```

Page Objectを使うとDOMに触ったり操作する辺りは隠蔽できるので、苦しみが若干和らぐ。

E2Eテスト全体のコードは[こちら](../test/e2e/spec/FishList-test.js)


実行して動作確認する。

```
$ npm run -s mocha test/e2e/spec/FishList-test.js


  FishList
    ✓ 一覧が動的に読み込まれること (580ms)
    ✓ 未選択状態で"けってい"するとアラートがでること (603ms)
    ✓ 一覧のアイテムを1件選択して"けってい"すると選択結果が表示されること (639ms)
    ✓ 一覧のアイテムを複数件選択して"けってい"すると選択結果が表示されること (681ms)
    ✓ 全体チェックをするとすべてのアイテムが選択されること (770ms)
    ✓ 全部チェックを外すとすべてのアイテムが選択解除になること (934ms)


  6 passing (4s)
```


## まとめ

自動でテストできるようにした。
