import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerDashboard from '../screens/seller/SellerDashboard';
import ProjectPublish from '../screens/seller/ProjectPublish';
import ProjectManage from '../screens/seller/ProjectManage';
import ProjectDetail from '../screens/seller/ProjectDetail';

const Stack = createNativeStackNavigator();
export default function SellerNavigator() {
  return (
    <Stack.Navigator initialRouteName="ProjectPublish" screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="ProjectPublish" component={ProjectPublish} options={{ title: '发布项目' }} />
      <Stack.Screen name="ProjectManage" component={ProjectManage} options={{ title: '我的项目' }} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} options={{ title: '数据看板' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} options={{ title: '项目详情' }} />
    </Stack.Navigator>
  );
}
