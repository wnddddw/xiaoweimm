import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import PaymentWebView from '../../components/PaymentWebView';
import { paymentsApi } from '../../api';
import { colors } from '../../theme';

const QUICK_AMOUNTS = [100, 300, 600, 1800, 5000];

export default function PaymentScreen() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'wechat_h5' | 'alipay_h5'>('wechat_h5');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'recharge' | 'history' | 'bills'>('recharge');
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 轮询订单状态：指数退避（2s 起，逐步拉长），最长约 3 分钟，
  // 大额支付回调慢时不再 60 秒就误报超时
  const startPollOrder = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 40;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await paymentsApi.queryOrder(orderId);
        if (res.data.success && res.data.data?.status === 'paid') {
          pollTimerRef.current = null;
          setToast({ visible: true, message: '支付成功', type: 'success' });
          fetchData();
          return;
        }
      } catch (e) { /* ignore */ }
      if (cancelled) return;
      if (attempts >= maxAttempts) {
        pollTimerRef.current = null;
        setToast({ visible: true, message: '支付结果确认中，请稍后在交易记录中查看', type: 'error' });
        return;
      }
      const delay = Math.min(2000 * Math.pow(1.2, attempts), 8000);
      pollTimerRef.current = setTimeout(tick, delay);
    };

    pollTimerRef.current = setTimeout(tick, 2000);
  };

  const stopPollOrder = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current as any);
      pollTimerRef.current = null;
    }
  };

  const handleRecharge = async () => {
    const rechargeAmount = Math.round(+amount * 100) / 100;
    if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      setToast({ visible: true, message: '请输入有效金额', type: 'error' });
      return;
    }
    if (rechargeAmount > 100000) {
      setToast({ visible: true, message: '单笔充值不能超过 100,000 元', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await paymentsApi.createOrder(rechargeAmount, payMethod, '余额充值');
      if (res.data.success && res.data.data) {
        const { order_id, payment_url, dev_paid } = res.data.data;
        if (dev_paid) {
          setAmount('');
          setToast({ visible: true, message: `充值成功 ¥${rechargeAmount}`, type: 'success' });
          fetchData();
          setLoading(false);
          return;
        }
        // 后端未配置支付渠道时 payment_url 可能为空，此时不能进 WebView（白屏/崩溃风险）
        if (!payment_url) {
          setToast({ visible: true, message: '支付渠道暂不可用，请稍后再试或联系客服', type: 'error' });
          setLoading(false);
          return;
        }
        setCurrentOrderId(order_id);
        setPaymentUrl(payment_url);
        setWebViewVisible(true);
        setLoading(false);
      } else {
        setToast({ visible: true, message: res.data.error || '创建订单失败', type: 'error' });
        setLoading(false);
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '网络错误', type: 'error' });
      setLoading(false);
    }
  };

  const handleWebViewClose = () => {
    setWebViewVisible(false);
    if (currentOrderId) {
      startPollOrder(currentOrderId);
    }
  };

  const handlePaymentComplete = () => {
    setWebViewVisible(false);
    if (currentOrderId) {
      startPollOrder(currentOrderId);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />

        <Card>
          <Text style={styles.balanceLabel}>我的余额</Text>
          <Text style={styles.balanceNum}>¥{balance.toLocaleString()}</Text>
        </Card>

        <View style={styles.tabs}>
          {(['recharge', 'history', 'bills'] as const).map(item => (
            <Button
              key={item}
              title={item === 'recharge' ? '充值' : item === 'history' ? '记录' : '账单'}
              onPress={() => setTab(item)}
              variant={tab === item ? 'main' : 'gray'}
              size="sm"
            />
          ))}
        </View>

        {tab === 'recharge' && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>支付方式</Text>
              <View style={styles.payMethods}>
                <TouchableOpacity
                  style={[styles.payMethodBtn, payMethod === 'wechat_h5' && styles.payMethodActive]}
                  onPress={() => setPayMethod('wechat_h5')}
                >
                  <Text style={[styles.payMethodText, payMethod === 'wechat_h5' && styles.payMethodActiveText]}>
                    微信支付
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payMethodBtn, payMethod === 'alipay_h5' && styles.payMethodActive]}
                  onPress={() => setPayMethod('alipay_h5')}
                >
                  <Text style={[styles.payMethodText, payMethod === 'alipay_h5' && styles.payMethodActiveText]}>
                    支付宝
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>充值金额</Text>
              <TextInput
                style={styles.input}
                placeholder="输入金额（元）"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <View style={styles.quickAmts}>
                {QUICK_AMOUNTS.map(item => (
                  <Button
                    key={item}
                    title={`¥${item}`}
                    onPress={() => setAmount(String(item))}
                    variant="outline"
                    size="sm"
                  />
                ))}
              </View>
              <Button title="立即充值" onPress={handleRecharge} loading={loading} size="block" />
            </Card>
          </>
        )}

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

      <PaymentWebView
        visible={webViewVisible}
        url={paymentUrl}
        onClose={handleWebViewClose}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  balanceLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  balanceNum: { fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 16, marginBottom: 12, color: colors.text },
  quickAmts: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  payMethods: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  payMethodBtn: {
    flex: 1, padding: 14, borderRadius: 8, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.bgSoft,
  },
  payMethodActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  payMethodText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  payMethodActiveText: { color: colors.primary },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  green: { fontSize: 14, fontWeight: '600', color: colors.success },
  red: { fontSize: 14, fontWeight: '600', color: colors.danger },
  time: { fontSize: 11, color: colors.textTertiary },
  billItem: { fontSize: 13, color: colors.text },
  billAmt: { fontSize: 14, fontWeight: '600', color: colors.text },
});
