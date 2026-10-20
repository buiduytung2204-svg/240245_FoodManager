import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { Button } from './Button';
import { styles } from '../theme/styles';
export function Photo({
  uri,
  t
}) {
  const [failed, setFailed] = useState(false);
  return failed ? <View style={[styles.image, {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  }]}><Text>{t('imageFailed')}</Text><Button title={t('retry')} onPress={() => setFailed(false)} /></View> : <Image accessibilityLabel={t('images')} source={{
    uri
  }} style={styles.image} onError={() => setFailed(true)} />;
}
