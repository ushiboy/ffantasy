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
