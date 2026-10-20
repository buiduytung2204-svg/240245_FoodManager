import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
export function useAppNavigation() {
  const [route, navigate] = useState({
    name: 'list'
  });
  const back = () => navigate(route.name === 'form' && route.id ? {
    name: 'detail',
    id: route.id
  } : {
    name: 'list'
  });
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'list') return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [route]);
  return {
    route,
    navigate,
    back
  };
}
