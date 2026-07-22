import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../store/AuthContext';

const roleLabel = (role?: string) => {
  switch (role) {
    case 'seller': return '卖家';
    case 'buyer': return '买家';
    case 'admin': return '管理员';
    default: return '-';
  }
};

const memberLabel = (level?: string) => {
  switch (level) {
    case 'personal': return '个人会员';
    case 'company': return '企业会员';
    case 'vip': return '企业 VIP';
    case 'free':
    default: return '免费版';
  }
};

const verifyLabel = (status?: string) => {
  switch (status) {
    case 'pending': return '审核中';
    case 'approved': return '已认证';
    case 'rejected': return '未通过';
    case 'none':
    default: return '未认证';
  }
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const updateProfile = async () => {
    setLoading(true);
    try {
      const api = (await import('../../api')).api;
      await api.put('/users/profile', { name: name.trim() });
      setEditingName(false);
      setToast({ visible: true, message: '资料已更新', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '更新失败', type: 'error' });
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!oldPwd || !newPwd || newPwd.length < 6) {
      setToast({ visible: true, message: '请完整填写密码，且新密码不少于 6 位', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const api = (await import('../../api')).api;
      await api.put('/users/password', { old_password: oldPwd, new_password: newPwd });
      setOldPwd(''); setNewPwd('');
      setToast({ visible: true, message: '密码已修改', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '修改失败', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || '我')[0].toUpperCase()}</Text>
        </View>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} />
            <Button title="保存" onPress={updateProfile} loading={loading} size="sm" />
            <Button title="取消" onPress={() => setEditingName(false)} variant="gray" size="sm" />
          </View>
        ) : (
          <TouchableEdit onPress={() => setEditingName(true)}>
            <Text style={styles.name}>{user?.name || '用户'}</Text>
            <Text style={styles.editHint}>点击修改姓名</Text>
          </TouchableEdit>
        )}
        <DetailRow label="手机号" value={user?.phone || '-'} />
        <DetailRow label="账号角色" value={roleLabel(user?.role)} />
        <DetailRow label="会员等级" value={memberLabel(user?.member_level)} />
        <DetailRow label="认证状态" value={verifyLabel(user?.verify_status)} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>修改密码</Text>
        <TextInput style={styles.input} placeholder="当前密码" value={oldPwd} onChangeText={setOldPwd} secureTextEntry />
        <TextInput style={styles.input} placeholder="新密码（至少 6 位）" value={newPwd} onChangeText={setNewPwd} secureTextEntry />
        <Button title="更新密码" onPress={changePassword} loading={loading} size="block" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>账号服务</Text>
        <Button title="企业认证" onPress={() => navigation.navigate('Verify')} variant="outline" size="block" />
        <View style={{ height: 10 }} />
        <Button title="钱包与账单" onPress={() => navigation.navigate('Payment')} variant="outline" size="block" />
      </Card>

      <Button title="退出登录" onPress={logout} variant="red" size="block" />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function TouchableEdit({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a44aa', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center' },
  editHint: { fontSize: 11, color: '#1a44aa', textAlign: 'center', marginTop: 2 },
  editRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { width: 80, fontSize: 13, fontWeight: '600', color: '#555' },
  value: { fontSize: 14, color: '#111' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222' },
});
