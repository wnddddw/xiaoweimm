import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { verifyApi } from '../../api';
import { Verification } from '../../types';
import { colors } from '../../theme';

export default function VerifyScreen() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [type, setType] = useState<'personal' | 'company'>('personal');
  const [name, setName] = useState('');
  const [idCardImg, setIdCardImg] = useState('');
  const [licenseImg, setLicenseImg] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await verifyApi.getStatus();
      if (res.data.success && res.data.data) setVerifications(res.data.data);
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const pickImage = async (setter: (value: string) => void) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) setter(result.assets[0].uri);
  };

  const submit = async () => {
    if (!name.trim()) { setToast({ visible: true, message: '请输入名称', type: 'error' }); return; }
    if (type === 'personal' && !idCardImg) { setToast({ visible: true, message: '请上传身份证照片', type: 'error' }); return; }
    if (type === 'company' && !licenseImg) { setToast({ visible: true, message: '请上传营业执照', type: 'error' }); return; }
    setLoading(true);
    try {
      await verifyApi.submit(type, { name: name.trim(), id_card_url: idCardImg, license_url: licenseImg });
      setToast({ visible: true, message: '认证资料已提交审核', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '提交失败', type: 'error' });
    } finally { setLoading(false); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge text="已通过" variant="ok" />;
      case 'pending': return <Badge text="审核中" variant="warn" />;
      case 'rejected': return <Badge text="未通过" variant="err" />;
      default: return <Badge text="未知状态" variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />

      {verifications.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>认证记录</Text>
          {verifications.map(item => (
            <View key={item.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyType}>{item.type === 'personal' ? '个人认证' : '企业认证'}</Text>
                <Text style={styles.historyTime}>{item.submit_time?.slice(0, 10)}</Text>
              </View>
              {statusBadge(item.status)}
              {item.reject_reason ? <Text style={styles.reject}>{item.reject_reason}</Text> : null}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>新建认证</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === 'personal' && styles.typeActive]} onPress={() => setType('personal')}>
            <Text style={[styles.typeText, type === 'personal' && styles.typeActiveText]}>个人认证</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'company' && styles.typeActive]} onPress={() => setType('company')}>
            <Text style={[styles.typeText, type === 'company' && styles.typeActiveText]}>企业认证</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder={type === 'personal' ? '真实姓名 *' : '企业名称 *'} value={name} onChangeText={setName} />
        {type === 'personal' ? (
          <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setIdCardImg)}>
            {idCardImg ? <Image source={{ uri: idCardImg }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>点击上传身份证照片 *</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setLicenseImg)}>
            {licenseImg ? <Image source={{ uri: licenseImg }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>点击上传营业执照 *</Text>}
          </TouchableOpacity>
        )}
        <Button title="提交审核" onPress={submit} loading={loading} size="block" />
        <Text style={styles.hint}>审核通常需要 10 分钟至 2 小时</Text>
      </Card>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  typeActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  typeText: { fontSize: 14, color: colors.textSecondary },
  typeActiveText: { color: colors.primary, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: colors.text },
  imgPicker: { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 8, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 14, overflow: 'hidden', backgroundColor: colors.bgSoft },
  imgPlaceholder: { color: colors.textTertiary, fontSize: 14 },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexWrap: 'wrap' },
  historyType: { fontSize: 14, fontWeight: '600', color: colors.text },
  historyTime: { fontSize: 11, color: colors.textTertiary },
  reject: { width: '100%', fontSize: 12, color: colors.danger, marginTop: 4 },
});
