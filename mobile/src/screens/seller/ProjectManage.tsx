import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { sellerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { colors } from '../../theme';

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '上线' },
  { key: 'pending', label: '审核中' },
  { key: 'offline', label: '已下架' },
  { key: 'sold', label: '已成交' },
];

export default function ProjectManage({ navigation }: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsApi.myProjects();
      if (res.data.success && res.data.data) setProjects(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '项目加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const getStatusCount = (status: string) => {
    if (status === 'all') return projects.length;
    return projects.filter(project => project.status === status).length;
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'online': return <Badge text="上线" variant="ok" />;
      case 'pending': return <Badge text="审核中" variant="warn" />;
      case 'offline': return <Badge text="已下架" variant="gray" />;
      case 'sold': return <Badge text="已成交" variant="info" />;
      default: return <Badge text={s} variant="gray" />;
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      await projectsApi.toggleStatus(id, newStatus as any);
      setToast({ visible: true, message: newStatus === 'online' ? '项目已上线' : '项目已下架', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '操作失败', type: 'error' });
    }
  };

  const handleRefresh = async (id: string) => {
    try {
      await projectsApi.refresh(id);
      setToast({ visible: true, message: '项目已刷新', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '刷新失败', type: 'error' });
    }
  };

  const handleTop = async (id: string) => {
    try {
      await projectsApi.top(id);
      setToast({ visible: true, message: '项目已置顶', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '置顶失败', type: 'error' });
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <WorkbenchTabs tabs={sellerWorkbenchTabs} activeKey="manage" navigation={navigation} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {STATUS_TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, filter === t.key && styles.tabActive]} onPress={() => setFilter(t.key)}>
            <Text style={[styles.tabText, filter === t.key && styles.tabActiveText]}>{t.label}</Text>
            <Text style={[styles.countText, filter === t.key && styles.tabActiveText]}>{getStatusCount(t.key)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Card><Text style={styles.empty}>暂无项目</Text></Card>
      ) : (
        filtered.map(p => (
          <Card key={p.id}>
            <TouchableOpacity onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}>
              <View style={styles.row}>
                <Text style={styles.pid}>{p.id}</Text>
                {statusBadge(p.status)}
              </View>
              <Text style={styles.ind}>{p.industry} / {p.sub_industry || '-'}</Text>
              <Text style={styles.loc}>{p.province} {p.city}</Text>
              <View style={styles.row}>
                <Text style={styles.detail}>年营业额：¥{(p.revenue || 0).toLocaleString()}万</Text>
                <Text style={styles.detail}>期望价格：¥{(p.price || 0).toLocaleString()}万</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.detail}>浏览：{p.views || 0}</Text>
                <Text style={styles.detail}>报价：{p.offers || 0}</Text>
                <Text style={styles.detail}>匹配：{p.matches || 0}%</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title="编辑" onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id, edit: true })} variant="outline" size="sm" />
              {p.status === 'online' && (
                <>
                  <Button title="刷新" onPress={() => handleRefresh(p.id)} variant="gray" size="sm" />
                  <Button title="置顶" onPress={() => handleTop(p.id)} variant="gray" size="sm" />
                  <Button title="下架" onPress={() => toggleStatus(p.id, p.status)} variant="red" size="sm" />
                </>
              )}
              {p.status === 'offline' && (
                <Button title="上线" onPress={() => toggleStatus(p.id, p.status)} variant="green" size="sm" />
              )}
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  tabs: { marginBottom: 12 },
  tab: { minHeight: 42, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  countText: { fontSize: 11, color: colors.textSecondary, fontWeight: '800', marginTop: 2 },
  tabActiveText: { color: colors.white },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace' },
  ind: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  loc: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  detail: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
});
