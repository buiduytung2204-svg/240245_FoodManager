import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../theme/styles';
export function Choices({
  items,
  value,
  onChange
}) {
  return <View style={styles.row}>{items.map(([id, label]) => <Pressable accessibilityRole="button" accessibilityState={{
      selected: value === id
    }} key={id} onPress={() => onChange(id)} style={[styles.chip, value === id && styles.selected]}><Text style={styles.text}>{label}</Text></Pressable>)}</View>;
}
