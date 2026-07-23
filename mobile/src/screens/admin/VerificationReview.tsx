import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';
import { colors } from '../../theme';

export default function VerificationReview({ navigation }: any) {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getVerifications();
      if (res.data.success && res.data.data) setVerifications(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const approve = async (id: string) => {
    try {
      await adminApi.approveVerification(id);
      setToast({ visible: true, message: '认证已通过', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const reject = async (id: string) => {
    try {
      await adminApi.rejectVerification(id, '资料不完整');
      setToast({ visible: true, message: '认证已拒绝', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge text="待审" variant="warn" />;
      case 'approved': return <Badge text="已通过" variant="ok" />;
      case 'rejected': return <Badge text="已拒绝" variant="err" />;
      default: return <Badge text={s} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {verifications.length === 0 ? (
        <Card><Text style={styles.empty}>暂无认证申请</Text></Card>
      ) : (
        verifications.map(v => (
          <Card key={v.id} onPress={() => navigation.navigate('VerificationDetail', { verification: v })}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{v.real_name || v.company_name || v.user_name || v.phone || '未知'}</Text>
                <Text style={styles.phone}>{v.phone}</Text>
                <Text style={styles.type}>{v.type === 'personal' ? '个人认证' : '企业认证'}</Text>
                {v.status === 'rejected' && v.reject_reason ? (
                  <Text style={styles.reason}>驳回原因：{v.reject_reason}</Text>
                ) : null}
                <Text style={styles.time}>提交：{v.submit_time?.slice(0, 10)}</Text>
                {v.review_time ? <Text style={styles.time}>审核：{v.review_time?.slice(0, 10)}</Text> : null}
              </View>
              {statusBadge(v.status)}
            </View>
            {v.status === 'pending' && (
              <View style={styles.btnRow}>
                <Button title="通过" onPress={() => approve(v.id)} variant="green" size="sm" />
                <Button title="拒绝" onPress={() => reject(v.id)} variant="red" size="sm" />
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
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  phone: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  type: { fontSize: 13, color: colors.primary, marginTop: 3 },
  reason: { fontSize: 12, color: colors.danger, marginTop: 3 },
  time: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
