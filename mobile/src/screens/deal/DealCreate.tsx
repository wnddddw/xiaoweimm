import React, { useState } from 'react';
import { Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { dealsApi } from '../../api';
import { colors } from '../../theme';

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
      setToast({ visible: true, message: '请填写所有必填项', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const res = await dealsApi.create({ project_id: projectId, seller_name: sellerName, buyer_name: buyerName, price: +price, advisor: advisor || '系统分配', note: note.trim() });
      if (res.data.success) {
        setToast({ visible: true, message: '交易已创建', type: 'success' });
        navigation.goBack();
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '创建失败', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <Card>
        <Text style={styles.section}>创建交易</Text>
        <TextInput style={styles.input} placeholder="项目编号 *" value={projectId} onChangeText={setProjectId} />
        <TextInput style={styles.input} placeholder="卖方名称 *" value={sellerName} onChangeText={setSellerName} />
        <TextInput style={styles.input} placeholder="买方名称 *" value={buyerName} onChangeText={setBuyerName} />
        <TextInput style={styles.input} placeholder="交易价格（万元） *" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="负责顾问（选填）" value={advisor} onChangeText={setAdvisor} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="备注" value={note} onChangeText={setNote} multiline textAlignVertical="top" />
        <Button title="创建交易" onPress={submit} loading={loading} size="block" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: colors.text },
  textArea: { height: 80 },
});
