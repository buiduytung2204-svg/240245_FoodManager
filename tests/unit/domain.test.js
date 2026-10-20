const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  P,
  validateDish,
  filterDishes
} = require('../../src/domain/dishes.cjs');
const categories = [{
  [P + 'Id']: 'c1'
}, {
  [P + 'Id']: 'c2'
}];
const make = (id, name, category, price, time, available = 1) => ({
  [P + 'Id']: id,
  [P + 'Name']: name,
  [P + 'DishCategoryId']: category,
  [P + 'Price']: price,
  [P + 'PreparationTime']: time,
  [P + 'IsAvailable']: available
});
const dishes = [make('d1', 'Pho', 'c1', 50, 20), make('d2', 'Rice', 'c1', 30, 10, 0), make('d3', 'Pho', 'c2', 20, 5)];
test('required fields, finite positive numbers and existing category', () => {
  for (const [key, value, error] of [['Name', '  ', 'nameRequired'], ['Price', 0, 'invalidPrice'], ['Price', Infinity, 'invalidPrice'], ['PreparationTime', -2, 'invalidTime'], ['DishCategoryId', 'missing', 'invalidCategory']]) assert.throws(() => validateDish({
    ...dishes[0],
    [P + key]: value
  }, categories, [], null), {
    message: error
  });
});
test('normalized duplicate within category, edit self and cross-category name', () => {
  assert.throws(() => validateDish({
    ...dishes[0],
    [P + 'Name']: ' PHO '
  }, categories, dishes), {
    message: 'duplicate'
  });
  assert.doesNotThrow(() => validateDish(dishes[0], categories, dishes, 'd1'));
  assert.doesNotThrow(() => validateDish({
    ...dishes[0],
    [P + 'DishCategoryId']: 'c2'
  }, categories, [dishes[0]]));
});
const base = {
  search: '',
  category: '',
  available: 'all',
  min: '',
  max: '',
  sort: 'asc'
};
test('search, category, availability and price filters combine', () => {
  assert.deepEqual(filterDishes(dishes, {
    ...base,
    search: 'PH',
    category: 'c1',
    available: '1',
    min: '40',
    max: '60'
  }).map(d => d[P + 'Id']), ['d1']);
  assert.equal(filterDishes(dishes, base).length, 3);
  assert.equal(filterDishes(dishes, {
    ...base,
    available: '1'
  }).length, 2);
});
test('sorting and invalid ranges', () => {
  assert.deepEqual(filterDishes(dishes, {
    ...base,
    sort: 'desc'
  }).map(d => d[P + 'Id']), ['d1', 'd2', 'd3']);
  assert.deepEqual(filterDishes(dishes, {
    ...base,
    sort: 'time'
  }).map(d => d[P + 'Id']), ['d3', 'd2', 'd1']);
  for (const range of [{
    min: '100',
    max: '1'
  }, {
    min: 'x'
  }, {
    max: '-1'
  }]) assert.throws(() => filterDishes(dishes, {
    ...base,
    ...range
  }), {
    message: 'invalidRange'
  });
});
