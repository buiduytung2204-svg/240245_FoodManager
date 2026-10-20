const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  dishName,
  categoryName,
  dishSearchNames
} = require('../../src/localization/content.cjs');
const {
  P,
  filterDishes,
  validateDish
} = require('../../src/domain/dishes.cjs');
const record = (id, name) => ({
  [P + 'Id']: id,
  [P + 'Name']: name,
  [P + 'DishCategoryId']: 'category-1',
  [P + 'Price']: 50000,
  [P + 'PreparationTime']: 10,
  [P + 'IsAvailable']: 1
});
const filters = {
  search: '',
  category: '',
  available: 'all',
  min: '',
  max: '',
  sort: 'asc'
};
test('all UI messages have both languages; unknown storage/API errors fall back to the chosen language', () => {
  const fs = require('node:fs'),
    path = require('node:path'),
    vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname, '../../src/localization/index.js'), 'utf8').replace(/export /g, '');
  const context = vm.createContext({});
  vm.runInContext(source + '\nthis.api={en,vi,translate};', context);
  assert.deepEqual(Object.keys(context.api.en).sort(), Object.keys(context.api.vi).sort());
  assert.equal(context.api.translate('vi')('SQLITE_CONSTRAINT: an unknown error'), context.api.vi.unexpected);
  assert.equal(context.api.translate('en')('HTTP 500'), context.api.en.unexpected);
});
test('all seed dishes and categories switch between English and Vietnamese', () => {
  const names = [['Beef Pho', 'Phở bò'], ['Chicken rice', 'Cơm gà'], ['Spring rolls', 'Chả giò'], ['Mango pudding', 'Pudding xoài'], ['Iced coffee', 'Cà phê đá']];
  names.forEach(([en, vi], i) => {
    const dish = Object.freeze(record(`dish-${i + 1}`, en));
    assert.equal(dishName(dish, 'vi'), vi);
    assert.equal(dishName(dish, 'en'), en);
    assert.equal(dish[P + 'Name'], en); // Toggling display never changes SQLite/outbox content.
    assert.equal(dishName(record(`dish-${i + 1}`, vi), 'en'), en);
  });
  [['Main courses', 'Món chính'], ['Desserts', 'Món tráng miệng'], ['Drinks', 'Đồ uống']].forEach(([en, vi], i) => {
    assert.equal(categoryName(record(`category-${i + 1}`, en), 'vi'), vi);
    assert.equal(categoryName(record(`category-${i + 1}`, en), 'en'), en);
  });
});
test('custom and renamed records retain their entered names', () => {
  assert.equal(dishName(record('dish-1', 'My special Pho'), 'vi'), 'My special Pho');
  assert.equal(dishName(record('custom-id', 'Beef Pho'), 'vi'), 'Beef Pho');
  assert.equal(categoryName(record('custom-category', 'Drinks'), 'vi'), 'Drinks');
  assert.equal(dishName(undefined, 'vi'), '');
});
test('search matches either language with or without Vietnamese accents while combining filters', () => {
  const dishes = [record('dish-2', 'Chicken rice'), record('dish-5', 'Iced coffee')];
  for (const search of ['Cơm gà', 'com ga', 'CHICKEN']) {
    assert.deepEqual(filterDishes(dishes, {
      ...filters,
      search,
      category: 'category-1',
      available: '1',
      min: '10000',
      max: '60000'
    }, dishSearchNames).map(d => d[P + 'Id']), ['dish-2']);
  }
  assert.equal(filterDishes(dishes, {
    ...filters,
    search: 'ca phe da'
  }, dishSearchNames)[0][P + 'Id'], 'dish-5');
  const renamed = record('dish-2', 'Custom recipe');
  assert.equal(filterDishes([renamed], {
    ...filters,
    search: 'com ga'
  }, dishSearchNames).length, 0);
});
test('bilingual aliases cannot create duplicate dish names in the same category', () => {
  const dish = record('dish-1', 'Beef Pho');
  assert.throws(() => validateDish(record('new', 'Phở bò'), [record('category-1', 'Main courses')], [dish]), {
    message: 'duplicate'
  });
  assert.doesNotThrow(() => validateDish({
    ...dish,
    [P + 'Name']: 'Phở bò'
  }, [record('category-1', 'Main courses')], [dish], 'dish-1'));
});
