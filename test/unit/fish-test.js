const assert = require('power-assert');
import * as fish from '../../src/fish.js';

function assertFishEqual(actual, id, name) {
  assert(actual.id === id);
  assert(actual.name === name);
}

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


describe('Fish', function() {

  describe('Action', () => {

    describe('#fetchFishes', () => {
      const response = {
        fishes: [
          { 'id': 1, 'name': 'まぐろ' }
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

  });

  describe('Reducer', () => {

    describe('FETCH アクション', () => {

      let initState;
      let fishes;
      const action = {
        type: fish.FETCH,
        payload: {
          fishes: [
            { 'id': 1, 'name': 'まぐろ' }
          ]
        }
      };

      beforeEach(() => {
        initState = {
          fishes: [],
          selectedItems: []
        };
        fishes = fish.fishes(initState, action).fishes;
      });

      it('payloadのfishesをstateに取り込んで返す', () => {
        assert(fishes.length === 1);
        assertFishEqual(fishes[0], 1, 'まぐろ');
      });

      it('前の状態の一覧データは変更されない', () => {
        assert(initState.fishes.length === 0);
      });

    });

    describe('SELECT アクション', () => {

      let initState;
      const action = {
        type: fish.SELECT,
        payload: {
          fish: { 'id': 3, 'name': 'かつお' }
        }
      };

      beforeEach(() => {
        initState = {
          fishes: [],
          selectedItems: [
            { 'id': 1, 'name': 'まぐろ' },
            { 'id': 2, 'name': 'はまち' }
          ]
        };
      });

      it('payloadの選択データを選択アイテムに追加して返す', () => {
        const { selectedItems } = fish.fishes(initState, action);
        assert(selectedItems.length === 3);
        assertFishEqual(selectedItems[0], 1, 'まぐろ');
        assertFishEqual(selectedItems[1], 2, 'はまち');
        assertFishEqual(selectedItems[2], 3, 'かつお');
      });

      it('前の状態の選択アイテムは変更されない', () => {
        fish.fishes(initState, action);
        assert(initState.selectedItems.length === 2);
      });

      context('選択データと同じ選択アイテムがすでにある場合', () => {

        it('重複をまとめたうえで選択アイテムに追加して返す', () => {
          const alreadySelectedPayloadAction = {
            type: fish.SELECT,
            payload: {
              fish: { 'id': 1, 'name': 'まぐろ' }
            }
          };
          const { selectedItems } = fish.fishes(initState, alreadySelectedPayloadAction);
          assert(selectedItems.length === 2);
          assertFishEqual(selectedItems[0], 1, 'まぐろ');
          assertFishEqual(selectedItems[1], 2, 'はまち');
        });
      });

    });

    describe('DESELECT アクション', () => {

      let initState;
      let selectedItems;
      const action = {
        type: fish.DESELECT,
        payload: {
          fish: { 'id': 1, 'name': 'まぐろ' }
        }
      };

      beforeEach(() => {
        initState = {
          fishes: [],
          selectedItems: [
            { 'id': 1, 'name': 'まぐろ' },
            { 'id': 2, 'name': 'はまち' }
          ]
        };
        selectedItems = fish.fishes(initState, action).selectedItems;
      });

      it('payloadの選択解除データを選択アイテムから削除して返す', () => {
        assert(selectedItems.length === 1);
        assertFishEqual(selectedItems[0], 2, 'はまち');
      });

      it('前の状態の選択アイテムは変更されない', () => {
        assert(initState.selectedItems.length === 2);
      });

    });

    describe('SELECT_ALL アクション', () => {

      let initState;
      let selectedItems;
      const action = { type: fish.SELECT_ALL };

      beforeEach(() => {
        initState = {
          fishes: [
            { 'id': 1, 'name': 'まぐろ' },
            { 'id': 2, 'name': 'はまち' }
          ],
          selectedItems: []
        };
        selectedItems = fish.fishes(initState, action).selectedItems;
      });

      it('一覧データを全て選択アイテムにして返す', () => {
        assert(selectedItems.length === 2);
        assertFishEqual(selectedItems[0], 1, 'まぐろ');
        assertFishEqual(selectedItems[1], 2, 'はまち');
      });

      it('前の状態の選択アイテムは変更されない', () => {
        assert(initState.selectedItems.length === 0);
      });

    });

    describe('DESELECT_ALL アクション', () => {

      let initState;
      let selectedItems;
      const action = { type: fish.DESELECT_ALL };

      beforeEach(() => {
        initState = {
          fishes: [],
          selectedItems: [
            { 'id': 1, 'name': 'まぐろ' },
            { 'id': 2, 'name': 'はまち' }
          ]
        };
        selectedItems = fish.fishes(initState, action).selectedItems;
      });

      it('選択アイテムを全て解除して返す', () => {
        assert(selectedItems.length === 0);
      });

      it('前の状態の選択アイテムは変更されない', () => {
        assert(initState.selectedItems.length === 2);
      });

    });

  });

});
