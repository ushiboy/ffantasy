# Step3

ライブラリの依存関係管理とビルド環境を導入する。

## 作業内容

### 依存管理含めた開発環境を整備する

#### webpackを導入する

```
$ npm install -D webpack webpack-cli webpack-dev-server
```

開発用のwebpack設定を行う。

```
$ vi webpack.config.js
```

```javascript
function configureWebpack(mode) {
  mode = mode || 'development';
  const base = {
    mode,
    entry: [
      './src/app.js'
    ]
  };

  if (mode === 'production') {
    // 後で
  } else {
    return Object.assign({}, base, {
      output: {
        filename: 'bundle.js',
        path: __dirname
      },
      devServer: {
        contentBase: './src',
        inline: true,
        host: '0.0.0.0',
        port: 8080,
        disableHostCheck: true,
        stats: {
          version: false,
          hash: false,
          chunkModules: false
        }
      },
      devtool: 'source-map'
    });
  }
}

module.exports = configureWebpack(process.env.ENV);
```

package.jsonにstartタスクを追加する。

```
$ vi package.json
```

```json
  ...
  "scripts": {
    "start": "webpack-dev-server",
    ...
  },
  ...
```

#### ESLintを導入する

グローバル変数などの正しく管理するためにeslintを入れる。

```
$ npm install -D eslint
```

eslintの設定をしておく。

```
$ vi .eslintrc.json
```

```json
{
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
}
```

#### jQueryへの依存周りを修正する

jQueryはバージョン指定でnpmを介してインストールする。

```
$ npm install jquery@3.2.1
```

アプリケーションコードではjqueryをインポートして使うようにする。

```
$ vi src/app.js
```

```javascript
import $ from 'jquery';

$(function() {
    ...
});
```

HTMLファイルでjqueryを直接scriptタグで参照するのをやめる。

また、app.jsではなくビルドしたbundle.jsを読み込むようにする。

```
$ vi src/index.html
```

```html
<!DOCTYPE html>
<html lang="en">
  ...
  <script src="bundle.js"></script>
</body>
</html>
```


#### 動作確認

webpack-dev-serverを起動する。

```
$ npm start
```

E2Eテストを動かして、壊れていないことを確認する。

```
$ npm run -s mocha test/e2e/spec/FishList-test.js
```

### production用ビルドを行えるようにする

JavaScriptとは別に管理するリソースをビルド時に扱えるようにする。

```
$ npm install -D copy-webpack-plugin
```

production用のwebpackビルド設定を行う。

```
$ vi webpack.config.js
```

```javascript
const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function configureWebpack(mode) {
  mode = mode || 'development';
  const buildDir = process.env.BUILD_DIR || 'build';
  const base = {
    mode,
    entry: [
      './src/app.js'
    ]
  };

  if (mode === 'production') {
    fs.mkdirSync(path.join(__dirname, buildDir));
    return Object.assign({}, base, {
      output: {
        filename: 'bundle.js',
        path: path.join(__dirname, buildDir)
      },
      plugins: [
        new CopyWebpackPlugin([
          './src/index.html',
          './src/fishes.json'
        ])
      ]
    });
  } else {
    return Object.assign({}, base, {
      output: {
        filename: 'bundle.js',
        path: __dirname
      },
      devServer: {
        contentBase: './src',
        inline: true,
        host: '0.0.0.0',
        port: 8080,
        disableHostCheck: true,
        stats: {
          version: false,
          hash: false,
          chunkModules: false
        }
      },
      devtool: 'source-map'
    });
  }
}

module.exports = configureWebpack(process.env.ENV);
```

production用ビルドのbuildタスクと、毎回一から作り直すためのcleanタスクを追加する。

確認用WEBサーバのドキュメントルートのパスをbuildディレクトリにしておく。

buildディレクトリはgitignore対象にする。

```
$ vi package.json
```

```json
  ...
  "scripts": {
    ...
    "clean": "rm -rf build",
    "build": "npm run clean && ENV=production webpack",
    "serve": "http-server ./build -p 8080",
    ...
  },
  ...
```

#### 動作確認

ビルドして開発用WEBサーバを起動する。

```
$ npm run build
$ npm run serve
```

E2Eテストを動かして、壊れていないことを確認する。
```
$ npm run -s mocha test/e2e/spec/FishList-test.js
```

## まとめ

開発用ビルド環境とproduction用ビルド環境を用意した。
