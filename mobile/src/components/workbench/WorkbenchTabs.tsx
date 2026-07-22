import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export type WorkbenchTab = {
  key: string;
  label: string;
  route: string;
};

export const sellerWorkbenchTabs: WorkbenchTab[] = [
  { key: 'publish', label: '发布项目', route: 'ProjectPublish' },
  { key: 'manage', label: '我的项目', route: 'ProjectManage' },
  { key: 'dashboard', label: '数据看板', route: 'SellerDashboard' },
];

export const buyerWorkbenchTabs: WorkbenchTab[] = [
  { key: 'demand', label: '收购需求', route: 'DemandInput' },
  { key: 'browse', label: '项目浏览', route: 'ProjectBrowse' },
  { key: 'applications', label: '我的申请', route: 'MyApplications' },
];

export default function WorkbenchTabs({
  tabs,
  activeKey,
  navigation,
}: {
  tabs: WorkbenchTab[];
  activeKey: string;
  navigation: any;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap} contentContainerStyle={styles.content}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeKey === tab.key && styles.tabActive]}
          onPress={() => activeKey !== tab.key && navigation.navigate(tab.route)}
          activeOpacity={0.75}>
          <Text style={[styles.tabText, activeKey === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  content: { gap: 8, paddingRight: 8 },
  tab: { minHeight: 42, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: '#c7d2e5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#1a44aa', borderColor: '#1a44aa' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#34405a' },
  tabTextActive: { color: '#fff' },
});
