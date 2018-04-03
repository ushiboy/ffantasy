# Step4

ドメインとプレゼンテーションを分離して、ドメインの単体テストを追加する。


## 作業内容

eslintの設定でmochaを有効にする。

parserOptionsにecmaVersionを追加してECMAScript201x系で書けるようにする。

```json
  ...
  "env": {
    ...
    "mocha": true
  },
  ...
  "parserOptions": {
    ...
    "ecmaVersion": 2017
  },
  ...
```

とりあえず状態管理をReduxで扱うことにする。

reduxとミドルウェアのredux-promiseを入れる。


```
$ npm install redux redux-promise
```

既存コードから必要な状態を抽出する。

今回は一覧(fishes)と選択アイテム(selectedItems)の2つ。これをReducerで扱うstateとする。

ReducerやAction、Action Typeは`src/fish.js`として別ファイルで扱う。


最初にReducerの大枠を作る。

```javascript
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  switch (action.type) {
  default:
    return state;
  }
}
```

アプリケーション本体(`src/app.js`)でReduxのStoreとして読み込む。

webpackでバンドルしているため、変数はグローバル変数にならないし、
jQueryのready内で扱う必要がなくなっているので`$(function() { ... })`をやめる。

fishes Reducerを使ってStoreを作成する。
ミドルウェアとしてredux-promiseを読ませておく。

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

追加したFETCHアクションをハンドリングするためにReducerに追記する。

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

fetchFishesはアプリケーション起動時に、Storeへdispatchする。

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

Storeのsubscribeで一覧データが取り出せるようになったので、一覧の初期化処理を書き換える。


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

まずはReducerのテストとして、FETCHアクションのテストを追加する。

一覧データのアサーションは何度も使うので、assertFishEqualとしてまとめておく。

```javascript
const assert = require('power-assert');
import * as fish from '../../src/fish.js';

function assertFishEqual(actual, id, name) {
  assert(actual.id === id);
  assert(actual.name === name);
}

describe('Fish', function() {

  describe('Action', () => {
    // アクションのテストはここに書く
  });

  describe('Reducer', () => {

    describe('FETCH アクション', () => {

      it('payloadのfishesをstateに取り込んで返す', () => {
        const initState = {};
        const action = {
          type: fish.FETCH,
          payload: {
            fishes: [
              {
                'id': 1,
                'name': 'まぐろ'
              }
            ]
          }
        };
        const { fishes } = fish.fishes(initState, action);
        assert(fishes.length === 1);
        assertFishEqual(fishes[0], 1, 'まぐろ');
      });

    });

  });

});
```

fetchFishesアクションのテストはこのままだと書きにくいので、fetchを薄くラップして外から渡す。

`webApi.get(url: string): Promise<Response>`のようなオブジェクトを受け取って使うように修正する。

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

アプリケーション本体側で渡す。

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
```

ユーティリティ関数で作ったダミーWebAPIを使いつつテストを書く。

```javascript
    describe('#fetchFishes', () => {
      const response = {
        fishes: [
          {
            'id': 1,
            'name': 'まぐろ'
          }
        ]
      };
      let type, payload, webApi;

      beforeEach(async () => {
        webApi = generateDummyWebApi(response);
        const r = await fish.fetchFishes(webApi);
        type = r.type;
        payload = r.payload;
      });

      it('fishes.jsonを取得する', async () => {
        assert(webApi.requestedUrls[0] === 'fishes.json');
      });

      it('FETCHをtypeとして返す', async () => {
        assert(type === fish.FETCH);
      });

      it('一覧データをpayloadとして返す', async () => {
        const { fishes } = payload;
        assert(fishes.length === 1);
        assertFishEqual(fishes[0], 1, 'まぐろ');
      });

    });
```

項目の選択・選択解除をアクションにする

```javascript
export const SELECT = 'fishes/select';
export const DESELECT = 'fishes/deselect';
...
export function selectFish(fish) {
  return {
    type: SELECT,
    payload: {
      fish
    }
  };
}

export function deselectFish(fish) {
  return {
    type: DESELECT,
    payload: {
      fish
    }
  };
}
```

ReducerをSELECT,DESELECTに対応させる

```javascript
...
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  const { selectedItems } = state;
  switch (action.type) {
  case FETCH:
    return Object.assign({}, state, {
      fishes: action.payload.fishes
    });
  case SELECT:
  {
    const { fish } = action.payload;
    if (!selectedItems.find(r => {
      return r.id === fish.id;
    })) {
      selectedItems.push(fish);
    }
    return Object.assign({}, state, {
      selectedItems: selectedItems.sort((a, b) => {
        return a.id - b.id;
      })
    });
  }
  case DESELECT:
  {
    const { fish } = action.payload;
    return Object.assign({}, state, {
      selectedItems: selectedItems.filter(r => {
        return r.id !== fish.id;
      })
    });
  }
  default:
    return state;
  }
}
```

チェックボックスのイベントハンドラでselectFish, deselectFishアクションを使うように修正する。

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

選択・選択解除を反映するためにStoreのsubscribe処理を修正する。

```javascript
store.subscribe(() => {
  fishes = store.getState().fishes;
  selectedItems = store.getState().selectedItems;

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

単体テストを追加する

```javascript
    describe('#selectFish', () => {

      let type, payload;

      beforeEach(() => {
        const r = fish.selectFish({
          'id': 1,
          'name': 'まぐろ'
        });
        type = r.type;
        payload = r.payload;
      });

      it('SELECTをtypeとして返す', () => {
        assert(type === fish.SELECT);
      });

      it('選択された行データをpayloadとして返す', () => {
        assertFishEqual(payload.fish, 1, 'まぐろ');
      });

    });

    describe('#deselectFish', () => {

      let type, payload;

      beforeEach(() => {
        const r = fish.deselectFish({
          'id': 1,
          'name': 'まぐろ'
        });
        type = r.type;
        payload = r.payload;
      });

      it('DESELECTをtypeとして返す', () => {
        assert(type === fish.DESELECT);
      });

      it('選択解除された行データをpayloadとして返す', () => {
        assertFishEqual(payload.fish, 1, 'まぐろ');
      });

    });
```

```javascript
    describe('SELECT アクション', () => {

      it('payloadの選択データを選択アイテムに追加して返す', () => {
        const initState = {
          selectedItems: [
            {
              'id': 2,
              'name': 'はまち'
            }
          ]
        };
        const action = {
          type: fish.SELECT,
          payload: {
            fish: {
              'id': 1,
              'name': 'まぐろ'
            }
          }
        };
        const { selectedItems } = fish.fishes(initState, action);
        assert(selectedItems.length === 2);
        assertFishEqual(selectedItems[0], 1, 'まぐろ');
        assertFishEqual(selectedItems[1], 2, 'はまち');
      });

      context('選択データと同じ選択アイテムがすでにある場合', () => {

        const initState = {
          selectedItems: [
            {
              'id': 1,
              'name': 'まぐろ'
            },
            {
              'id': 2,
              'name': 'はまち'
            }
          ]
        };

        it('重複をまとめたうえで選択アイテムに追加して返す', () => {
          const action = {
            type: fish.SELECT,
            payload: {
              fish: {
                'id': 1,
                'name': 'まぐろ'
              }
            }
          };
          const { selectedItems } = fish.fishes(initState, action);
          assert(selectedItems.length === 2);
          assertFishEqual(selectedItems[0], 1, 'まぐろ');
          assertFishEqual(selectedItems[1], 2, 'はまち');
        });
      });

    });

    describe('DESELECT アクション', () => {

      it('payloadの選択解除データを選択アイテムから削除して返す', () => {
        const initState = {
          selectedItems: [
            {
              'id': 1,
              'name': 'まぐろ'
            },
            {
              'id': 2,
              'name': 'はまち'
            }
          ]
        };
        const action = {
          type: fish.DESELECT,
          payload: {
            fish: {
              'id': 1,
              'name': 'まぐろ'
            }
          }
        };
        const { selectedItems } = fish.fishes(initState, action);
        assert(selectedItems.length === 1);
        assertFishEqual(selectedItems[0], 2, 'はまち');
      });

    });

```


全選択・全解除を実装する。


```javascript
export const SELECT_ALL = 'fishes/select/all';
export const DESELECT_ALL = 'fishes/deselect/all';
...
export function selectAll() {
  return {
    type: SELECT_ALL
  };
}

export function deselectAll() {
  return {
    type: DESELECT_ALL
  };
}
```

Reducerを対応させる

```javascript
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  const { selectedItems } = state;
  switch (action.type) {
  ...
  case SELECT_ALL:
    return Object.assign({}, state, {
      selectedItems: state.fishes.concat()
    });
  case DESELECT_ALL:
    return Object.assign({}, state, {
      selectedItems: []
    });
  default:
    return state;
  }
}
```

アプリ側を対応させる

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

テストを追加する。

```javascript
    describe('#selectAll', () => {

      it('SELECT_ALLをtypeとして返す', () => {
        const { type } = fish.selectAll();
        assert(type === fish.SELECT_ALL);
      });

    });

    describe('#deselectAll', () => {

      it('DESELECT_ALLをtypeとして返す', () => {
        const { type } = fish.deselectAll();
        assert(type === fish.DESELECT_ALL);
      });

    });

```

```javascript
    describe('SELECT_ALL アクション', () => {

      it('一覧データを全て選択アイテムにして返す', () => {
        const initState = {
          fishes: [
            {
              'id': 1,
              'name': 'まぐろ'
            },
            {
              'id': 2,
              'name': 'はまち'
            }
          ],
          selectedItems: []
        };
        const action = {
          type: fish.SELECT_ALL
        };
        const { selectedItems } = fish.fishes(initState, action);
        assert(selectedItems.length === 2);
        assertFishEqual(selectedItems[0], 1, 'まぐろ');
        assertFishEqual(selectedItems[1], 2, 'はまち');
      });

    });
    describe('DESELECT_ALL アクション', () => {

      it('選択アイテムを全て解除して返す', () => {
        const initState = {
          fishes: [],
          selectedItems: [
            {
              'id': 1,
              'name': 'まぐろ'
            },
            {
              'id': 2,
              'name': 'はまち'
            }
          ]
        };
        const action = {
          type: fish.DESELECT_ALL
        };
        const { selectedItems } = fish.fishes(initState, action);
        assert(selectedItems.length === 0);
      });

    });

```


けっていボタンのクリックイベントを修正する

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

fishesとselectedItems変数が不要になったので削除し、subscribe周りを修正する

```javascript
import $ from 'jquery';
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import * as fish from './fish.js';

const webApi = {
  get(url) {
    return fetch(url);
  }
};

const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));
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
