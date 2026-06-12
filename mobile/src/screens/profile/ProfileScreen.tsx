import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../store/AuthContext';
import { authApi } from '../../api/auth';

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
      setToast({ visible: true, message: 'Profile updated', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!oldPwd || !newPwd || newPwd.length < 6) {
      setToast({ visible: true, message: 'Check password fields', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const api = (await import('../../api')).api;
      await api.put('/users/password', { old_password: oldPwd, new_password: newPwd });
      setOldPwd(''); setNewPwd('');
      setToast({ visible: true, message: 'Password changed', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} />
            <Button title="Save" onPress={updateProfile} loading={loading} size="sm" />
            <Button title="Cancel" onPress={() => setEditingName(false)} variant="gray" size="sm" />
          </View>
        ) : (
          <TouchableEdit onPress={() => setEditingName(true)}>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.editHint}>Tap to edit</Text>
          </TouchableEdit>
        )}
        <DetailRow label="Phone" value={user?.phone || '-'} />
        <DetailRow label="Role" value={user?.role || '-'} />
        <DetailRow label="Member" value={(user?.member_level || 'free').toUpperCase()} />
        <DetailRow label="Verify" value={user?.verify_status || 'none'} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput style={styles.input} placeholder="Current password" value={oldPwd} onChangeText={setOldPwd} secureTextEntry />
        <TextInput style={styles.input} placeholder="New password (min 6 chars)" value={newPwd} onChangeText={setNewPwd} secureTextEntry />
        <Button title="Update Password" onPress={changePassword} loading={loading} size="block" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Verification</Text>
        <Button title="Go to Verification" onPress={() => navigation.navigate('Verify')} variant="outline" size="block" />
        <View style={{ height: 10 }} />
        <Button title="Wallet & Payments" onPress={() => navigation.navigate('Payment')} variant="outline" size="block" />
      </Card>

      <Button title="Logout" onPress={logout} variant="red" size="block" />
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
