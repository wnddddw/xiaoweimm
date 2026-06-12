import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../store/AuthContext';
import HomeScreen from '../screens/home/HomeScreen';
import SellerNavigator from './SellerNavigator';
import BuyerNavigator from './BuyerNavigator';
import DealNavigator from './DealNavigator';
import { MessagesScreen } from '../screens/messages/MessageList';
import MembershipScreen from '../screens/member/MembershipScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import VerifyScreen from '../screens/verify/VerifyScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import AdminNavigator from './AdminNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Seller: '📝', Buyer: '🔍', Deals: '🤝', Messages: '💬', Member: '👤', Profile: '⚙' };
  return <Text style={{ fontSize: 20 }}>{icons[label] || '📌'}</Text>;
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a44aa' }, headerTintColor: '#fff' }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Me' }} />
      <ProfileStack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Verification' }} />
      <ProfileStack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Wallet' }} />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: '#1a44aa' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: '#1a44aa',
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'xiaoweimm' }} />
      {isSeller && <Tab.Screen name="Seller" component={SellerNavigator} options={{ headerShown: false, title: 'Sell' }} />}
      {!isSeller && !isAdmin && <Tab.Screen name="Buyer" component={BuyerNavigator} options={{ headerShown: false, title: 'Buy' }} />}
      {isAdmin && <Tab.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false, title: 'Admin' }} />}
      {!isAdmin && <Tab.Screen name="Deals" component={DealNavigator} options={{ headerShown: false, title: 'Deals' }} />}
      {isAdmin && <Tab.Screen name="Deals" component={DealNavigator} options={{ headerShown: false, title: 'Deals' }} />}
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Member" component={MembershipScreen} options={{ title: 'VIP' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ headerShown: false, title: 'Me' }} />
    </Tab.Navigator>
  );
}
