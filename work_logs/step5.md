# Step 5

プレゼンテーションをコンポーネント化する。Reactを導入してReduxとつなぐ。

## 作業内容

### 必要なライブラリの追加と開発環境の調整

React、ReactDOM、React-ReduxとPropTypesを追加する。

```
$ npm i react react-dom react-redux prop-types
```

JSX周りの扱いを開発環境に適用するためのパッケージを追加する。

```
$ npm i -D babel-preset-react eslint-plugin-react babel-loader
```

Babelの設定でreactをpresetsに追加する。

.babelrc
```json
  ...
  "presets": [
    "env",
    "react"
  ],
  ...
```

ESLintの設定でreactプラグインを有効にする。

.eslintrc.json
```json
  ...
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  ...
```

Babelのプラグインを活かすためにWebPackでbabel-loaderのルールを追加する。

webpack.config.js
```javascript
    ...
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        }
      ]
    }
    ...
```

### ビューをReactコンポーネントにして下準備

アプリケーションのビューをReactコンポーネント化する。`src/component.js`としてファイルに切り出す。

ファイル先頭でReactとPropTypesをロードする。

src/component.js
```javascript
import React from 'react';
import PropTypes from 'prop-types';
```

### 行コンポーネントの作成

最初に一覧の行コンポーネントとなるFishListRowを作る。JSXでtrタグ配下の構造（これまでjQueryで組み立てていた部分）を定義する。
PropTypesでFishListRowが受け入れるプロパティを定義しておく。

src/component.js
```javascript
function FishListRow(props) {
  const { name } = props.fish;
  const { selected, onChange } = props;
  return (
    <tr>
      <td>
        <input type="checkbox" className="select-row" checked={selected} onChange={(e) => {
          onChange(e, props.fish);
        }} />
      </td>
      <td>{name}</td>
    </tr>
  );
}
FishListRow.propTypes = {
  fish: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  selected: PropTypes.bool,
  onChange: PropTypes.func
};
```

### 一覧コンポーネントの作成

FishListRowを利用する一覧コンポーネントとなるFishListを作成する。プロパティで受け取ったfishesとselectedItemsを利用して一覧を組み立てる。

```javascript
export class FishList extends React.Component {

  render() {
    const { fishes, selectedItems } = this.props;
    const selectedIds = selectedItems.reduce((set, f) => {
      set.add(f.id);
      return set;
    }, new Set());
    const allSelected = selectedItems.length === fishes.length;

    const rows = fishes.map(r => {
      return <FishListRow key={r.id} fish={r} selected={selectedIds.has(r.id)} />;
    });

    return (
      <div>
        <h3>おさかなリスト</h3>
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="all-check" /></th>
              <th>なまえ</th>
            </tr>
          </thead>
          <tbody id="fishes-list">
            {rows}
          </tbody>
        </table>
        <button type="button" id="select-button">けってい</button>
      </div>
    );
  }

}
FishList.propTypes = {
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

HTMLファイルにはアプリケーションのビューを入れる`div.app`のみを残してtableなどは削除する。

src/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Classic</title>
</head>
<body>
  <div class="app">
  </div>
  <script src="bundle.js"></script>
</body>
</html>
```

### アプリケーションのビューを描画する

アプリケーション本体側に必要になるライブラリ、コンポーネントのロードを追加する。

src/app.js
```javascript
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { FishList } from './component.js';
```

ストアのsubscribeハンドラ（次の部分）は不要になるのでごっそり削除する。

```javascript
store.subscribe(() => {
  const { fishes, selectedItems }  = store.getState();
  const selectedIds = selectedItems.reduce((set, f) => {
    set.add(f.id);
    return set;
  }, new Set());

  const $fishesList = $('#fishes-list');
  $fishesList.empty();
  $.each(fishes, function(i, r) {
    const $check = $('<input type="checkbox" class="select-row" />').data(r);
    $check.prop('checked', selectedIds.has(r.id));
    $fishesList.append(
      $('<tr />')
        .append($('<td />').append($check))
        .append($('<td />').text(r.name))
    );
  });
  $('#all-check').prop('checked', selectedItems.length === fishes.length);
});
```

ストアからコンポーネントにプロパティとして状態を渡すmapStateToPropsを定義する。
mapStateToPropsをFishListに適用してConnectedFishListとし、Providerで使う。

```javascript
function mapStateToProps(state) {
  const { fishes, selectedItems } = state;
  return {
    fishes,
    selectedItems
  };
}

const ConnectedFishList = connect(mapStateToProps)(FishList);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedFishList />
  </Provider>,
  document.querySelector('.app')
);
```

ここまででReactとReduxの接続は完了。

### componentDidMountで一覧データの取得を行う

本体側でやっていた`store.dispatch(fish.fetchFishes(webApi));`を削除する。

コンポーネントにアクションを渡すためにreduxのbindActionCreatorsを使えるようにする。


src/app.js
```javascript
import { createStore, applyMiddleware, bindActionCreators } from 'redux';
```

fetchFishesをbindActionCreatorsにかけてactionsオブジェクトとして返すmapDispatchToPropsを定義する。
これをconnectの第２引数に渡してConnectedFishListに適用する。


```javascript
const { fetchFishes } = fish;

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      fetchFishes: () => fetchFishes(webApi)
    }, dispatch)
  };
}

const ConnectedFishList = connect(mapStateToProps, mapDispatchToProps)(FishList);
```

componentDidMountをFishListに追加して渡したfetchFishesを実行する。

src/component.js
```javascript
  componentDidMount() {
    this.props.actions.fetchFishes();
  }
```

FishListのPropTypesでactionsを追加しておく

```javascript
FishList.propTypes = {
  actions: PropTypes.shape({
    fetchFishes: PropTypes.func
  }),
  ...
```

### 行の選択・選択解除に対応させる

selectFish, deselectFishをmapDispatchToPropsに追加する。

src/app.js
```javascript
const { selectFish, deselectFish, fetchFishes } = fish;

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      fetchFishes: () => fetchFishes(webApi),
      selectFish,
      deselectFish
    }, dispatch)
  };
}
```

jQueryでやっていた行チェックボックスのchangeイベントハンドリング（下参照）は削除する。

```javascript
$('#fishes-list').on('change', '.select-row', function() {
  const $check = $(this);
  const rowData = $check.data();
  if (!$check.prop('checked')) {
    store.dispatch(fish.deselectFish(rowData));
  } else {
    store.dispatch(fish.selectFish(rowData));
  }
});
```

FishListコンポーネントのrenderメソッド内で、FishListRowの組み立て部分にonChangeプロパティの追加を行う。

```javascript
const rows = fishes.map(r => {
  return <FishListRow key={r.id} fish={r} selected={selectedIds.has(r.id)} onChange={this.handleChangeRow.bind(this)} />;
});
```

handleRowChangeをFishListに追加する。チェックボックスの状態に応じて対応するアクションを実行する。

```javascript
  handleChangeRow(e, row) {
    if (e.target.checked) {
      this.props.actions.selectFish(row);
    } else {
      this.props.actions.deselectFish(row);
    }
  }
```

FishListのPropTypesでactionsにselectFishとdeselectFishを追加する。

```javascript
FishList.propTypes = {
  actions: PropTypes.shape({
    fetchFishes: PropTypes.func,
    selectFish: PropTypes.func,
    deselectFish: PropTypes.func
  }),
...
```

### 全選択・全解除に対応させる

selectAll, deselectAllをmapDispatchToPropsに追加する。

```javascript
const { selectFish, deselectFish, selectAll, deselectAll, fetchFishes } = fish;

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      fetchFishes: () => fetchFishes(webApi),
      selectFish,
      deselectFish,
      selectAll,
      deselectAll
    }, dispatch)
  };
}
```

jQueryでやっていた全選択チェックボックスのchangeイベントハンドリング（下参照）は削除する。

```javascript
$('#all-check').change(function() {
  const forceStatus = $(this).prop('checked');
  if (forceStatus) {
    store.dispatch(fish.selectAll());
  } else {
    store.dispatch(fish.deselectAll());
  }
});
```

FishListコンポーネントのrenderメソッド内で、`checkbox#all-check`にcheckedプロパティと、onChangeプロパティを追加する。

```javascript
<th><input type="checkbox" id="all-check" checked={allSelected} onChange={this.handleChange.bind(this)}  /></th>
```

handleChangeをFishListに追加する。チェックボックスの状態に応じて対応するアクションを実行する。

```javascript
  handleChange(e) {
    const forceStatus = e.target.checked;
    if (forceStatus) {
      this.props.actions.selectAll();
    } else {
      this.props.actions.deselectAll();
    }
  }
```

FishListのPropTypesでactionsにselectAllとdeselectAllを追加する。

```javascript
FishList.propTypes = {
  actions: PropTypes.shape({
    fetchFishes: PropTypes.func,
    selectFish: PropTypes.func,
    deselectFish: PropTypes.func,
    selectAll: PropTypes.func,
    deselectAll: PropTypes.func
  }),
```

### 決定処理に対応させる

jQueryでやっていた"けってい"ボタンのclickイベントハンドリング（下参照）は削除する。

```javascript
$('#select-button').click(function() {
  const { selectedItems } = store.getState();
  if (selectedItems.length > 0) {
    const names = selectedItems.map(r => r.name);
    alert(names.join(','));
  } else {
    alert('せんたくしてください');
  }
});
```

FishListのrenderメソッド内で`button#select-button`にonClickプロパティを追加する。

```javascript
<button type="button" id="select-button" onClick={this.handleClick.bind(this)}>けってい</button>
```

handleClickをFishListに追加する。

```javascript
  handleClick() {
    const { selectedItems } = this.props;
    if (selectedItems.length > 0) {
      const names = selectedItems.map(r => r.name);
      alert(names.join(','));
    } else {
      alert('せんたくしてください');
    }
  }
```

### 動作確認

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

Reactを導入してビューをコンポーネント化した。jQueryを利用していた部分を全て廃止した。
