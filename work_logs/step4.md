# Step4

ドメインとプレゼンテーションを分離して、ドメインの単体テストを追加する。

## 作業内容

### ESLintの設定とReduxの導入

ESLintの設定でmochaを有効にする。
また、parserOptionsにecmaVersionを追加してECMAScript201x系で書けるようにする。

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

状態管理をReduxで扱うためにreduxとミドルウェアのredux-promiseを入れる。


```
$ npm install redux redux-promise
```

### リデューサの作成とアプリケーションへの適用

既存コードから必要な状態を抽出する。
今回は一覧(fishes)と選択アイテム(selectedItems)の2つ。これをリデューサで扱うstateとする。
リデューサやアクション、アクションタイプは`src/fish.js`として別ファイルで扱う。

最初にリデューサの大枠を作る。

```javascript
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  switch (action.type) {
  default:
    return state;
  }
}
```

アプリケーション本体(`src/app.js`)でReduxのストアとして読み込む。

webpackでバンドルしているので変数はグローバル変数にならないし、
jQueryのready内で扱う必要がなくなっているので`$(function() { ... })`をやめる。

fishes リデューサを使ってストアを作成する。ミドルウェアとしてredux-promiseを読ませておく。

```javascript
import $ from 'jquery';
import { createStore, applyMiddleware } from 'redux'; // <- 追加
import promiseMiddleware from 'redux-promise'; // <- 追加
import * as fish from './fish.js'; // <- 追加

// fishesとselectedItemsはまだ残しておく
var fishes = [];
var selectedItems = [];

// 以下追加
const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));
store.subscribe(() => {
  console.log('change');
  console.log(store.getState());
});
...
```

ここまででReduxを使う準備は完了。以降は既存コードからアクションを抜き出していく。

### 一覧データの取得アクション

まずは一覧データの取得をアクション化(FETCHとして定義)する。

```javascript
export const FETCH = 'fishes/fetch';
```

fishes.jsonのAjax取得部分をfetchFishesとして、FETCHタイプでpayloadに取得した一覧データを返すようにする。

```javascript
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

FETCHアクションのハンドリングをリデューサに追記する。

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

これをアプリケーション本体で使う。アプリケーション起動時にストアへdispatchする。

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

ストアのsubscribeで一覧データが取り出せるようになったので、一覧の描画処理を書き換える。
アプリケーション本体から次の部分を廃止する。

```javascript
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
```

`$.ajax`のコールバックでやっていたことをストアのsubscribeに移動する。

```javascript
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
```

これで一覧の描画処理は仮おきしておく。

### FETCHに関しての単体テストを作る

単体テスト用のディレクトリを切って作る。

```
$ vi test/unit/fish-test.js
```

```javascript
const assert = require('power-assert');
import * as fish from '../../src/fish.js';

describe('Fish', function() {

  describe('Action', () => {
    // アクションのテストはここに書く
  });

  describe('Reducer', () => {
    // リデューサのテストはここに書く
  });

});
```

一覧データのアサーションは何度も使うので、assertFishEqualとしてまとめておく。

```javascript
function assertFishEqual(actual, id, name) {
  assert(actual.id === id);
  assert(actual.name === name);
}
```

#### リデューサのFETCHのテスト

まずはリデューサのテストとして、FETCHアクションのテストを追加する。

```javascript
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
```

#### fetchFishesのテスト

fetchFishesアクションのテストはこのままだと書きにくいので、fetch APIを薄くラップして外から渡すように修正する。
`webApi.get(url: string): Promise<Response>`のようなオブジェクトを受け取って使う。

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

### 項目の選択・選択解除アクション

選択をSELECT、選択解除をDESELECTとしてそれぞれ定義する。

```javascript
export const SELECT = 'fishes/select';
export const DESELECT = 'fishes/deselect';
```

選択アクションをselectFishとする。

```javascript
export function selectFish(fish) {
  return {
    type: SELECT,
    payload: {
      fish
    }
  };
}
```

選択解除アクションをdeselectFishとする。

```javascript
export function deselectFish(fish) {
  return {
    type: DESELECT,
    payload: {
      fish
    }
  };
}
```

SELECTとDESELECTのハンドリングをリデューサに追記する。
既存コードのチェックボックスのchangeイベントハンドラの処理からjQuery依存を排除しつつ移植する。

```javascript
export function fishes(state = { fishes: [], selectedItems: [] }, action) {
  const { selectedItems } = state;
  switch (action.type) {
  ...
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

チェックボックスのchangeイベントハンドラではselectFish, deselectFishアクションを使うように修正する。

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

選択・選択解除で更新された状態を反映するためにストアのsubscribe処理を修正する。

selectedItemsからIDで探してチェックボックスの状態に変換できるようにする。
行が追加され続けないように、行を空にしてから追加するようにする。

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

### SELECTとDESELECTに関しての単体テストを追加する

#### リデューサのSELECTのテスト

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
```

#### リデューサのDESELECTのテスト

```javascript
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

#### selectFishのテスト

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
```

#### deselectFishのテスト

```javascript
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



### 全選択・全選択解除アクション


全選択をSELECT_ALL、全選択解除をDESELECT_ALLとしてそれぞれ定義する。

```javascript
export const SELECT_ALL = 'fishes/select/all';
export const DESELECT_ALL = 'fishes/deselect/all';
```

全選択アクションをselectAllとする。

```javascript
export function selectAll() {
  return {
    type: SELECT_ALL
  };
}
```

全選択解除アクションをdeselectAllとする。

```javascript
export function deselectAll() {
  return {
    type: DESELECT_ALL
  };
}
```

SELECT_ALLとDESELECT_ALLのハンドリングをリデューサに追記する。

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

全選択・全選択解除チェックボックスのchangeイベントハンドラではselectAll, deselectAllを使うようにする。

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

### SELECT_ALLとDESELECT_ALLに関しての単体テストを追加する

#### リデューサのSELECT_ALLのテスト

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
```

#### リデューサのDESELECT_ALLのテスト

```javascript
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

#### selectAllのテスト

```javascript
    describe('#selectAll', () => {

      it('SELECT_ALLをtypeとして返す', () => {
        const { type } = fish.selectAll();
        assert(type === fish.SELECT_ALL);
      });

    });
```

#### deselectAllのテスト

```javascript
    describe('#deselectAll', () => {

      it('DESELECT_ALLをtypeとして返す', () => {
        const { type } = fish.deselectAll();
        assert(type === fish.DESELECT_ALL);
      });

    });

```

### 決定処理の修正

"けってい"ボタンのクリックイベントを修正する。selectedItems変数を使わずにストアから状態を取得して処理する。

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

fishesとselectedItems変数が不要になったので削除し、subscribe内でストアから取得した状態のみ使うようにする。

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

### 動作確認

単体テストは最終的に次のようになる。

```
$ npm run -s mocha test/unit/fish-test.js

  Fish
    Action
      #fetchFishes
        ✓ fishes.jsonを取得する
        ✓ FETCHをtypeとして返す
        ✓ 一覧データをpayloadとして返す
      #selectFish
        ✓ SELECTをtypeとして返す
        ✓ 選択された行データをpayloadとして返す
      #deselectFish
        ✓ DESELECTをtypeとして返す
        ✓ 選択解除された行データをpayloadとして返す
      #selectAll
        ✓ SELECT_ALLをtypeとして返す
      #deselectAll
        ✓ DESELECT_ALLをtypeとして返す
    Reducer
      FETCH アクション
        ✓ payloadのfishesをstateに取り込んで返す
      SELECT アクション
        ✓ payloadの選択データを選択アイテムに追加して返す
        選択データと同じ選択アイテムがすでにある場合
          ✓ 重複をまとめたうえで選択アイテムに追加して返す
      DESELECT アクション
        ✓ payloadの選択解除データを選択アイテムから削除して返す
      SELECT_ALL アクション
        ✓ 一覧データを全て選択アイテムにして返す
      DESELECT_ALL アクション
        ✓ 選択アイテムを全て解除して返す


  15 passing (139ms)
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

Reduxを導入してプレゼンテーションとドメインを分けて、単体テストを追加した。
