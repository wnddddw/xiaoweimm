import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authApi, getApiErrorMessage } from '../../api';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme';

type LoginMode = 'password' | 'sms';

export default function LoginScreen({ navigation }: any) {
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });
  const { login, loginSms } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const showError = (message: string) => {
    setToast({ visible: true, message, type: 'error' });
  };

  const isValidPhone = () => /^1[3-9]\d{9}$/.test(phone);

  const startCountdown = () => {
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
  };

  const handleGetCode = async () => {
    if (!isValidPhone()) {
      showError('请输入有效手机号');
      return;
    }
    if (countdown > 0) return;

    try {
      const res = await authApi.requestSmsCode(phone);
      if (!res.data.success) {
        showError(res.data.error || '验证码发送失败');
        return;
      }
      setToast({ visible: true, message: res.data.data?.message || '验证码已发送', type: 'success' });
      startCountdown();
    } catch (error: any) {
      showError(getApiErrorMessage(error, '网络错误，请稍后重试'));
    }
  };

  const handleLogin = async () => {
    if (!isValidPhone()) {
      showError('请输入有效手机号');
      return;
    }
    if (mode === 'password' && !password) {
      showError('请输入登录密码');
      return;
    }
    if (mode === 'sms' && code.length < 4) {
      showError('请输入短信验证码');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'password') {
        await login(phone, password);
      } else {
        await loginSms(phone, code);
      }
    } catch (error: any) {
      showError(getApiErrorMessage(error, '登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <View style={styles.card}>
        <Text style={styles.logo}>xiaoweimm</Text>
        <Text style={styles.subtitle}>中小企业并购服务平台</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'password' && styles.modeActive]} onPress={() => setMode('password')}>
            <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>密码登录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'sms' && styles.modeActive]} onPress={() => setMode('sms')}>
            <Text style={[styles.modeText, mode === 'sms' && styles.modeTextActive]}>短信登录</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="请输入手机号" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} />
        {mode === 'password' ? (
          <TextInput style={styles.input} placeholder="请输入登录密码" value={password} onChangeText={setPassword} secureTextEntry />
        ) : (
          <View style={styles.smsRow}>
            <TextInput style={[styles.input, styles.smsInput]} placeholder="请输入短信验证码" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <TouchableOpacity style={[styles.smsBtn, countdown > 0 && styles.smsBtnDisabled]} onPress={handleGetCode} disabled={countdown > 0}>
              <Text style={styles.smsBtnText}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button title="登录" onPress={handleLogin} loading={loading} size="block" />
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>没有账号？立即注册</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 28, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
  logo: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, marginTop: 4 },
  modeRow: { flexDirection: 'row', backgroundColor: colors.bgSoft, borderRadius: 10, padding: 4, marginBottom: 16 },
  modeBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  modeActive: { backgroundColor: colors.white, shadowColor: colors.black, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  modeText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  modeTextActive: { color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 14, color: colors.text },
  smsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  smsInput: { flex: 1, marginBottom: 0 },
  smsBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center', minWidth: 106 },
  smsBtnDisabled: { backgroundColor: colors.textTertiary },
  smsBtnText: { color: colors.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
