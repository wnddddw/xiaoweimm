import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function ProjectReview({ navigation }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getProjects({ status: filter });
      if (res.data.success && res.data.data) setProjects(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const approve = async (id: string) => {
    try {
      await adminApi.approveProject(id);
      setToast({ visible: true, message: '已通过', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const reject = async (id: string) => {
    try {
      await adminApi.rejectProject(id);
      setToast({ visible: true, message: '已拒绝', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge text="待审" variant="warn" />;
      case 'online': return <Badge text="已上线" variant="ok" />;
      case 'rejected': return <Badge text="已拒绝" variant="err" />;
      case 'offline': return <Badge text="已下线" variant="gray" />;
      default: return <Badge text={s} variant="gray" />;
    }
  };


  const statusLabels: Record<string, string> = {
    pending: '待审', online: '已上线', rejected: '已拒绝', offline: '已下线'
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <View style={styles.filterRow}>
        {['pending','online','rejected','offline'].map(s => (
          <Button key={s} title={statusLabels[s] || s} onPress={() => setFilter(s)} variant={filter === s ? 'main' : 'gray'} size="sm" />
        ))}
      </View>
      {projects.map(p => (
        <Card key={p.id} onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}>
          <View style={styles.row}>
            <Text style={styles.pid}>{p.id}</Text>
            {statusBadge(p.status)}
          </View>
          <Text style={styles.title}>{p.industry} / {p.sub_industry}</Text>
          <Text style={styles.loc}>{p.province} {p.city}</Text>
          <Text style={styles.detail}>营收: ¥{(p.revenue || 0).toLocaleString()}万 | 价格: ¥{(p.price || 0).toLocaleString()}万</Text>
          {p.status === 'pending' && (
            <View style={styles.btnRow}>
              <Button title="通过" onPress={() => approve(p.id)} variant="green" size="sm" />
              <Button title="拒绝" onPress={() => reject(p.id)} variant="red" size="sm" />
            </View>
          )}
        </Card>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  title: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  loc: { fontSize: 13, color: '#555' },
  detail: { fontSize: 12, color: '#555', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tapHint: { fontSize: 12, color: '#1a44aa', marginTop: 6 },
});
