# Step4

ドメインとプレゼンテーションを分離して、ドメインの単体テストを導入する。


## 作業内容

eslintの設定でmochaを有効にする。parserOptionsにecmaVersionを追加してECMAScript201x系で書けるようにする。

```
$ vi .eslintrc.json
```

```json:.eslintrc.json
  ...
  "env": {
    ...
    "mocha": true   // <- 追加
  },
  ...
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2017   // <- 追加
  },
  ...
```

とりあえず状態管理をReduxでやることにする。reduxとミドルウェアでredux-promiseを入れる。


```
$ npm install redux redux-promise
```

既存コードから状態を抽出する。今回は一覧(fishes)と選択アイテム(selectedItems)の2つ。これをReducerで扱うstateとする。

ReducerやAction、Action Typeは`src/fish.js`として別ファイルで扱う。

```
$ vi src/fish.js
```

最初にReducer。

```javascript:src/fish.js
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  switch (action.type) {
  default:
    return state;
  }
}
```

アプリケーション側`src/app.js`でreduxのStoreとして読み込む。

webpackでバンドルしているため、変数はグローバル変数にならないし、
jQueryのready内で扱う必要がなくなっているので`$(function() { ... })`をやめる。

fishes Reducerを使ってStoreを作成する。
ミドルウェアとしてredux-promiseを読ませておく。

```
$ vi src/app.js
```

```javascript
import $ from 'jquery';
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import * as fish from './fish.js';

// fishesとselectedItemsはまだ残しておく
var fishes = [];
var selectedItems = [];

const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));
store.subscribe(() => {
  console.log('change');
  console.log(store.getState());
});
...
```

既存コードからアクションを抜き出していく。まずは一覧データの取得アクション。

fishes.jsonのAjax取得部分をfetchFishesとする。

```javascript
export const FETCH = 'fishes/fetch';
...

export async function fetchFishes() {
  const res = await fetch('fishes.json');
  const json = await res.json();
  const { fishes } = json;
  return {
    type: FETCH,
    payload: {
      fishes
    }
  };
}
```

追加したFETCHアクションに対応するためにReducerでハンドリングする。

```javascript
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  switch (action.type) {
  case FETCH:
    return Object.assign({}, state, {
      fishes: action.payload.fishes
    });
  default:
    return state;
  }
}
```

fetchFishesをアプリケーション起動時に、Storeへdispatchする。

```javascript
...
const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));
store.subscribe(() => {
  console.log('change');
  console.log(store.getState());
});

store.dispatch(fish.fetchFishes()); // <- 追加
...
```

Storeのsubscribeで取得した一覧データが取り出せるようになったので、一覧の初期化を書き換える。


次の部分を廃止。

```javascript
...
$.ajax('fishes.json').done(function(response) {
  fishes = response.fishes;
  var $fishesList = $('#fishes-list');

  $.each(fishes, function(i, r) {
    $fishesList.append(
      $('<tr />')
        .append($('<td />').append($('<input type="checkbox" class="select-row" />').data(r)))
        .append($('<td />').text(r.name))
    );
  });
});
...
```

こちらで置き換え。

```javascript
...
store.subscribe(() => {
  fishes = store.getState().fishes;

  const $fishesList = $('#fishes-list');

  $.each(fishes, function(i, r) {
    $fishesList.append(
      $('<tr />')
        .append($('<td />').append($('<input type="checkbox" class="select-row" />').data(r)))
        .append($('<td />').text(r.name))
    );
  });
});
...
```

これで一覧の初期教示までは仮おき。ここまでの単体テストを作る。

```
$ vi test/unit/fish-test.js
```

まずはReducerのテストとして、FETCHアクションのハンドリングを追加する。

一覧データのアサーションは何度も使うので、assertFishEqualとしてまとめておく。

```javascript
const assert = require('power-assert');
import * as fish from '../../src/fish.js';

function assertFishEqual(actual, id, name) {
  assert(actual.id === id);
  assert(actual.name === name);
}

describe('Fish', function() {

  describe('action', () => {

  });

  describe('reducer', () => {

    describe('FETCH アクション', () => {

      it('payloadのfishesをstateに取り込んで返す', () => {
        const { fishes } = fish.fishes({}, {
          type: fish.FETCH,
          payload: {
            fishes: [
              {
                'id': 1,
                'name': 'まぐろ'
              }
            ]
          }
        });

        assert(fishes.length === 1);
        assertFishEqual(fishes[0], 1, 'まぐろ');
      });

    });
  });

});
```

fetchFishesアクションのテストはこのままだと書きにくいので、fetchを薄くラップして外から渡す。

`webApi.get(url: string):Promise<Response>`みたいなインターフェイスとして、渡されたものを使うように修正。

```javascript
...
export async function fetchFishes(webApi) {
  const res = await webApi.get('fishes.json');
  const json = await res.json();
  const { fishes } = json;
  return {
    type: FETCH,
    payload: {
      fishes
    }
  };
}
...
```

アプリケーション側で渡す。

```javascript
...
const webApi = {
  get(url) {
    return fetch(url);
  }
};
...

store.dispatch(fish.fetchFishes(webApi));
...
```

これを踏まえてテストを書く。ダミーのWebAPIを作れるユーティリティ関数を用意する。

```javascript
...
function generateDummyWebApi(responseJson) {
  return {
    requestedUrls: [],
    async get(url) {
      this.requestedUrls.push(url);
      return {
        async json() {
          return responseJson;
        }
      };
    }
  };
}
...

  describe('action', () => {

    describe('fetchFishes', () => {

      it('fishes.jsonから取得した一覧データをpayloadとして返す', async () => {
        const response = {
          fishes: [
            {
              'id': 1,
              'name': 'まぐろ'
            }
          ]
        };
        const webApi = generateDummyWebApi(response);
        const { type, payload } = await fish.fetchFishes(webApi);
        assert(webApi.requestedUrls[0] === 'fishes.json');
        assert(type === fish.FETCH);

        const { fishes } = payload;
        assert(fishes.length === 1);
        assertFishEqual(fishes[0], 1, 'まぐろ');
      });

    });

  });
...
```

