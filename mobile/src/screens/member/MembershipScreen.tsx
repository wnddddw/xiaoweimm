import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { membershipsApi, paymentsApi } from '../../api';
import { useAuth } from '../../store/AuthContext';

const PLANS = [
  { key: 'personal', name: 'Personal', price: 300, features: ['View non-public projects', '1h early notification', 'Direct contact seller', 'Event registration'] },
  { key: 'company', name: 'Company', price: 600, features: ['All Personal features', 'Priority matching', 'Dedicated advisor', 'API access'] },
  { key: 'vip', name: 'Enterprise VIP', price: 1800, features: ['All Company features', 'White-glove service', 'Custom deal flow', 'Unlimited everything'] },
];

export default function MembershipScreen() {
  const { user } = useAuth();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, bRes, oRes] = await Promise.all([membershipsApi.get(), paymentsApi.getBalance(), membershipsApi.getOrders()]);
      if (mRes.data.success && mRes.data.data) setMemberInfo(mRes.data.data);
      if (bRes.data.success && bRes.data.data) setBalance(bRes.data.data.balance || 0);
      if (oRes.data.success && oRes.data.data) setOrders(oRes.data.data);
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const upgrade = async (planType: string) => {
    const plan = PLANS.find(p => p.key === planType);
    if (!plan) return;
    if (balance < plan.price) {
      setToast({ visible: true, message: `Insufficient balance. Need ¥${plan.price}`, type: 'error' }); return;
    }
    try {
      const res = await membershipsApi.upgrade(planType);
      if (res.data.success) {
        setToast({ visible: true, message: `Upgraded to ${plan.name}!`, type: 'success' });
        fetchData();
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Upgrade failed', type: 'error' });
    }
  };

  const toggleAutoRenew = async (val: boolean) => {
    try {
      await membershipsApi.toggleAutoRenew(val);
      setToast({ visible: true, message: val ? 'Auto-renew ON' : 'Auto-renew OFF', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    }
  };

  const levelBadge = (l: string) => {
    switch (l) {
      case 'free': return <Badge text="Free" variant="gray" />;
      case 'personal': return <Badge text="Personal" variant="info" />;
      case 'company': return <Badge text="Company" variant="warn" />;
      case 'vip': return <Badge text="VIP" variant="ok" />;
      default: return <Badge text={l || 'Free'} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <Text style={styles.sectionTitle}>Current Plan</Text>
        <View style={styles.row}>
          {levelBadge(memberInfo?.member_level || user?.member_level || 'free')}
          <Text style={styles.balance}>Balance: ¥{balance}</Text>
        </View>
        {memberInfo?.member_expire && (
          <Text style={styles.expire}>Expires: {memberInfo.member_expire.slice(0, 10)}</Text>
        )}
        <View style={styles.autoRow}>
          <Text style={styles.autoLabel}>Auto-renew</Text>
          <Switch
            value={!!memberInfo?.auto_renew}
            onValueChange={toggleAutoRenew}
            trackColor={{ false: '#ccc', true: '#1a44aa' }}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Upgrade Plan</Text>
        {PLANS.map(p => (
          <View key={p.key} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{p.name}</Text>
              <Text style={styles.planPrice}>¥{p.price}/mo</Text>
            </View>
            {p.features.map((f, i) => (
              <Text key={i} style={styles.feature}>✓ {f}</Text>
            ))}
            <Button
              title={memberInfo?.member_level === p.key ? 'Current Plan' : 'Upgrade'}
              onPress={() => upgrade(p.key)}
              variant={memberInfo?.member_level === p.key ? 'gray' : 'main'}
              disabled={memberInfo?.member_level === p.key}
              size="block"
            />
          </View>
        ))}
      </Card>

      {orders.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Order History</Text>
          {orders.map(o => (
            <View key={o.id} style={styles.orderRow}>
              <Badge text={o.plan_type || 'order'} variant="info" />
              <Text style={styles.orderAmt}>¥{o.amount}</Text>
              <Text style={styles.orderTime}>{o.created_at?.slice(0, 10)}</Text>
            </View>
          ))}
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontSize: 15, fontWeight: '700', color: '#1a44aa' },
  expire: { fontSize: 12, color: '#888', marginTop: 4 },
  autoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  autoLabel: { fontSize: 14, color: '#333' },
  planCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 16, marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  planName: { fontSize: 16, fontWeight: '700', color: '#111' },
  planPrice: { fontSize: 18, fontWeight: '700', color: '#c0392b' },
  feature: { fontSize: 13, color: '#555', paddingVertical: 3 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  orderAmt: { fontSize: 13, fontWeight: '600', color: '#111' },
  orderTime: { fontSize: 11, color: '#999', marginLeft: 'auto' },
});
