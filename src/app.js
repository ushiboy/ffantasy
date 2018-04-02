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

store.dispatch(fish.fetchFishes(webApi));

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
