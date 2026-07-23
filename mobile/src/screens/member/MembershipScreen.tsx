import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { membershipsApi, paymentsApi } from '../../api';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme';

const PLANS = [
  { key: 'personal', name: '个人会员', price: 300, features: ['查看非公开项目', '提前 1 小时接收提醒', '直连卖方沟通', '可报名线下活动'] },
  { key: 'company', name: '企业会员', price: 600, features: ['包含个人会员权益', '优先智能匹配', '专属顾问跟进', '开放接口对接'] },
  { key: 'vip', name: '企业 VIP', price: 1800, features: ['包含企业会员权益', '全流程顾问服务', '定制交易流程', '不限量使用核心权益'] },
];

const planLabel = (level: string) => {
  switch (level) {
    case 'personal': return '个人会员';
    case 'company': return '企业会员';
    case 'vip': return '企业 VIP';
    case 'free':
    default: return '免费版';
  }
};

export default function MembershipScreen() {
  const { user } = useAuth();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, balanceRes, orderRes] = await Promise.all([membershipsApi.get(), paymentsApi.getBalance(), membershipsApi.getOrders()]);
      if (memberRes.data.success && memberRes.data.data) setMemberInfo(memberRes.data.data);
      if (balanceRes.data.success && balanceRes.data.data) setBalance(balanceRes.data.data.balance || 0);
      if (orderRes.data.success && orderRes.data.data) setOrders(orderRes.data.data);
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const upgrade = async (planType: string) => {
    const plan = PLANS.find(item => item.key === planType);
    if (!plan) return;
    if (balance < plan.price) {
      setToast({ visible: true, message: `余额不足，需要 ¥${plan.price}`, type: 'error' }); return;
    }
    try {
      const res = await membershipsApi.upgrade(planType);
      if (res.data.success) {
        setToast({ visible: true, message: `已升级为${plan.name}`, type: 'success' });
        fetchData();
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '升级失败', type: 'error' });
    }
  };

  const toggleAutoRenew = async (value: boolean) => {
    try {
      await membershipsApi.toggleAutoRenew(value);
      setToast({ visible: true, message: value ? '自动续费已开启' : '自动续费已关闭', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '操作失败', type: 'error' });
    }
  };

  const levelBadge = (level: string) => {
    switch (level) {
      case 'personal': return <Badge text="个人会员" variant="info" />;
      case 'company': return <Badge text="企业会员" variant="warn" />;
      case 'vip': return <Badge text="企业 VIP" variant="ok" />;
      case 'free':
      default: return <Badge text="免费版" variant="gray" />;
    }
  };

  const currentLevel = memberInfo?.member_level || user?.member_level || 'free';

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <Card>
        <Text style={styles.sectionTitle}>当前方案</Text>
        <View style={styles.row}>
          {levelBadge(currentLevel)}
          <Text style={styles.balance}>余额：¥{balance}</Text>
        </View>
        {memberInfo?.member_expire && (
          <Text style={styles.expire}>到期时间：{memberInfo.member_expire.slice(0, 10)}</Text>
        )}
        <View style={styles.autoRow}>
          <Text style={styles.autoLabel}>自动续费</Text>
          <Switch
            value={!!memberInfo?.auto_renew}
            onValueChange={toggleAutoRenew}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>升级方案</Text>
        {PLANS.map(plan => (
          <View key={plan.key} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>¥{plan.price}/月</Text>
            </View>
            {plan.features.map((feature, index) => (
              <Text key={index} style={styles.feature}>✓ {feature}</Text>
            ))}
            <Button
              title={currentLevel === plan.key ? '当前方案' : '立即升级'}
              onPress={() => upgrade(plan.key)}
              variant={currentLevel === plan.key ? 'gray' : 'main'}
              disabled={currentLevel === plan.key}
              size="block"
            />
          </View>
        ))}
      </Card>

      {orders.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>订单记录</Text>
          {orders.map(order => (
            <View key={order.id} style={styles.orderRow}>
              <Badge text={planLabel(order.plan_type || 'free')} variant="info" />
              <Text style={styles.orderAmt}>¥{order.amount}</Text>
              <Text style={styles.orderTime}>{order.created_at?.slice(0, 10)}</Text>
            </View>
          ))}
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontSize: 15, fontWeight: '700', color: colors.primary },
  expire: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  autoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  autoLabel: { fontSize: 14, color: colors.text },
  planCard: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: colors.bgSoft },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  planName: { fontSize: 16, fontWeight: '700', color: colors.text },
  planPrice: { fontSize: 18, fontWeight: '800', color: colors.accent },
  feature: { fontSize: 13, color: colors.textSecondary, paddingVertical: 3 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  orderAmt: { fontSize: 13, fontWeight: '600', color: colors.text },
  orderTime: { fontSize: 11, color: colors.textTertiary, marginLeft: 'auto' },
});
