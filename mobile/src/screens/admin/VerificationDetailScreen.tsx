import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function VerificationDetailScreen({ route }: any) {
  const { verification } = route.params;
  const [data, setData] = useState<any>(verification);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const approve = async () => {
    try {
      await adminApi.approveVerification(data.id);
      setToast({ visible: true, message: '认证已通过', type: 'success' });
      setData((d: any) => ({ ...d, status: 'approved', review_time: new Date().toISOString() }));
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const reject = async () => {
    try {
      await adminApi.rejectVerification(data.id, '资料不完整');
      setToast({ visible: true, message: '认证已拒绝', type: 'success' });
      setData((d: any) => ({ ...d, status: 'rejected', review_time: new Date().toISOString(), reject_reason: '资料不完整' }));
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const sl = (s: string) => ({ pending:'待审', approved:'已通过', rejected:'已拒绝' }[s] || s);
  const sv = (s: string) => ({ pending:'warn', approved:'ok', rejected:'err' }[s] || 'gray') as 'warn'|'ok'|'err'|'gray';
  const isPersonal = data.type === 'personal';

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />

      <Card>
        <View style={styles.hr}>
          <Text style={styles.pid}>{data.id}</Text>
          <Badge text={sl(data.status)} variant={sv(data.status)} />
        </View>
      </Card>

      <Card>
        <Text style={styles.st}>用户信息</Text>
        <InfoRow label="手机号" value={data.phone || '-'} />
        <InfoRow label="姓名" value={data.user_name || data.real_name || '-'} />
        <InfoRow label="认证类型" value={isPersonal ? '个人认证' : '企业认证'} />
      </Card>

      {isPersonal ? (
        <Card>
          <Text style={styles.st}>个人认证信息</Text>
          <InfoRow label="真实姓名" value={data.real_name || '-'} />
          <InfoRow label="身份证号" value={data.id_number || '-'} />
          <InfoRow label="地址" value={data.address || '-'} />
        </Card>
      ) : (
        <Card>
          <Text style={styles.st}>企业认证信息</Text>
          <InfoRow label="企业名称" value={data.company_name || '-'} />
          <InfoRow label="法定代表人" value={data.legal_person || '-'} />
          <InfoRow label="行业类型" value={data.biz_type || '-'} />
        </Card>
      )}

      <Card>
        <Text style={styles.st}>提交记录</Text>
        <InfoRow label="提交时间" value={data.submit_time?.slice(0, 10) || '-'} />
        <InfoRow label="审核时间" value={data.review_time?.slice(0, 10) || '-'} />
        {data.status === 'rejected' && data.reject_reason ? (
          <InfoRow label="驳回原因" value={data.reject_reason} />
        ) : null}
      </Card>

      {data.status === 'pending' && (
        <View style={styles.btnRow}>
          <Button title="通过" onPress={approve} variant="green" size="block" />
          <Button title="拒绝" onPress={reject} variant="red" size="block" />
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ir}>
      <Text style={styles.il}>{label}</Text>
      <Text style={styles.iv}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  hr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  st: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  ir: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8e8e8' },
  il: { width: 80, fontSize: 13, color: '#888' },
  iv: { flex: 1, fontSize: 13, color: '#222' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
