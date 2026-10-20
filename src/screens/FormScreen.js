import React, { useState } from 'react';
import { ScrollView, Text, View, Switch } from 'react-native';
import { P } from '../domain/dishes.cjs';
import { dishName, categoryName } from '../localization/content.cjs';
import { saveDish } from '../repositories';
import { uid } from '../database/helpers';
import { styles as s, Button, Field, Choices, Photo } from '../components';
export default function FormScreen({
  id,
  data,
  t,
  language,
  perform,
  navigate
}) {
  const existing = data.dishes.find(d => d[P + 'Id'] === id);
  const [form, setForm] = useState(() => existing ? {
    ...existing,
    [P + 'Price']: String(existing[P + 'Price']),
    [P + 'PreparationTime']: String(existing[P + 'PreparationTime'])
  } : {
    [P + 'Name']: '',
    [P + 'Price']: '',
    [P + 'PreparationTime']: '',
    [P + 'Description']: '',
    [P + 'DishCategoryId']: data.categories[0]?.[P + 'Id'] || '',
    [P + 'IsAvailable']: 1
  });
  const [images, setImages] = useState(() => data.images.filter(i => i[P + 'DishId'] === id));
  const [url, setUrl] = useState(''),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(f => ({
    ...f,
    [P + key]: value
  }));
  if (id && !existing) return <Text style={s.content}>{t('notFound')}</Text>;
  const save = async () => {
    if (saving) return;
    setSaving(true);
    let savedId;
    const ok = await perform(async () => {
      savedId = await saveDish(form, images, id);
    });
    if (ok) navigate({
      name: 'detail',
      id: savedId
    });
    setSaving(false);
  };
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
  <Text style={s.title}>{t(id ? 'editDish' : 'newDish')}</Text>
  {['Name', 'Price', 'PreparationTime', 'Description'].map((k, n) => <Field key={k} label={t(['name', 'price', 'time', 'description'][n])} value={k === 'Name' ? dishName(form, language) : form[P + k]} onChangeText={v => set(k, v)} keyboardType={n === 1 || n === 2 ? 'decimal-pad' : 'default'} multiline={n === 3} />)}
  <Text style={s.subtitle}>{t('category')}</Text>
  {!data.categories.length && <Text style={s.error}>{t('noCategories')}</Text>}
  <Choices value={form[P + 'DishCategoryId']} onChange={v => set('DishCategoryId', v)} items={data.categories.map(c => [c[P + 'Id'], categoryName(c, language)])} />
  <View style={s.row}><Text>{t('available')}</Text><Switch accessibilityLabel={t('available')} value={!!form[P + 'IsAvailable']} onValueChange={v => set('IsAvailable', v ? 1 : 0)} /></View>
  <Text style={s.subtitle}>{t('images')}</Text>
  <Field label={t('imageUrl')} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
  {!!error && <Text style={s.error}>{t(error)}</Text>}
  <Button title={t('addImage')} onPress={() => {
      if (!/^https?:\/\/[^\s]+$/i.test(url.trim())) {
        setError('invalidUrl');
        return;
      }
      setImages(a => [...a, {
        [P + 'Id']: uid(),
        [P + 'ImageUrl']: url.trim(),
        [P + 'IsThumbnail']: a.length ? 0 : 1
      }]);
      setUrl('');
      setError('');
    }} />
  {images.map(i => <View key={i[P + 'Id']} style={s.card}><Photo uri={i[P + 'ImageUrl']} t={t} /><View style={s.row}><Button title={t(i[P + 'IsThumbnail'] ? 'thumbnail' : 'makeThumbnail')} onPress={() => setImages(a => a.map(x => ({
          ...x,
          [P + 'IsThumbnail']: x[P + 'Id'] === i[P + 'Id'] ? 1 : 0
        })))} /><Button danger title={t('remove')} onPress={() => setImages(a => a.filter(x => x[P + 'Id'] !== i[P + 'Id']))} /></View></View>)}
  <Button disabled={saving || !data.categories.length} title={t('save')} onPress={save} />
 </ScrollView>;
}
