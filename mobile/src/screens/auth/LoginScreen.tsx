import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) { setToast({ visible: true, message: 'Please enter valid phone', type: 'error' }); return; }
    if (!password) { setToast({ visible: true, message: 'Please enter password', type: 'error' }); return; }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Login failed', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <View style={styles.card}>
        <Text style={styles.logo}>xiaoweimm</Text>
        <Text style={styles.subtitle}>企业并购平台</Text>
        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Login" onPress={handleLogin} loading={loading} size="block" />
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>No account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f4f6fa', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
  logo: { fontSize: 32, fontWeight: '700', color: '#1a44aa', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 14, color: '#222' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#1a44aa', fontSize: 14 },
});
