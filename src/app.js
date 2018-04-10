import 'babel-polyfill';
import $ from 'jquery';
import { createStore, applyMiddleware, bindActionCreators } from 'redux';
import promiseMiddleware from 'redux-promise';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { FishList } from './component.js';
import * as fish from './fish.js';

const webApi = {
  get(url) {
    return fetch(url);
  }
};

const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));

const ConnectedFishList = connect(({ fishes, selectedItems }) => ({
  fishes,
  selectedItems
}), (dispatch) => ({
  actions: Object.assign({
    fetchFishes: bindActionCreators(() => fish.fetchFishes(webApi), dispatch)
  },
  bindActionCreators({
    selectFish: fish.selectFish,
    deselectFish: fish.deselectFish
  }, dispatch))
}))(FishList);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedFishList />
  </Provider>,
  document.querySelector('.app')
);


$('#all-check').change(function() {
  const forceStatus = $(this).prop('checked');
  if (forceStatus) {
    store.dispatch(fish.selectAll());
  } else {
    store.dispatch(fish.deselectAll());
  }
});

$('#fishes-list').on('change', '.select-row', function() {
  const $check = $(this);
  const rowData = $check.data();
  if (!$check.prop('checked')) {
    store.dispatch(fish.deselectFish(rowData));
  } else {
    store.dispatch(fish.selectFish(rowData));
  }
});

$('#select-button').click(function() {
  const { selectedItems } = store.getState();
  if (selectedItems.length > 0) {
    const names = selectedItems.map(r => r.name);
    alert(names.join(','));
  } else {
    alert('せんたくしてください');
  }
});
