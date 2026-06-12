import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ProjectReview from '../screens/admin/ProjectReview';
import VerificationReview from '../screens/admin/VerificationReview';
import UserManagement from '../screens/admin/UserManagement';

const Stack = createNativeStackNavigator();
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="ProjectReview" component={ProjectReview} options={{ title: 'Review Projects' }} />
      <Stack.Screen name="VerificationReview" component={VerificationReview} options={{ title: 'Review KYC' }} />
      <Stack.Screen name="UserManagement" component={UserManagement} options={{ title: 'Manage Users' }} />
    </Stack.Navigator>
  );
}
