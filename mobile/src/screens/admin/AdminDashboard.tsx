import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function AdminDashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getDashboard();
      if (res.data.success && res.data.data) setData(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.stats}>
          <StatItem num={data?.projectCount || 0} label="Projects" />
          <StatItem num={data?.pendingProjects || 0} label="Pending Projects" />
          <StatItem num={data?.pendingVerifications || 0} label="Pending KYC" />
          <StatItem num={data?.userCount || 0} label="Users" />
        </View>
      </Card>
      <View style={styles.actions}>
        <Button title="Review Projects" onPress={() => navigation.navigate('ProjectReview')} size="block" />
        <Button title="Review Verifications" onPress={() => navigation.navigate('VerificationReview')} variant="outline" size="block" />
        <Button title="Manage Users" onPress={() => navigation.navigate('UserManagement')} variant="outline" size="block" />
      </View>
    </ScrollView>
  );
}

function StatItem({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.num}>{num}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 12 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  stat: { alignItems: 'center', marginBottom: 12, width: '45%' },
  num: { fontSize: 28, fontWeight: '700', color: '#1a44aa' },
  label: { fontSize: 12, color: '#555', marginTop: 2, textAlign: 'center' },
  actions: { gap: 10 },
});
