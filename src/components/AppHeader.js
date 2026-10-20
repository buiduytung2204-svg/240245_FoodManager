import React from 'react';
import { Text, View } from 'react-native';
import { Button } from './Button';
import { styles as s } from '../theme/styles';
import { PROJECT_NAME } from '../models/fields.cjs';
export function AppHeader({
  t,
  data,
  status,
  route,
  onBack,
  onToggleLanguage
}) {
  return <View style={{
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#dce5d9'
  }}>
    <View style={[s.row, {
      justifyContent: 'space-between'
    }]}>
      <Text style={s.subtitle}>{t('app')}</Text>
      <Button title={t('language')} onPress={onToggleLanguage} disabled={!data} />
    </View>
    <Text style={s.muted}>{PROJECT_NAME} · MSSV: 240245</Text>
    {data && <Text style={s.muted}>{t(status)} · {data.pending} {t('pending')}</Text>}
    {route.name !== 'list' && <Button title={t('back')} onPress={onBack} />}
  </View>;
}
