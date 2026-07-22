import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import Pipeline from '../../components/deal/Pipeline';
import { dealsApi } from '../../api';
import { dealStages } from '../../utils/constants';
import { colors } from '../../theme';

export default function DealDetail({ route }: any) {
  const { dealId } = route.params || {};
  const [deal, setDeal] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [dealRes, timelineRes] = await Promise.all([dealsApi.getById(dealId), dealsApi.getTimeline(dealId)]);
      if (dealRes.data.success && dealRes.data.data) setDeal(dealRes.data.data);
      if (timelineRes.data.success && timelineRes.data.data) setEvents(timelineRes.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, [dealId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const advanceStage = async () => {
    if (!deal) return;
    const currentIndex = dealStages.findIndex(stage => stage.id === deal.stage);
    if (currentIndex >= dealStages.length - 1) {
      setToast({ visible: true, message: '已处于最终阶段', type: 'error' }); return;
    }
    const nextStage = dealStages[currentIndex + 1].id;
    setLoading(true);
    try {
      await dealsApi.advanceStage(dealId, nextStage);
      setToast({ visible: true, message: `已推进至${dealStages[currentIndex + 1].label}`, type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '操作失败', type: 'error' });
    } finally { setLoading(false); }
  };

  if (!deal) return <ScrollView style={styles.container}><Card><Text>加载中...</Text></Card></ScrollView>;

  let stageTime = {};
  try { stageTime = deal.stage_time ? (typeof deal.stage_time === 'string' ? JSON.parse(deal.stage_time) : deal.stage_time) : {}; } catch (e) { stageTime = {}; }

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <Card>
        <Text style={styles.pid}>{deal.id}</Text>
        <Text style={styles.title}>{deal.seller_name} → {deal.buyer_name}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>¥{(deal.price || 0).toLocaleString()}万</Text>
          <Text style={styles.advisor}>顾问：{deal.advisor || '系统分配'}</Text>
        </View>
        {deal.note ? <Text style={styles.note}>{deal.note}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <Pipeline currentStage={deal.stage} stageTime={stageTime} />
        </View>
        {deal.stage !== 'complete' && (
          <Button title="推进到下一阶段 →" onPress={advanceStage} loading={loading} size="block" />
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>交易动态</Text>
        {events.length === 0 ? (
          <Text style={styles.empty}>暂无动态</Text>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.event}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventAction}>{event.action}</Text>
                <Text style={styles.eventDetail}>{event.detail}</Text>
                <Text style={styles.eventTime}>{event.created_at?.slice(0, 19).replace('T', ' ')}</Text>
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
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  pid: { fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  price: { fontSize: 18, fontWeight: '700', color: colors.danger },
  advisor: { fontSize: 13, color: colors.textSecondary },
  note: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  event: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
  eventAction: { fontSize: 14, fontWeight: '600', color: colors.text },
  eventDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  eventTime: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
});
