import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { dealsApi } from '../../api';
import { dealStages } from '../../utils/constants';

export default function DealList({ navigation }: any) {
  const [deals, setDeals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await dealsApi.list();
      if (res.data.success && res.data.data) setDeals(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const stageLabel = (s: string) => dealStages.find(d => d.id === s)?.label || s;

  const stageBadge = (s: string) => {
    switch (s) {
      case 'complete': return <Badge text="Complete" variant="ok" />;
      case 'matching': return <Badge text="Matching" variant="warn" />;
      default: return <Badge text={stageLabel(s)} variant="info" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {deals.length === 0 ? (
        <Card><Text style={styles.empty}>No deals yet</Text></Card>
      ) : (
        deals.map(d => (
          <TouchableOpacity key={d.id} onPress={() => navigation.navigate('DealDetail', { dealId: d.id })}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.pid}>{d.id}</Text>
                {stageBadge(d.stage)}
              </View>
              <Text style={styles.title}>{d.seller_name} ⟷ {d.buyer_name}</Text>
              <View style={styles.row}>
                <Text style={styles.price}>¥{(d.price || 0).toLocaleString()}万</Text>
                <Text style={styles.advisor}>Advisor: {d.advisor || 'Auto'}</Text>
              </View>
              <Text style={styles.time}>Created: {d.created_at?.slice(0, 10)}</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  title: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#c0392b' },
  advisor: { fontSize: 12, color: '#555' },
  time: { fontSize: 11, color: '#999', marginTop: 4 },
});
