# Step 6

flowを導入して型を定義する。


## 作業内容

### 必要なライブラリの追加と開発環境の調整

flowとそのプラグイン周りをインストール。

```
$ npm i -D flow-bin babel-plugin-transform-flow-strip-types eslint-plugin-flowtype babel-eslint
```

flowはpackage.jsonのscriptsに追記して実行できるようにする。

```
  "scripts": {
    ...
    "flow": "flow"
  },
```

flowで環境を初期化する。.flowconfigファイルができる。

```
$ npm run flow init
```

生成された.flowconfigファイルを編集する。node_modulesは除外対象にして、ライブラリの型定義を`src/decls.js`で扱うようにする。

.flowconfig
```
[ignore]
.*/node_modules/.*

[include]

[libs]
./src/decls.js

[lints]

[options]

[strict]
```

Babelに`transform-flow-strip-types`プラグインを追加する。

.babelrc
```
  "plugins": [
    "transform-flow-strip-types"
  ],
```

`src/decls.js`でライブラリの型定義をdeclareを使って省略しておく。

```
/* @flow */
declare module 'babel-polyfill' {
  declare module.exports: any;
}
declare module 'redux' {
  declare module.exports: any;
}
declare module 'redux-promise' {
  declare module.exports: any;
}
declare module 'react-redux' {
  declare module.exports: any;
}
```

ESLintにflow用の設定を追記する。

.eslintrc.json
```
  "extends": [
    ...
    "plugin:flowtype/recommended"
  ],
  "plugins": [
    "flowtype"
  ],
  "parser": "babel-eslint",
```

これで環境は準備完了。

## リデューサとアクションの型定義

`src/fish.js`に修正を加えていく。まず、先頭にflowのアノテーションを追加する。

```javascript
/* @flow */
```

### 選択・解除アクション

一覧の行データとなるFish型を定義する。

```javascript
export type Fish = {
  id: number,
  name: string
};
```

これをselectFishとdeselectFishで引数の型に追加する。

```javascript
export function selectFish(fish: Fish) {
```

```javascript
export function deselectFish(fish: Fish) {
```

### 一覧取得アクション

WebAPI型を定義する。

```javascript
export type WebAPI = {
  get: (url: string) => Promise<Response>
};
```

これをfetchFishesで引数の型に追加する。

```javascript
export async function fetchFishes(webApi: WebAPI) {
```

### fishリデューサ

fishリデューサが扱う状態のState型を定義する。

```javascript
export type State = {
  fishes: Fish[],
  selectedItems: Fish[]
};
```

アクションは実行されたものによってpayloadが変わるので、[こちら](https://qiita.com/mizchi/items/0e2db7c56541c46a7785)の記事を参考に定義する。
ESLintが未使用の変数警告出すのでその行だけeslint-disable-lineで緩める。

```javascript
type __ReturnType<B, F: (...any) => B | Promise<B>> = B; // eslint-disable-line no-unused-vars
type $ReturnType<F> = __ReturnType<*, F>

export type Action =
  | $ReturnType<typeof fetchFishes>
  | $ReturnType<typeof selectFish>
  | $ReturnType<typeof deselectFish>
  | $ReturnType<typeof selectAll>
  | $ReturnType<typeof deselectAll>
```

StateとActionを利用してfishesリデューサの引数に型を追加する。

```javascript
export function fishes(state: State = { fishes: [], selectedItems: [] }, action: Action) {
```


## コンポーネントのProps定義

`src/component.js`に修正を加えていく。まず、先頭にflowのアノテーションを追加する。

```javascript
/* @flow */
```

PropTypesは不要になるのでライブラリのロード(`import PropTypes from 'prop-types';`)は削除しておく。
代わりにfish.js側で定義した型を読み込み。

```javascript
import type { Fish, Action } from './fish.js';
```

### FishListRow

はじめにFishListRowのPropsを定義する。

```javascript
type FishListRowProps = {
  fish: Fish,
  selected: boolean,
  onChange: (e: SyntheticInputEvent<HTMLInputElement>, row: Fish) => void
}
```

PropTypesを使って定義していた部分(下参照)は廃止して削除する。
```javascript
FishListRow.propTypes = {
  fish: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  selected: PropTypes.bool,
  onChange: PropTypes.func
};
```

FishListRowの引数にFishListRowProps型を追加する。

```javascript
function FishListRow(props: FishListRowProps) {
```

### FishList

FishListRowで扱うPropsを定義する。アクションはActionCreatorとして一つにまとめてから使う。

```javascript
type ActionCreator = (action: Action | Promise<Action>) => void;

type FishListProps = {
  fishes: Fish[],
  selectedItems: Fish[],
  actions: {
    fetchFishes: ActionCreator,
    selectFish: ActionCreator,
    deselectFish: ActionCreator,
    selectAll: ActionCreator,
    deselectAll: ActionCreator
  }
}
```

PropTypesを使って定義していた部分(下参照)は廃止して削除する。

```javascript
FishList.propTypes = {
  actions: PropTypes.shape({
    fetchFishes: PropTypes.func,
    selectFish: PropTypes.func,
    deselectFish: PropTypes.func,
    selectAll: PropTypes.func,
    deselectAll: PropTypes.func
  }),
  fishes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })),
  selectedItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }))
};
```

FishListにFishListProps型を適用する。

```javascript
export class FishList extends React.Component<FishListProps> {
```

handleChangeRowメソッドの引数にイベントオブジェクトの型を追加する。

```javascript
  handleChangeRow(e: SyntheticInputEvent<HTMLInputElement>, row: Fish) {
```

handleChangeメソッドの引数にイベントオブジェクトの型を追加する。

```javascript
  handleChange(e: SyntheticInputEvent<HTMLInputElement>) {
```

## アプリケーション本体

`src/app.js`に修正を加えていく。まず、先頭にflowのアノテーションを追加する。

```javascript
/* @flow */
```

ReactDOMのrenderでelの確認が必要になるので修正する。

```javascript
const el = document.querySelector('.app');

if (el) {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedFishList />
    </Provider>,
    el);
}
```

### 動作確認

flowを動かして検証する。

```
$ npm run flow check

> ffantasy@0.1.0 flow /storage/cottage/ushiboy/Junk/ffantasy
> flow "check"

Found 0 errors
```


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

flowを導入して型を定義した。
