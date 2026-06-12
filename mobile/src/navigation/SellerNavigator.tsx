import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerDashboard from '../screens/seller/SellerDashboard';
import ProjectPublish from '../screens/seller/ProjectPublish';
import ProjectManage from '../screens/seller/ProjectManage';
import ProjectDetail from '../screens/seller/ProjectDetail';

const Stack = createNativeStackNavigator();
export default function SellerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} options={{ title: 'Seller Workspace' }} />
      <Stack.Screen name="ProjectPublish" component={ProjectPublish} options={{ title: 'Publish Project' }} />
      <Stack.Screen name="ProjectManage" component={ProjectManage} options={{ title: 'My Projects' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} options={{ title: 'Project Detail' }} />
    </Stack.Navigator>
  );
}
