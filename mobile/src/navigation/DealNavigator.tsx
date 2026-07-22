import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DealList from '../screens/deal/DealList';
import DealCreate from '../screens/deal/DealCreate';
import DealDetail from '../screens/deal/DealDetail';
import { headerOptions } from '../theme';

const Stack = createNativeStackNavigator();
export default function DealNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="DealList" component={DealList} options={{ title: '交易列表' }} />
      <Stack.Screen name="DealCreate" component={DealCreate} options={{ title: '新建交易' }} />
      <Stack.Screen name="DealDetail" component={DealDetail} options={{ title: '交易详情' }} />
    </Stack.Navigator>
  );
}
