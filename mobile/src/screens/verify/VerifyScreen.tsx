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

  const pickImage = async (setter: (v: string) => void) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) setter(result.assets[0].uri);
  };

  const submit = async () => {
    if (!name.trim()) { setToast({ visible: true, message: 'Enter name', type: 'error' }); return; }
    if (type === 'personal' && !idCardImg) { setToast({ visible: true, message: 'Upload ID card', type: 'error' }); return; }
    if (type === 'company' && !licenseImg) { setToast({ visible: true, message: 'Upload business license', type: 'error' }); return; }
    setLoading(true);
    try {
      await verifyApi.submit(type, { name: name.trim(), id_card_url: idCardImg, license_url: licenseImg });
      setToast({ visible: true, message: 'Verification submitted for review', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'approved': return <Badge text="Approved" variant="ok" />;
      case 'pending': return <Badge text="Pending" variant="warn" />;
      case 'rejected': return <Badge text="Rejected" variant="err" />;
      default: return <Badge text={s || 'Unknown'} variant="gray" />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />

      {verifications.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Verification History</Text>
          {verifications.map(v => (
            <View key={v.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyType}>{v.type === 'personal' ? 'Personal' : 'Company'}</Text>
                <Text style={styles.historyTime}>{v.submit_time?.slice(0, 10)}</Text>
              </View>
              {statusBadge(v.status)}
              {v.reject_reason ? <Text style={styles.reject}>{v.reject_reason}</Text> : null}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>New Verification</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === 'personal' && styles.typeActive]} onPress={() => setType('personal')}>
            <Text style={[styles.typeText, type === 'personal' && styles.typeActiveText]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'company' && styles.typeActive]} onPress={() => setType('company')}>
            <Text style={[styles.typeText, type === 'company' && styles.typeActiveText]}>Company</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder={type === 'personal' ? 'Full Name *' : 'Company Name *'} value={name} onChangeText={setName} />
        {type === 'personal' ? (
          <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setIdCardImg)}>
            {idCardImg ? <Image source={{ uri: idCardImg }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>Tap to upload ID Card *</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.imgPicker} onPress={() => pickImage(setLicenseImg)}>
            {licenseImg ? <Image source={{ uri: licenseImg }} style={styles.img} /> : <Text style={styles.imgPlaceholder}>Tap to upload Business License *</Text>}
          </TouchableOpacity>
        )}
        <Button title="Submit for Review" onPress={submit} loading={loading} size="block" />
        <Text style={styles.hint}>Review takes 10 min ~ 2 hours</Text>
      </Card>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  typeActive: { borderColor: '#1a44aa', backgroundColor: '#e8f0fe' },
  typeText: { fontSize: 14, color: '#555' },
  typeActiveText: { color: '#1a44aa', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222' },
  imgPicker: { borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 14, overflow: 'hidden', backgroundColor: '#fafbfc' },
  imgPlaceholder: { color: '#999', fontSize: 14 },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  hint: { textAlign: 'center', fontSize: 12, color: '#555', marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexWrap: 'wrap' },
  historyType: { fontSize: 14, fontWeight: '600', color: '#111' },
  historyTime: { fontSize: 11, color: '#999' },
  reject: { width: '100%', fontSize: 12, color: '#c0392b', marginTop: 4 },
});
