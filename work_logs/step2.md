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

