import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { verifyApi, getApiErrorMessage, UploadFile } from '../../api';
import { colors } from '../../theme';

// 后端 /verify/status 返回单对象（最新一条）或 { status: 'none' }
interface VerificationRecord {
  id?: string;
  type?: 'personal' | 'company';
  real_name?: string;
  company_name?: string;
  status: string;
  reject_reason?: string;
  submit_time?: string;
  review_time?: string;
}

export default function VerifyScreen() {
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [type, setType] = useState<'personal' | 'company'>('personal');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [legalPerson, setLegalPerson] = useState('');
  const [idCardImg, setIdCardImg] = useState<UploadFile | null>(null);
  const [licenseImg, setLicenseImg] = useState<UploadFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await verifyApi.getStatus();
      if (res.data.success && res.data.data && res.data.data.status && res.data.data.status !== 'none') {
        setRecord(res.data.data);
      } else {
        setRecord(null);
      }
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const pickImage = async (setter: (value: UploadFile) => void) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setter({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const submit = async () => {
    if (!name.trim()) { setToast({ visible: true, message: type === 'personal' ? '请输入真实姓名' : '请输入企业名称', type: 'error' }); return; }
    if (type === 'personal') {
      if (!idNumber.trim()) { setToast({ visible: true, message: '请输入身份证号', type: 'error' }); return; }
      if (!/^\d{15}(\d{2}[0-9Xx])?$/.test(idNumber.trim())) { setToast({ visible: true, message: '身份证号格式不正确', type: 'error' }); return; }
      if (!idCardImg) { setToast({ visible: true, message: '请上传身份证照片', type: 'error' }); return; }
    } else {
      if (!legalPerson.trim()) { setToast({ visible: true, message: '请输入法定代表人', type: 'error' }); return; }
      if (!licenseImg) { setToast({ visible: true, message: '请上传营业执照', type: 'error' }); return; }
    }
    setLoading(true);
    try {
      // multipart 表单：字段名对齐后端 multer（real_name/id_number/id_card、company_name/legal_person/license）
      const formData = new FormData();
      formData.append('type', type);
      if (type === 'personal') {
        formData.append('real_name', name.trim());
        formData.append('id_number', idNumber.trim());
        formData.append('id_card', idCardImg as any);
      } else {
        formData.append('company_name', name.trim());
        formData.append('legal_person', legalPerson.trim());
        formData.append('license', licenseImg as any);
      }
      // 已有被驳回记录时走重新提交通道
      if (record?.status === 'rejected') {
        await verifyApi.resubmit(formData);
      } else {
        await verifyApi.submit(formData);
      }
      setToast({ visible: true, message: '认证资料已提交审核', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: getApiErrorMessage(e, '提交失败'), type: 'error' });
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

  const canSubmitNew = !record || record.status === 'rejected';

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />

      {record && (
        <Card>
          <Text style={styles.sectionTitle}>认证状态</Text>
          <View style={styles.historyRow}>
            <View>
              <Text style={styles.historyType}>{record.type === 'personal' ? '个人认证' : '企业认证'}</Text>
              <Text style={styles.historyName}>{record.real_name || record.company_name || ''}</Text>
              <Text style={styles.historyTime}>{record.submit_time?.slice(0, 10)}</Text>
            </View>
            {statusBadge(record.status)}
            {record.reject_reason ? <Text style={styles.reject}>驳回原因：{record.reject_reason}</Text> : null}
          </View>
        </Card>
      )}

      {canSubmitNew ? (
        <Card>
          <Text style={styles.sectionTitle}>{record?.status === 'rejected' ? '重新提交认证' : '新建认证'}</Text>
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
            <>
              <TextInput style={styles.input} placeholder={'身份证号 *'} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
              <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setIdCardImg)}>
                {idCardImg ? <Image source={{ uri: idCardImg.uri }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>点击上传身份证照片 *</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput style={styles.input} placeholder={'法定代表人 *'} value={legalPerson} onChangeText={setLegalPerson} />
              <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setLicenseImg)}>
                {licenseImg ? <Image source={{ uri: licenseImg.uri }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>点击上传营业执照 *</Text>}
              </TouchableOpacity>
            </>
          )}
          <Button title="提交审核" onPress={submit} loading={loading} size="block" />
          <Text style={styles.hint}>审核通常需要 10 分钟至 2 小时</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.hint}>
            {record?.status === 'pending' ? '认证资料审核中，请耐心等待' : '您已完成实名认证'}
          </Text>
        </Card>
      )}
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
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, flexWrap: 'wrap' },
  historyType: { fontSize: 14, fontWeight: '600', color: colors.text },
  historyName: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  historyTime: { fontSize: 11, color: colors.textTertiary },
  reject: { width: '100%', fontSize: 12, color: colors.danger, marginTop: 4 },
});
