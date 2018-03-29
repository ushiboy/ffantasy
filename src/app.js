import $ from 'jquery';
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import * as fish from './fish.js';

var fishes = [];
var selectedItems = [];

const webApi = {
  get(url) {
    return fetch(url);
  }
};

const store = createStore(fish.fishes, applyMiddleware(promiseMiddleware));
store.subscribe(() => {
  fishes = store.getState().fishes;

  const $fishesList = $('#fishes-list');

  $.each(fishes, function(i, r) {
    $fishesList.append(
      $('<tr />')
        .append($('<td />').append($('<input type="checkbox" class="select-row" />').data(r)))
        .append($('<td />').text(r.name))
    );
  });
});

store.dispatch(fish.fetchFishes(webApi));

$('#all-check').change(function() {
  var forceStatus = $(this).prop('checked');
  $('.select-row').each(function(i, r) {
    $(r).prop('checked', forceStatus);
    $(r).change();
  });
});

$('#fishes-list').on('change', '.select-row', function() {
  var $check = $(this);
  var rowData = $check.data();
  if (!$check.prop('checked')) {
    var temp = [];
    $.each(selectedItems, function(i, r) {
      if (rowData.id !== r.id) {
        temp.push(r);
      }
    });
    selectedItems = temp;
  } else {
    var exist = false;
    $.each(selectedItems, function(i, r) {
      if (rowData.id === r.id) {
        exist = true;
        return false;
      }
    });

    if (!exist) {
      selectedItems.push(rowData);
    }
    selectedItems.sort(function(a, b) {
      return a.id - b.id;
    });
  }

  $('#all-check').prop('checked', selectedItems.length === fishes.length);
});

$('#select-button').click(function() {
  if (selectedItems.length > 0) {
    var names = [];
    $.each(selectedItems, function(i, r) {
      names.push(r.name);
    });
    alert(names.join(','));
  } else {
    alert('せんたくしてください');
  }
});
