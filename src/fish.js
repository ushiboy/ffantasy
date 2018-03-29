export const FETCH = 'fishes/fetch';
export const SELECT = 'fishes/select';
export const DESELECT = 'fishes/deselect';

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
