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

    describe('#selectFish', () => {

      it('選択された行データをpayloadとして返す', () => {
        const { type, payload } = fish.selectFish({
          'id': 1,
          'name': 'まぐろ'
        });
        assert(type === fish.SELECT);
        assertFishEqual(payload.fish, 1, 'まぐろ');
      });

    });

    describe('#deselectFish', () => {

      it('選択解除された行データをpayloadとして返す', () => {
        const { type, payload } = fish.deselectFish({
          'id': 1,
          'name': 'まぐろ'
        });
        assert(type === fish.DESELECT);
        assertFishEqual(payload.fish, 1, 'まぐろ');
      });

    });

    describe('#selectAll', () => {

      it('SELECT_ALLタイプを返す', () => {
        const { type } = fish.selectAll();
        assert(type === fish.SELECT_ALL);
      });

    });

    describe('#deselectAll', () => {

      it('DESELECT_ALLタイプを返す', () => {
        const { type } = fish.deselectAll();
        assert(type === fish.DESELECT_ALL);
      });

    });

  });

  describe('reducer', () => {

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

  });

});
