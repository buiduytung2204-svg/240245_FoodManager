import React from 'react';
import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Button, styles as s } from '../components';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useFoodManager } from '../hooks/useFoodManager';
import { AppNavigator } from '../navigation/AppNavigator';
export default function FoodManagerApp() {
  const {
    route,
    navigate,
    back
  } = useAppNavigation();
  const manager = useFoodManager(navigate);
  const {
    data,
    t,
    bootError
  } = manager;
  return <SafeAreaProvider>
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView style={{
        flex: 1
      }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppHeader t={t} data={data} status={manager.status} route={route} onBack={back} onToggleLanguage={manager.toggleLanguage} />
        {data ? <AppNavigator route={route} navigate={navigate} manager={manager} /> : bootError ? <View style={s.content}>
            <Text>{t('unexpected')}</Text>
            <Button title={t('retry')} onPress={manager.retryBoot} />
          </View> : <ActivityIndicator style={{
          marginTop: 40
        }} accessibilityLabel={t('loading')} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </SafeAreaProvider>;
}
