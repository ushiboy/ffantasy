import 'babel-polyfill';
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

const { selectFish, deselectFish, selectAll, deselectAll, fetchFishes } = fish;

function mapStateToProps(state) {
  const { fishes, selectedItems } = state;
  return {
    fishes,
    selectedItems
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      fetchFishes: () => fetchFishes(webApi),
      selectFish,
      deselectFish,
      selectAll,
      deselectAll
    }, dispatch)
  };
}

const ConnectedFishList = connect(mapStateToProps, mapDispatchToProps)(FishList);

const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));

ReactDOM.render(
  <Provider store={store}>
    <ConnectedFishList />
  </Provider>,
  document.querySelector('.app')
);
