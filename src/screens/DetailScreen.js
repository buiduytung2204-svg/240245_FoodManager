import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { P } from '../domain/dishes.cjs';
import { dishName, categoryName } from '../localization/content.cjs';
import { saveDish } from '../repositories';
import { styles as s, Button, Photo } from '../components';
export default function DetailScreen({
  id,
  data,
  t,
  language,
  navigate,
  remove,
  perform
}) {
  const dish = data.dishes.find(d => d[P + 'Id'] === id);
  if (!dish) return <Text style={s.content}>{t('notFound')}</Text>;
  const images = data.images.filter(i => i[P + 'DishId'] === id);
  return <ScrollView contentContainerStyle={s.content}>
  <Text style={s.title}>{dishName(dish, language)}</Text>
  <Text style={s.subtitle}>{dish[P + 'Price'].toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND</Text>
  <Text style={s.text}>{categoryName(data.categories.find(c => c[P + 'Id'] === dish[P + 'DishCategoryId']), language)}</Text>
  <Text style={s.text}>{dish[P + 'PreparationTime']} {t('minutes')} · {t(dish[P + 'PreparationTime'] <= 15 ? 'quick' : 'regular')}</Text>
  <Text style={s.text}>{t(dish[P + 'IsAvailable'] ? 'available' : 'unavailable')} · {t(dish[P + 'IsSynced'] ? 'synced' : 'unsynced')}</Text>
  <Text style={s.text}>{dish[P + 'Description']}</Text>
  <View style={s.row}><Button title={t('edit')} onPress={() => navigate({
        name: 'form',
        id
      })} /><Button danger title={t('remove')} onPress={() => remove(id)} /></View>
  <Text style={s.subtitle}>{t('images')}</Text>
  {!images.length && <Text>{t('noImages')}</Text>}
  {images.map(i => <View style={s.card} key={i[P + 'Id']}><Photo uri={i[P + 'ImageUrl']} t={t} />{i[P + 'IsThumbnail'] ? <Text>{t('thumbnail')}</Text> : <Button title={t('makeThumbnail')} onPress={() => perform(() => saveDish(dish, images.map(x => ({
        ...x,
        [P + 'IsThumbnail']: x[P + 'Id'] === i[P + 'Id'] ? 1 : 0
      })), id))} />}</View>)}
 </ScrollView>;
}
