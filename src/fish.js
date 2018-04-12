export const FETCH = 'fishes/fetch';
export const SELECT = 'fishes/select';
export const DESELECT = 'fishes/deselect';
export const SELECT_ALL = 'fishes/select/all';
export const DESELECT_ALL = 'fishes/deselect/all';

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
    const s = selectedItems.concat();
    if (!s.find(r => {
      return r.id === fish.id;
    })) {
      s.push(fish);
    }
    return Object.assign({}, state, {
      selectedItems: s.sort((a, b) => {
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
