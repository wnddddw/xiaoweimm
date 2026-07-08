import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function UserDetailScreen({ route }: any) {
  const { user } = route.params;
  const [data, setData] = useState<any>(user);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const roleLabel = (r: string) => ({ admin:'管理员', seller:'卖家', buyer:'买家' }[r] || r);
  const verifyLabel = (v: string) => 
    ({ approved:'已认证', pending:'待审', rejected:'已拒绝' }[v] || v || '未认证');

  const toggleStatus = async () => {
    const ns = data.status === 'active' ? 'disabled' : 'active';
    try {
      await adminApi.setUserStatus(data.id, ns);
      setToast({ visible: true, message: ns === 'active' ? '用户已启用' : '用户已禁用', type: 'success' });
      setData((d: any) => ({ ...d, status: ns }));
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />

      <Card>
        <View style={styles.hr}>
          <Text style={styles.pid}>{data.id?.slice(0, 8)}...</Text>
          <Badge text={data.status === 'active' ? '正常' : '已禁用'} variant={data.status === 'active' ? 'ok' : 'err'} />
        </View>
      </Card>

      <Card>
        <Text style={styles.st}>基本信息</Text>
        <InfoRow label="姓名" value={data.name || '未命名'} />
        <InfoRow label="手机号" value={data.phone || '-'} />
        <InfoRow label="角色" value={roleLabel(data.role)} />
        <InfoRow label="会员等级" value={data.member_level || '免费'} />
        <InfoRow label="认证状态" value={verifyLabel(data.verify_status)} />
        <InfoRow label="注册时间" value={data.created_at?.slice(0, 10) || '-'} />
      </Card>

      <View style={styles.btnRow}>
        <Button
          title={data.status === 'active' ? '禁用账号' : '启用账号'}
          onPress={toggleStatus}
          variant={data.status === 'active' ? 'red' : 'green'}
          size="block"
        />
      </View>

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
  btnRow: { marginTop: 16 },
});
