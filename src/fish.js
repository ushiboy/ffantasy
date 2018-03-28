export const FETCH = 'fishes/fetch';

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
