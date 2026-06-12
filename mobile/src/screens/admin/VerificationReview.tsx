import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function VerificationReview() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getVerifications();
      if (res.data.success && res.data.data) setVerifications(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const approve = async (id: string) => {
    try {
      await adminApi.approveVerification(id);
      setToast({ visible: true, message: 'KYC Approved', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const reject = async (id: string) => {
    try {
      await adminApi.rejectVerification(id, 'Incomplete documentation');
      setToast({ visible: true, message: 'KYC Rejected', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge text="Pending" variant="warn" />;
      case 'approved': return <Badge text="Approved" variant="ok" />;
      case 'rejected': return <Badge text="Rejected" variant="err" />;
      default: return <Badge text={s} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {verifications.length === 0 ? (
        <Card><Text style={styles.empty}>No verifications</Text></Card>
      ) : (
        verifications.map(v => (
          <Card key={v.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{v.user_name || v.phone || 'Unknown'}</Text>
                <Text style={styles.type}>{v.type === 'personal' ? 'Personal KYC' : 'Company KYC'}</Text>
                <Text style={styles.time}>{v.submit_time?.slice(0, 10)}</Text>
              </View>
              {statusBadge(v.status)}
            </View>
            {v.status === 'pending' && (
              <View style={styles.btnRow}>
                <Button title="Approve" onPress={() => approve(v.id)} variant="green" size="sm" />
                <Button title="Reject" onPress={() => reject(v.id)} variant="red" size="sm" />
              </View>
            )}
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  empty: { textAlign: 'center', color: '#555', padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  type: { fontSize: 13, color: '#555', marginTop: 2 },
  time: { fontSize: 11, color: '#999', marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
