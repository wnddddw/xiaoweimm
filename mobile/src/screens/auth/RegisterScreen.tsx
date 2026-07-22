import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { authApi, getApiErrorMessage } from '../../api';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { colors } from '../../theme';

export default function RegisterScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });
  const { register } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleGetCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setToast({ visible: true, message: '请输入有效手机号', type: 'error' });
      return;
    }
    if (countdown > 0) return;
    try {
      const res = await authApi.requestSmsCode(phone);
      if (res.data.success) {
        setToast({ visible: true, message: res.data.data?.message || '验证码已发送', type: 'success' });
        // Start 60s countdown
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setToast({ visible: true, message: res.data.error || '发送失败', type: 'error' });
      }
    } catch (e: any) {
      setToast({ visible: true, message: getApiErrorMessage(e, '网络错误'), type: 'error' });
    }
  };

  const handleRegister = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setToast({ visible: true, message: '请输入有效手机号', type: 'error' }); return;
    }
    if (!code || code.length < 4) {
      setToast({ visible: true, message: '请输入验证码', type: 'error' }); return;
    }
    if (!password || password.length < 6) {
      setToast({ visible: true, message: '密码至少6位', type: 'error' }); return;
    }
    setLoading(true);
    try {
      await register(phone, code, password, name, role);
    } catch (e: any) {
      setToast({ visible: true, message: getApiErrorMessage(e, '注册失败'), type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.logo}>xiaoweimm</Text>
          <Text style={styles.subtitle}>创建账号</Text>
          <TextInput style={styles.input} placeholder="手机号" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} />
          <View style={styles.smsRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="短信验证码" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <TouchableOpacity
              style={[styles.smsBtn, countdown > 0 && styles.smsBtnDisabled]}
              onPress={handleGetCode}
              disabled={countdown > 0}
            >
              <Text style={styles.smsBtnText}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="设置密码（至少6位）" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="姓名（选填）" value={name} onChangeText={setName} />
          <View style={styles.roleRow}>
            <TouchableOpacity style={[styles.roleBtn, role === 'seller' && styles.roleActive]} onPress={() => setRole('seller')}>
              <Text style={[styles.roleText, role === 'seller' && styles.roleActiveText]}>我是卖家</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleBtn, role === 'buyer' && styles.roleActive]} onPress={() => setRole('buyer')}>
              <Text style={[styles.roleText, role === 'buyer' && styles.roleActiveText]}>我是买家</Text>
            </TouchableOpacity>
          </View>
          <Button title="注册" onPress={handleRegister} loading={loading} size="block" />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
            <Text style={styles.linkText}>已有账号？去登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 28, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
  logo: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 14, color: colors.text },
  smsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  smsBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', height: 50 },
  smsBtnDisabled: { backgroundColor: colors.textTertiary },
  smsBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  roleBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleText: { fontSize: 14, color: colors.textSecondary },
  roleActiveText: { color: colors.primary, fontWeight: '600' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
