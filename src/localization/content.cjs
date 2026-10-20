// Translate the built-in catalog at display time. Existing databases work
// immediately; renamed dishes and user-created records keep their own names.
const catalog = {
  dish: {
    'dish-1': ['Beef Pho', 'Phở bò'],
    'dish-2': ['Chicken rice', 'Cơm gà'],
    'dish-3': ['Spring rolls', 'Chả giò'],
    'dish-4': ['Mango pudding', 'Pudding xoài'],
    'dish-5': ['Iced coffee', 'Cà phê đá']
  },
  category: {
    'category-1': ['Main courses', 'Món chính'],
    'category-2': ['Desserts', 'Món tráng miệng'],
    'category-3': ['Drinks', 'Đồ uống']
  }
};
const key = name => String(name ?? '').normalize('NFKC').trim().toLowerCase();
function translations(record, type) {
  const names = catalog[type][record?.['240245_Id']];
  return names?.some(name => key(name) === key(record?.['240245_Name'])) ? names : null;
}
function contentName(record, language, type) {
  return translations(record, type)?.[language === 'vi' ? 1 : 0] ?? record?.['240245_Name'] ?? '';
}
const dishName = (record, language) => contentName(record, language, 'dish');
const categoryName = (record, language) => contentName(record, language, 'category');
const dishSearchNames = record => translations(record, 'dish') || [record?.['240245_Name'] ?? ''];
// Both language variants denote the same dish for duplicate-name validation.
function dishNameKey(name) {
  const names = Object.values(catalog.dish).find(pair => pair.some(n => key(n) === key(name)));
  return key(names ? names[0] : name);
}
module.exports = {
  dishName,
  categoryName,
  dishSearchNames,
  dishNameKey
};
