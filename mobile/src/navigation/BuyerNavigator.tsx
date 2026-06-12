import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuyerDashboard from '../screens/buyer/BuyerDashboard';
import DemandInput from '../screens/buyer/DemandInput';
import ProjectBrowse from '../screens/buyer/ProjectBrowse';
import ProjectDetail from '../screens/buyer/ProjectDetail';
import MyApplications from '../screens/buyer/MyApplications';

const Stack = createNativeStackNavigator();
export default function BuyerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="BuyerDashboard" component={BuyerDashboard} options={{ title: 'Buyer Workspace' }} />
      <Stack.Screen name="DemandInput" component={DemandInput} options={{ title: 'Acquisition Demand' }} />
      <Stack.Screen name="ProjectBrowse" component={ProjectBrowse} options={{ title: 'Browse Projects' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} options={{ title: 'Project Detail' }} />
      <Stack.Screen name="MyApplications" component={MyApplications} options={{ title: 'My Applications' }} />
    </Stack.Navigator>
  );
}
