import React from 'react';
import ListScreen from '../screens/ListScreen';
import FormScreen from '../screens/FormScreen';
import DetailScreen from '../screens/DetailScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
export function AppNavigator({
  route,
  navigate,
  manager
}) {
  const {
    data,
    t,
    language,
    perform
  } = manager;
  const common = {
    data,
    t,
    language,
    perform,
    navigate
  };
  switch (route.name) {
    case 'form':
      return <FormScreen key={route.id || 'new'} {...common} id={route.id} />;
    case 'detail':
      return <DetailScreen {...common} id={route.id} remove={manager.remove} />;
    case 'categories':
      return <CategoryScreen {...common} />;
    case 'settings':
      return <SettingsScreen {...common} apiUrl={manager.apiUrl} configureApi={manager.configureApi} />;
    default:
      return <ListScreen {...common} filters={manager.filters} setFilters={manager.setFilters} />;
  }
}
