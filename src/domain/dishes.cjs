const {
  P
} = require('../models/fields.cjs');
const {
  dishNameKey
} = require('../localization/content.cjs');
const normalize = s => String(s ?? '').normalize('NFKC').trim().toLocaleLowerCase('en-US');
function validateDish(d, categories, dishes, id) {
  if (!String(d[P + 'Name'] ?? '').trim()) throw Error('nameRequired');
  for (const field of ['Price', 'PreparationTime']) {
    if (!Number.isFinite(Number(d[P + field])) || Number(d[P + field]) <= 0) throw Error(field === 'Price' ? 'invalidPrice' : 'invalidTime');
  }
  if (!categories.some(c => c[P + 'Id'] === d[P + 'DishCategoryId'])) throw Error('invalidCategory');
  if (dishes.some(x => x[P + 'Id'] !== id && x[P + 'DishCategoryId'] === d[P + 'DishCategoryId'] && dishNameKey(x[P + 'Name']) === dishNameKey(d[P + 'Name']))) throw Error('duplicate');
}
function filterDishes(dishes, f, searchNames = d => [d[P + 'Name']]) {
  const min = f.min.trim() === '' ? null : Number(f.min),
    max = f.max.trim() === '' ? null : Number(f.max);
  if (min !== null && (!Number.isFinite(min) || min < 0) || max !== null && (!Number.isFinite(max) || max < 0) || min !== null && max !== null && min > max) throw Error('invalidRange');
  const searchKey = text => normalize(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  return dishes.filter(d => searchNames(d).some(name => searchKey(name).includes(searchKey(f.search))) && (!f.category || d[P + 'DishCategoryId'] === f.category) && (f.available === 'all' || d[P + 'IsAvailable'] === Number(f.available)) && (min === null || d[P + 'Price'] >= min) && (max === null || d[P + 'Price'] <= max)).sort((a, b) => f.sort === 'time' ? a[P + 'PreparationTime'] - b[P + 'PreparationTime'] : (a[P + 'Price'] - b[P + 'Price']) * (f.sort === 'desc' ? -1 : 1));
}
module.exports = {
  P,
  normalize,
  validateDish,
  filterDishes
};
