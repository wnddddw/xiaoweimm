import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { demandsApi, matchingApi } from '../../api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { buyerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { Project } from '../../types';
import { colors } from '../../theme';

export default function BuyerDashboard({ navigation }: any) {
  const [demand, setDemand] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [demandRes, matchRes] = await Promise.all([demandsApi.getMy(), matchingApi.getRecommendations()]);
      if (demandRes.data.success && demandRes.data.data) setDemand(demandRes.data.data);
      if (matchRes.data.success && matchRes.data.data) setRecommendations(matchRes.data.data.slice(0, 5));
    } catch (error: any) {
      setToast({ visible: true, message: error.message || '数据加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <WorkbenchTabs tabs={buyerWorkbenchTabs} activeKey="demand" navigation={navigation} />

      {demand ? (
        <Card>
          <Text style={styles.sectionTitle}>我的需求</Text>
          <Text style={styles.detail}>{demand.industry} / {demand.sub_industry || '-'}</Text>
          <Text style={styles.detail}>{demand.province} {demand.city} | 预算：{demand.budget_min || 0}-{demand.budget_max || '不限'} 万</Text>
          <Text style={styles.detail}>用途：{demand.purpose || '-'}</Text>
          <Button title="编辑需求" onPress={() => navigation.navigate('DemandInput')} variant="outline" size="sm" />
        </Card>
      ) : (
        <Card>
          <Text style={styles.empty}>还没有填写收购需求。完善需求后，系统会推荐更匹配的项目。</Text>
          <Button title="填写需求" onPress={() => navigation.navigate('DemandInput')} size="block" />
        </Card>
      )}

      <View style={{ height: 10 }} />
      <Button title="浏览全部项目" onPress={() => navigation.navigate('ProjectBrowse')} variant="outline" size="block" />
      <View style={{ height: 10 }} />
      <Button title="我的申请" onPress={() => navigation.navigate('MyApplications')} variant="outline" size="block" />

      {recommendations.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>智能推荐</Text>
          {recommendations.map(project => (
            <View key={project.id} style={styles.recItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>{project.industry} / {project.sub_industry}</Text>
                <Text style={styles.recLoc}>{project.province} {project.city} | ¥{(project.price || 0).toLocaleString()}万</Text>
                {project.match_score != null && (
                  <Badge text={`${project.match_score}% 匹配`} variant={project.match_score >= 70 ? 'ok' : project.match_score >= 40 ? 'warn' : 'gray'} />
                )}
              </View>
              <Button title="查看" onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })} size="sm" />
            </View>
          ))}
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  detail: { fontSize: 13, color: colors.textSecondary, marginBottom: 3 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginBottom: 12 },
  recItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  recTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  recLoc: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
});
