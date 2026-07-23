import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import AdminNavigator from './AdminNavigator';
import BuyerNavigator from './BuyerNavigator';
import DealNavigator from './DealNavigator';
import SellerNavigator from './SellerNavigator';
import { MessagesScreen } from '../screens/messages/MessageList';
import HomeScreen from '../screens/home/HomeScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PublicContentScreen, { getPublicPageTitle } from '../screens/public/PublicContentScreen';
import CaseDetailScreen from '../screens/case/CaseDetailScreen';
import VerifyScreen from '../screens/verify/VerifyScreen';
import { useAuth } from '../store/AuthContext';
import { colors, headerOptions } from '../theme';

const Tab = createBottomTabNavigator();
const AppStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Seller: '💵', Buyer: '🔍',
    Deals: '🤝', Messages: '💬', Member: '👥', Profile: '⚙️',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{icons[label] || '🌐'}</Text>;
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={headerOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: '我的' }} />
      <ProfileStack.Screen name="Verify" component={VerifyScreen} options={{ title: '企业认证' }} />
      <ProfileStack.Screen name="Payment" component={PaymentScreen} options={{ title: '钱包' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const { user, isAuthenticated } = useAuth();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      initialRouteName="Home"
      detachInactiveScreens={false}
      sceneContainerStyle={{ backgroundColor: colors.white }}
      screenOptions={({ route }) => ({
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        freezeOnBlur: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      {isAuthenticated && isSeller && <Tab.Screen name="Seller" component={SellerNavigator} options={{ headerShown: false, title: '卖家' }} />}
      {isAuthenticated && !isSeller && !isAdmin && <Tab.Screen name="Buyer" component={BuyerNavigator} options={{ headerShown: false, title: '买家' }} />}
      {isAuthenticated && isAdmin && <Tab.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false, title: '管理' }} />}
      {isAuthenticated && <Tab.Screen name="Deals" component={DealNavigator} options={{ headerShown: false, title: '交易' }} />}
      {isAuthenticated && <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: '消息' }} />}
      {isAuthenticated && <Tab.Screen name="Member" component={MembershipScreen} options={{ title: '会员' }} />}
      {isAuthenticated && <Tab.Screen name="Profile" component={ProfileNavigator} options={{ headerShown: false, title: '我的' }} />}
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <AppStack.Navigator screenOptions={headerOptions}>
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="PublicContent" component={PublicContentScreen} options={({ route }: any) => ({ title: getPublicPageTitle(route.params?.page) })} />
      <AppStack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: '案例详情' }} />
    </AppStack.Navigator>
  );
}
