import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { initDatabase } from '../database';
import { readData, getLanguage, setLanguage, deleteDish, getApiUrl, setApiUrl } from '../repositories';
import { validateApiUrl } from '../config/api.cjs';
import { startSync } from '../services/sync/syncService';
import { translate } from '../localization';

// Coordinates application state and side effects. Screens receive actions and
// view data; SQLite transactions and HTTP stay in their own layers.
export function useFoodManager(navigate) {
  const [data, setData] = useState(null);
  const [language, setLang] = useState('en');
  const [status, setStatus] = useState('offline');
  const [bootError, setBootError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [apiUrl, setConfiguredUrl] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    available: 'all',
    min: '',
    max: '',
    sort: 'asc'
  });
  const sync = useRef(null);
  const mounted = useRef(true);
  const t = translate(language);
  const refresh = async () => {
    const snapshot = await readData();
    if (mounted.current) setData(snapshot);
  };
  useEffect(() => {
    mounted.current = true;
    let active = true;
    (async () => {
      try {
        await initDatabase();
        const lang = await getLanguage();
        const url = (await getApiUrl()) ?? process.env.EXPO_PUBLIC_MOCKAPI_URL ?? '';
        if (!active) return;
        setLang(lang === 'vi' ? 'vi' : 'en');
        setConfiguredUrl(url);
        await refresh();
        if (active) {
          sync.current = startSync(value => {
            if (active) setStatus(value);
          }, refresh, url);
        }
      } catch {
        if (active) setBootError(true);
      }
    })();
    return () => {
      active = false;
      mounted.current = false;
      sync.current?.stop();
    };
  }, [attempt]);
  const perform = async action => {
    try {
      await action();
      await refresh();
      void sync.current?.kick();
      return true;
    } catch (error) {
      Alert.alert(t('error'), t(error.message));
      return false;
    }
  };
  const configureApi = async value => {
    let url;
    try {
      url = validateApiUrl(value);
    } catch (error) {
      Alert.alert(t('error'), t(error.message));
      return;
    }
    if (url === apiUrl) {
      navigate({
        name: 'list'
      });
      return;
    }
    sync.current?.stop();
    try {
      await setApiUrl(url);
      setConfiguredUrl(url);
      await refresh();
      sync.current = startSync(setStatus, refresh, url);
      navigate({
        name: 'list'
      });
    } catch (error) {
      sync.current = startSync(setStatus, refresh, apiUrl);
      Alert.alert(t('error'), t(error.message));
    }
  };
  const remove = id => Alert.alert(t('confirm'), t('deleteQuestion'), [{
    text: t('cancel'),
    style: 'cancel'
  }, {
    text: t('remove'),
    style: 'destructive',
    onPress: () => perform(async () => {
      await deleteDish(id);
      navigate({
        name: 'list'
      });
    })
  }]);
  const toggleLanguage = () => perform(async () => {
    const next = language === 'en' ? 'vi' : 'en';
    await setLanguage(next);
    setLang(next);
  });
  const retryBoot = () => {
    setBootError(false);
    setAttempt(value => value + 1);
  };
  return {
    data,
    language,
    status,
    bootError,
    apiUrl,
    filters,
    setFilters,
    t,
    perform,
    configureApi,
    remove,
    toggleLanguage,
    retryBoot
  };
}
