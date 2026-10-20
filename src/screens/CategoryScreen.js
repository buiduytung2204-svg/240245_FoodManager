import React, { useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { P } from '../domain/dishes.cjs';
import { categoryName } from '../localization/content.cjs';
import { saveCategory, deleteCategory } from '../repositories';
import { styles as s, Button, Field } from '../components';
export default function CategoryScreen({
  data,
  t,
  language,
  perform
}) {
  const [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [saving, setSaving] = useState(false);
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
  <Text style={s.title}>{t('categories')}</Text>
  {!data.categories.length && <Text style={s.muted}>{t('noCategories')}</Text>}
  {data.categories.map(c => <View key={c[P + 'Id']} style={s.card}><Text style={s.subtitle}>{categoryName(c, language)}</Text><Text>{c[P + 'Description']}</Text><Text>{data.dishes.filter(d => d[P + 'DishCategoryId'] === c[P + 'Id']).length} {t('list')}</Text><Button danger title={t('remove')} onPress={() => Alert.alert(t('confirm'), t('deleteQuestion'), [{
        text: t('cancel'),
        style: 'cancel'
      }, {
        text: t('remove'),
        style: 'destructive',
        onPress: () => perform(() => deleteCategory(c[P + 'Id']))
      }])} /></View>)}
  <Text style={s.subtitle}>{t('addCategory')}</Text><Field label={t('name')} value={name} onChangeText={setName} /><Field label={t('description')} value={description} onChangeText={setDescription} />
  <Button title={t('save')} disabled={saving} onPress={async () => {
      if (saving) return;
      setSaving(true);
      await perform(async () => {
        await saveCategory(name, description);
        setName('');
        setDescription('');
      });
      setSaving(false);
    }} />
 </ScrollView>;
}
