import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { dealsApi } from '../../api';

export default function DealCreate({ navigation }: any) {
  const [projectId, setProjectId] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [price, setPrice] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const submit = async () => {
    if (!projectId || !sellerName || !buyerName || !price) {
      setToast({ visible: true, message: 'Fill all required fields', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const res = await dealsApi.create({ project_id: projectId, seller_name: sellerName, buyer_name: buyerName, price: +price, advisor: advisor || 'Auto', note: note.trim() });
      if (res.data.success) {
        setToast({ visible: true, message: 'Deal created', type: 'success' });
        navigation.goBack();
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <Text style={styles.section}>Create Deal</Text>
        <TextInput style={styles.input} placeholder="Project ID *" value={projectId} onChangeText={setProjectId} />
        <TextInput style={styles.input} placeholder="Seller Name *" value={sellerName} onChangeText={setSellerName} />
        <TextInput style={styles.input} placeholder="Buyer Name *" value={buyerName} onChangeText={setBuyerName} />
        <TextInput style={styles.input} placeholder="Price (10k RMB) *" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Advisor (optional)" value={advisor} onChangeText={setAdvisor} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Notes..." value={note} onChangeText={setNote} multiline textAlignVertical="top" />
        <Button title="Create Deal" onPress={submit} loading={loading} size="block" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  section: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222' },
  textArea: { height: 80 },
});
