import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, shadows } from '../../theme';

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
  tab: { minHeight: 42, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.subtle },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontWeight: '700' },
});
