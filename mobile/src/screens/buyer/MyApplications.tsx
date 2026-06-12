import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
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
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge text="Pending" variant="warn" />;
      case 'approved': return <Badge text="Approved" variant="ok" />;
      case 'rejected': return <Badge text="Rejected" variant="err" />;
      default: return <Badge text={s || 'Unknown'} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {apps.length === 0 ? (
        <Card><Text style={styles.empty}>No applications</Text></Card>
      ) : (
        apps.map(a => (
          <Card key={a.id}>
            <View style={styles.row}>
              <Text style={styles.pid}>{a.project_id}</Text>
              {statusBadge(a.status)}
            </View>
            {a.industry && <Text style={styles.info}>{a.industry} / {a.province} {a.city}</Text>}
            {a.note ? <Text style={styles.note}>{a.note}</Text> : null}
            <Text style={styles.time}>{a.created_at?.slice(0, 10)}</Text>
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  info: { fontSize: 14, color: '#111', fontWeight: '500', marginBottom: 2 },
  note: { fontSize: 13, color: '#555', marginBottom: 2 },
  time: { fontSize: 11, color: '#999' },
});
