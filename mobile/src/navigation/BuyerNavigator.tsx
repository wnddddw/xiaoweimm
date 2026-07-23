import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuyerDashboard from '../screens/buyer/BuyerDashboard';
import DemandInput from '../screens/buyer/DemandInput';
import ProjectBrowse from '../screens/buyer/ProjectBrowse';
import ProjectDetail from '../screens/buyer/ProjectDetail';
import MyApplications from '../screens/buyer/MyApplications';
import { headerOptions } from '../theme';

const Stack = createNativeStackNavigator();
export default function BuyerNavigator() {
  return (
    <Stack.Navigator initialRouteName="DemandInput" screenOptions={headerOptions}>
      <Stack.Screen name="DemandInput" component={DemandInput} options={{ title: '收购需求' }} />
      <Stack.Screen name="ProjectBrowse" component={ProjectBrowse} options={{ title: '浏览项目' }} />
      <Stack.Screen name="MyApplications" component={MyApplications} options={{ title: '我的申请' }} />
      <Stack.Screen name="BuyerDashboard" component={BuyerDashboard} options={{ title: '买家工作台' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} options={{ title: '项目详情' }} />
    </Stack.Navigator>
  );
}
