import React from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { P, filterDishes } from '../domain/dishes.cjs';
import { dishName, categoryName, dishSearchNames } from '../localization/content.cjs';
import { styles as s, Button, Choices, Photo } from '../components';
export default function ListScreen({
  data,
  filters,
  setFilters,
  navigate,
  t,
  language
}) {
  const change = (key, value) => setFilters(f => ({
    ...f,
    [key]: value
  }));
  let rows = [],
    error = '';
  try {
    rows = filterDishes(data.dishes, filters, dishSearchNames);
  } catch (e) {
    error = t(e.message);
  }
  const header = <View style={{
    gap: 12
  }}>
  <Text style={s.title}>{t('list')}</Text>
  <View style={s.row}><Button title={t('add')} onPress={() => navigate({
        name: 'form'
      })} /><Button title={t('categories')} onPress={() => navigate({
        name: 'categories'
      })} /></View>
  <Button title={t('serverSettings')} onPress={() => navigate({
      name: 'settings'
    })} />
  <TextInput accessibilityLabel={t('search')} placeholder={t('search')} style={s.input} value={filters.search} onChangeText={v => change('search', v)} />
  <Choices value={filters.category} onChange={v => change('category', v)} items={[['', t('all')], ...data.categories.map(c => [c[P + 'Id'], categoryName(c, language)])]} />
  <Choices value={filters.available} onChange={v => change('available', v)} items={[['all', t('all')], ['1', t('available')], ['0', t('unavailable')]]} />
  <View style={s.row}>{['min', 'max'].map(k => <TextInput key={k} accessibilityLabel={t(k)} placeholder={t(k)} keyboardType="decimal-pad" value={filters[k]} onChangeText={v => change(k, v)} style={[s.input, {
        flex: 1
      }]} />)}</View>
  <Choices value={filters.sort} onChange={v => change('sort', v)} items={[['asc', t('asc')], ['desc', t('desc')], ['time', t('timeSort')]]} />
  <Button title={t('reset')} onPress={() => setFilters({
      search: '',
      category: '',
      available: 'all',
      min: '',
      max: '',
      sort: 'asc'
    })} />
  {!!error && <Text style={s.error}>{error}</Text>}
 </View>;
  return <FlatList contentContainerStyle={s.content} data={rows} keyExtractor={d => d[P + 'Id']} ListHeaderComponent={header} ListEmptyComponent={<Text style={s.muted}>{!error && t('empty')}</Text>} renderItem={({
    item: d
  }) => {
    const image = data.images.find(i => i[P + 'DishId'] === d[P + 'Id'] && i[P + 'IsThumbnail']);
    return <Pressable accessibilityRole="button" onPress={() => navigate({
      name: 'detail',
      id: d[P + 'Id']
    })} style={s.card}>
    {image && <Photo key={image[P + 'ImageUrl']} uri={image[P + 'ImageUrl']} t={t} />}
    <Text style={s.subtitle}>{dishName(d, language)}</Text><Text style={s.text}>{Number(d[P + 'Price']).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND · {d[P + 'PreparationTime']} {t('minutes')}</Text>
    <Text style={s.muted}>{categoryName(data.categories.find(c => c[P + 'Id'] === d[P + 'DishCategoryId']), language)} · {t(d[P + 'IsAvailable'] ? 'available' : 'unavailable')} · {t(d[P + 'PreparationTime'] <= 15 ? 'quick' : 'regular')}</Text>
    <Text style={s.muted}>{t(d[P + 'IsSynced'] ? 'synced' : 'unsynced')}</Text>
   </Pressable>;
  }} />;
}
