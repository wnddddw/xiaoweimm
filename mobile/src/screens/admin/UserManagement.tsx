import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';
import { colors } from '../../theme';

export default function UserManagement({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getUsers();
      if (res.data.success && res.data.data) setUsers(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await adminApi.setUserStatus(id, newStatus);
      setToast({ visible: true, message: newStatus === 'active' ? '用户已启用' : '用户已禁用', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {users.map(u => (
        <Card key={u.id} onPress={() => navigation.navigate('UserDetail', { user: u })}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.name || '未命名'}</Text>
              <Text style={styles.phone}>{u.phone}</Text>
              <View style={styles.badges}>
                <Badge text={u.role === 'admin' ? '管理员' : u.role === 'seller' ? '卖家' : u.role === 'buyer' ? '买家' : u.role} variant="info" />
                <Badge text={u.member_level || '免费'} variant="gray" />
                <Badge text={u.status === 'active' ? '正常' : '已禁用'} variant={u.status === 'active' ? 'ok' : 'err'} />
              </View>
            </View>
            <Button
              title={u.status === 'active' ? '禁用' : '启用'}
              onPress={() => toggleStatus(u.id, u.status)}
              variant={u.status === 'active' ? 'red' : 'green'}
              size="sm"
            />
          </View>
        </Card>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  phone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
});
