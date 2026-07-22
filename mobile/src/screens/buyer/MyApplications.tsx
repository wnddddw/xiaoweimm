import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import Button from '../../components/common/Button';
import WorkbenchTabs, { buyerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { demandsApi } from '../../api';

export default function MyApplications({ navigation }: any) {
  const [apps, setApps] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await demandsApi.getApplications();
      if (res.data.success && res.data.data) setApps(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '申请记录加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge text="审核中" variant="warn" />;
      case 'approved': return <Badge text="已通过" variant="ok" />;
      case 'rejected': return <Badge text="已拒绝" variant="err" />;
      default: return <Badge text={s || '未知'} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <WorkbenchTabs tabs={buyerWorkbenchTabs} activeKey="applications" navigation={navigation} />
      <Card>
        <Text style={styles.sectionTitle}>我的申请记录</Text>
        <Text style={styles.sectionHint}>按原项目编号、项目信息、申请时间、状态和操作查看申请进度。</Text>
      </Card>
      {apps.length === 0 ? (
        <Card><Text style={styles.empty}>暂无申请记录</Text></Card>
      ) : (
        apps.map(a => (
          <Card key={a.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>项目编号</Text>
                <Text style={styles.pid}>{a.project_id}</Text>
              </View>
              {statusBadge(a.status)}
            </View>
            <Text style={styles.label}>项目信息</Text>
            {a.industry ? <Text style={styles.info}>{a.industry} / {a.province} {a.city}</Text> : <Text style={styles.info}>待卖家补充项目信息</Text>}
            <View style={styles.metaRow}>
              <View style={styles.metaCell}>
                <Text style={styles.label}>申请时间</Text>
                <Text style={styles.time}>{a.created_at?.slice(0, 10) || '-'}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.label}>状态</Text>
                {statusBadge(a.status)}
              </View>
            </View>
            {a.note ? <Text style={styles.note}>申请备注：{a.note}</Text> : null}
            <Button title="查看" onPress={() => a.project_id && navigation.navigate('ProjectDetail', { projectId: a.project_id })} variant="outline" size="sm" />
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 6 },
  sectionHint: { fontSize: 12, color: '#667085', lineHeight: 18 },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 11, color: '#667085', fontWeight: '700', marginBottom: 4 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  info: { fontSize: 14, color: '#111', fontWeight: '500', marginBottom: 2 },
  note: { fontSize: 13, color: '#555', marginBottom: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 10 },
  metaCell: { flex: 1 },
  time: { fontSize: 11, color: '#999' },
});
