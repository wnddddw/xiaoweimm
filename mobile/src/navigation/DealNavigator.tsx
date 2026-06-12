import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DealList from '../screens/deal/DealList';
import DealCreate from '../screens/deal/DealCreate';
import DealDetail from '../screens/deal/DealDetail';

const Stack = createNativeStackNavigator();
export default function DealNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="DealList" component={DealList} options={{ title: 'Deals' }} />
      <Stack.Screen name="DealCreate" component={DealCreate} options={{ title: 'New Deal' }} />
      <Stack.Screen name="DealDetail" component={DealDetail} options={{ title: 'Deal Detail' }} />
    </Stack.Navigator>
  );
}
