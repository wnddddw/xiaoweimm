import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi } from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getUsers();
      if (res.data.success && res.data.data) setUsers(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await adminApi.setUserStatus(id, newStatus);
      setToast({ visible: true, message: `User ${newStatus}`, type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      {users.map(u => (
        <Card key={u.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.name || 'Unnamed'}</Text>
              <Text style={styles.phone}>{u.phone}</Text>
              <View style={styles.badges}>
                <Badge text={u.role} variant="info" />
                <Badge text={u.member_level || 'free'} variant="gray" />
                <Badge text={u.status === 'active' ? 'Active' : 'Disabled'} variant={u.status === 'active' ? 'ok' : 'err'} />
              </View>
            </View>
            <Button
              title={u.status === 'active' ? 'Disable' : 'Enable'}
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
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  phone: { fontSize: 13, color: '#555', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
});
