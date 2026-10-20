import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { styles as s, Button, Field } from '../components';
export default function SettingsScreen({
  t,
  apiUrl,
  configureApi
}) {
  const [url, setUrl] = useState(apiUrl),
    [saving, setSaving] = useState(false);
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
  <Text style={s.title}>{t('serverSettings')}</Text>
  <Text style={s.text}>{t('apiHelp')}</Text>
  <Field label={t('apiUrl')} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
  <Text style={s.muted}>{t('apiResources')}</Text>
  <Text style={s.muted}>{t('apiChangeHelp')}</Text>
  <Button title={t('save')} disabled={saving} onPress={async () => {
      if (saving) return;
      setSaving(true);
      await configureApi(url);
      setSaving(false);
    }} />
 </ScrollView>;
}
