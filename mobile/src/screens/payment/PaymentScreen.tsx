import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { paymentsApi } from '../../api';
import { colors } from '../../theme';

// 平台已转为免费审核制：充值与支付通道已下线，
// 本页仅保留历史余额 / 交易记录 / 账单的只读查询。
export default function PaymentScreen() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'history' | 'bills'>('history');

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, historyRes, billsRes] = await Promise.all([
        paymentsApi.getBalance(),
        paymentsApi.getHistory(),
        paymentsApi.getBills(),
      ]);
      if (balanceRes.data.success && balanceRes.data.data) setBalance(balanceRes.data.data.balance || 0);
      if (historyRes.data.success && historyRes.data.data) setHistory(historyRes.data.data);
      if (billsRes.data.success && billsRes.data.data) setBills(billsRes.data.data);
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card>
        <Text style={styles.balanceLabel}>历史余额</Text>
        <Text style={styles.balanceNum}>¥{balance.toLocaleString()}</Text>
        <Text style={styles.freeHint}>
          平台已转为免费审核制，充值与支付功能已下线，全部功能对高级会员免费开放。
        </Text>
      </Card>

      <View style={styles.tabs}>
        {(['history', 'bills'] as const).map(item => (
          <Button
            key={item}
            title={item === 'history' ? '交易记录' : '账单'}
            onPress={() => setTab(item)}
            variant={tab === item ? 'main' : 'gray'}
            size="sm"
          />
        ))}
      </View>

      {tab === 'history' && (
        <Card>
          <Text style={styles.sectionTitle}>交易记录</Text>
          {history.length === 0 ? (
            <Text style={styles.empty}>暂无交易</Text>
          ) : (
            history.map((item: any) => (
              <View key={item.id} style={styles.row}>
                <Badge text={item.type === 'recharge' ? '充值' : '消费'} variant={item.type === 'recharge' ? 'ok' : 'info'} />
                <Text style={item.type === 'recharge' ? styles.green : styles.red}>
                  {item.type === 'recharge' ? '+' : '-'}¥{item.amount}
                </Text>
                <Text style={styles.time}>{item.created_at?.slice(0, 10)}</Text>
              </View>
            ))
          )}
        </Card>
      )}

      {tab === 'bills' && (
        <Card>
          <Text style={styles.sectionTitle}>账单</Text>
          {bills.length === 0 ? (
            <Text style={styles.empty}>暂无账单</Text>
          ) : (
            bills.map((item: any) => (
              <View key={item.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billItem}>{item.item || item.type}</Text>
                  <Text style={styles.time}>{item.created_at?.slice(0, 10)}</Text>
                </View>
                <Badge text={item.status === 'paid' ? '已付' : '未付'} variant={item.status === 'paid' ? 'ok' : 'warn'} />
                <Text style={styles.billAmt}>¥{item.amount}</Text>
              </View>
            ))
          )}
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  balanceLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  balanceNum: { fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: 4 },
  freeHint: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 10, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  green: { fontSize: 14, fontWeight: '600', color: colors.success },
  red: { fontSize: 14, fontWeight: '600', color: colors.danger },
  time: { fontSize: 11, color: colors.textTertiary },
  billItem: { fontSize: 13, color: colors.text },
  billAmt: { fontSize: 14, fontWeight: '600', color: colors.text },
});
