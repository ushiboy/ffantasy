# Step1

ひとまず手元で動作確認できるようにする。

## 作業内容

npmで初期化して、http-serverをインストール。

```
$ npm init
$ npm install -D http-server
```

Webサーバを起動できるように、package.jsonのscriptsにserveタスクを追加する。
```
$ vi package.json
```

```json
{
  "name": "ffantasy",
  "version": "0.1.0",
  "description": "",
  "main": "src/app.js",
  "scripts": {
    "serve": "http-server ./src -p 8080"
  },
  ...
}
```

動作確認用のWebサーバを起動してブラウザで確認する。

```
$ npm run serve
```

## まとめ

手元で動作確認できるようになった。
