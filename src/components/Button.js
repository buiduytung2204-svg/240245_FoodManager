import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '../theme/styles';
export function Button({
  title,
  onPress,
  danger,
  disabled
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} disabled={disabled} style={[styles.button, danger && styles.danger, disabled && {
    opacity: 0.45
  }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
