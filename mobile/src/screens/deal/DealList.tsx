import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { dealsApi, getApiErrorMessage } from '../../api';
import { dealStages } from '../../utils/constants';
import { colors } from '../../theme';

export default function DealList({ navigation }: any) {
  const [deals, setDeals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await dealsApi.list();
      if (res.data.success && res.data.data) setDeals(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: getApiErrorMessage(e, '加载失败'), type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const stageLabel = (stage: string) => dealStages.find(item => item.id === stage)?.label || stage;

  const stageBadge = (stage: string) => {
    switch (stage) {
      case 'complete': return <Badge text="交易完成" variant="ok" />;
      case 'matching': return <Badge text="匹配沟通" variant="warn" />;
      default: return <Badge text={stageLabel(stage)} variant="info" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      {deals.length === 0 ? (
        <Card><Text style={styles.empty}>暂无交易</Text></Card>
      ) : (
        deals.map(deal => (
          <TouchableOpacity key={deal.id} onPress={() => navigation.navigate('DealDetail', { dealId: deal.id })}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.pid}>{deal.id}</Text>
                {stageBadge(deal.stage)}
              </View>
              <Text style={styles.title}>{deal.seller_name} → {deal.buyer_name}</Text>
              <View style={styles.row}>
                <Text style={styles.price}>¥{(deal.price || 0).toLocaleString()}万</Text>
                <Text style={styles.advisor}>顾问：{deal.advisor || '系统分配'}</Text>
              </View>
              <Text style={styles.time}>创建时间：{deal.created_at?.slice(0, 10)}</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '700', color: colors.danger },
  advisor: { fontSize: 12, color: colors.textSecondary },
  time: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
});
