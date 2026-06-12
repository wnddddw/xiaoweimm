import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'pending', label: 'Pending' },
  { key: 'offline', label: 'Offline' },
  { key: 'sold', label: 'Sold' },
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
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'online': return <Badge text="Online" variant="ok" />;
      case 'pending': return <Badge text="Pending" variant="warn" />;
      case 'offline': return <Badge text="Offline" variant="gray" />;
      case 'sold': return <Badge text="Sold" variant="info" />;
      default: return <Badge text={s} variant="gray" />;
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      await projectsApi.toggleStatus(id, newStatus as any);
      setToast({ visible: true, message: newStatus === 'online' ? 'Listed' : 'Delisted', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleRefresh = async (id: string) => {
    try {
      await projectsApi.refresh(id);
      setToast({ visible: true, message: 'Refreshed', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    }
  };

  const handleTop = async (id: string) => {
    try {
      await projectsApi.top(id);
      setToast({ visible: true, message: 'Pinned to top', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {STATUS_TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, filter === t.key && styles.tabActive]} onPress={() => setFilter(t.key)}>
            <Text style={[styles.tabText, filter === t.key && styles.tabActiveText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Card><Text style={styles.empty}>No projects</Text></Card>
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
                <Text style={styles.detail}>Rev: ¥{(p.revenue || 0).toLocaleString()}万</Text>
                <Text style={styles.detail}>Price: ¥{(p.price || 0).toLocaleString()}万</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.detail}>Views: {p.views || 0}</Text>
                <Text style={styles.detail}>Offers: {p.offers || 0}</Text>
                <Text style={styles.detail}>Match: {p.matches || 0}%</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id, edit: true })} variant="outline" size="sm" />
              {p.status === 'online' && (
                <>
                  <Button title="Refresh" onPress={() => handleRefresh(p.id)} variant="gray" size="sm" />
                  <Button title="Top" onPress={() => handleTop(p.id)} variant="gray" size="sm" />
                  <Button title="Offline" onPress={() => toggleStatus(p.id, p.status)} variant="red" size="sm" />
                </>
              )}
              {p.status === 'offline' && (
                <Button title="Online" onPress={() => toggleStatus(p.id, p.status)} variant="green" size="sm" />
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
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  tabs: { marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#e5e7ea' },
  tabActive: { backgroundColor: '#1a44aa' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '500' },
  tabActiveText: { color: '#fff' },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  ind: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  loc: { fontSize: 13, color: '#555', marginBottom: 4 },
  detail: { fontSize: 12, color: '#555' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
});
