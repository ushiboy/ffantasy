# Step3

ライブラリの依存関係管理とビルド環境を導入する。

## 作業内容

### 開発環境を整備する

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

グローバル変数など意図せずに入ってしまうことを避けるためにeslintを入れる。

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

現状のままのコードだとjQueryがグローバル扱いになっているために警告される。

#### jQueryの依存管理をnpmに変更する

jQueryはバージョン指定でnpmを介してインストールする。

```
$ npm install jquery@3.2.1
```

srcディレクトリに配置してあったjquery.min.jsファイルは削除する。

アプリケーションコードではjQueryをインポートして使う。

```
$ vi src/app.js
```

```javascript
import $ from 'jquery';   // <- 追加

$(function() {
    ...
});
```

HTMLファイルでjQueryを直接scriptタグで参照するのをやめる。

また、ビルドしたbundle.jsを読み込むようにする。

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

### production用ビルド環境を整備する

JavaScriptとは別に管理するHTMLやJSONファイルなどのリソースを扱えるようにする。

とりあえずcopy-webpack-pluginでビルド時にbuildディレクトリへコピーする。

```
$ npm install -D copy-webpack-plugin
```

production用のwebpackビルド設定を追加する。

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

production用ビルドのbuildタスクと、cleanタスクを追加する。

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

jQueryの依存管理をnpmで扱うようにした。
