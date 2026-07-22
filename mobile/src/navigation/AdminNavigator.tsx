import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ProjectReview from '../screens/admin/ProjectReview';
import VerificationReview from '../screens/admin/VerificationReview';
import UserManagement from '../screens/admin/UserManagement';
import ProjectDetailScreen from '../screens/admin/ProjectDetailScreen';
import VerificationDetailScreen from '../screens/admin/VerificationDetailScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import { headerOptions } from '../theme';

const Stack = createNativeStackNavigator();
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: '管理后台' }} />
      <Stack.Screen name="ProjectReview" component={ProjectReview} options={{ title: '项目审核' }} />
      <Stack.Screen name="VerificationReview" component={VerificationReview} options={{ title: '认证审核' }} />
      <Stack.Screen name="UserManagement" component={UserManagement} options={{ title: '用户管理' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: '项目详情' }} />
      <Stack.Screen name="VerificationDetail" component={VerificationDetailScreen} options={{ title: '认证详情' }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: '用户详情' }} />
    </Stack.Navigator>
  );
}
