import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { sellerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { colors } from '../../theme';

export default function SellerDashboard({ navigation }: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsApi.myProjects();
      if (res.data.success && res.data.data) setProjects(res.data.data);
    } catch (error: any) {
      setToast({ visible: true, message: error.message || '项目加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const totalViews = projects.reduce((sum, project) => sum + (project.views || 0), 0);
  const totalOffers = projects.reduce((sum, project) => sum + (project.offers || 0), 0);
  const totalMatches = projects.reduce((sum, project) => sum + (project.matches || 0), 0);
  const online = projects.filter(project => project.status === 'online').length;
  const pending = projects.filter(project => project.status === 'pending').length;
  const offline = projects.filter(project => project.status === 'offline').length;
  const sold = projects.filter(project => project.status === 'sold').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <WorkbenchTabs tabs={sellerWorkbenchTabs} activeKey="dashboard" navigation={navigation} />
      <Card>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.num}>{projects.length}</Text><Text style={styles.label}>累计项目</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalViews}</Text><Text style={styles.label}>总浏览量</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalOffers}</Text><Text style={styles.label}>收到报价</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalMatches}</Text><Text style={styles.label}>AI匹配次数</Text></View>
        </View>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>项目状态</Text>
        <View style={styles.statusRow}>
          <Badge text={`${online} 个在线`} variant="ok" />
          <Badge text={`${pending} 个待审`} variant="warn" />
          <Badge text={`${offline} 个下架`} variant="gray" />
          <Badge text={`${sold} 个成交`} variant="info" />
        </View>
      </Card>
      <Button title="发布新项目" onPress={() => navigation.navigate('ProjectPublish')} size="block" />
      <View style={{ height: 10 }} />
      <Button title="管理项目" onPress={() => navigation.navigate('ProjectManage')} variant="outline" size="block" />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  num: { fontSize: 24, fontWeight: '700', color: colors.primary },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
