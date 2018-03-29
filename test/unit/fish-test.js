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
