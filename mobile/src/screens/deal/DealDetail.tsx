import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import Pipeline from '../../components/deal/Pipeline';
import { dealsApi } from '../../api';
import { dealStages } from '../../utils/constants';

export default function DealDetail({ route }: any) {
  const { dealId } = route.params || {};
  const [deal, setDeal] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [dRes, tRes] = await Promise.all([dealsApi.getById(dealId), dealsApi.getTimeline(dealId)]);
      if (dRes.data.success && dRes.data.data) setDeal(dRes.data.data);
      if (tRes.data.success && tRes.data.data) setEvents(tRes.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, [dealId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const advanceStage = async () => {
    if (!deal) return;
    const currentIdx = dealStages.findIndex(s => s.id === deal.stage);
    if (currentIdx >= dealStages.length - 1) {
      setToast({ visible: true, message: 'Already at final stage', type: 'error' }); return;
    }
    const nextStage = dealStages[currentIdx + 1].id;
    setLoading(true);
    try {
      await dealsApi.advanceStage(dealId, nextStage);
      setToast({ visible: true, message: `Advanced to ${dealStages[currentIdx + 1].label}`, type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  if (!deal) return <ScrollView style={styles.container}><Card><Text>Loading...</Text></Card></ScrollView>;

  const stageTime = deal.stage_time ? (typeof deal.stage_time === 'string' ? JSON.parse(deal.stage_time) : deal.stage_time) : {};

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <Text style={styles.pid}>{deal.id}</Text>
        <Text style={styles.title}>{deal.seller_name} ⟷ {deal.buyer_name}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>¥{(deal.price || 0).toLocaleString()}万</Text>
          <Text style={styles.advisor}>Advisor: {deal.advisor || 'Auto'}</Text>
        </View>
        {deal.note ? <Text style={styles.note}>{deal.note}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <Pipeline currentStage={deal.stage} stageTime={stageTime} />
        </View>
        {deal.stage !== 'complete' && (
          <Button title="Advance to Next Stage ›" onPress={advanceStage} loading={loading} size="block" />
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {events.length === 0 ? (
          <Text style={styles.empty}>No events yet</Text>
        ) : (
          events.map((e, i) => (
            <View key={e.id} style={styles.event}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventAction}>{e.action}</Text>
                <Text style={styles.eventDetail}>{e.detail}</Text>
                <Text style={styles.eventTime}>{e.created_at?.slice(0, 19).replace('T', ' ')}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  price: { fontSize: 18, fontWeight: '700', color: '#c0392b' },
  advisor: { fontSize: 13, color: '#555' },
  note: { fontSize: 13, color: '#555', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 10 },
  empty: { textAlign: 'center', color: '#555', padding: 16 },
  event: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a44aa', marginTop: 4 },
  eventAction: { fontSize: 14, fontWeight: '600', color: '#111' },
  eventDetail: { fontSize: 13, color: '#555', marginTop: 2 },
  eventTime: { fontSize: 11, color: '#999', marginTop: 2 },
});
