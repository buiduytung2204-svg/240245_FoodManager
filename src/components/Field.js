import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '../theme/styles';
export function Field({
  label,
  ...props
}) {
  return <View style={{
    gap: 6
  }}><Text style={styles.text}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} {...props} /></View>;
}
