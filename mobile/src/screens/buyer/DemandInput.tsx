import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import CascadePicker from '../../components/cascader/CascadePicker';
import { demandsApi } from '../../api';
import { industryData, regionData } from '../../utils/constants';

export default function DemandInput({ navigation }: any) {
  const [industryPicker, setIndustryPicker] = useState(false);
  const [regionPicker, setRegionPicker] = useState(false);
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [scale, setScale] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchExisting = useCallback(async () => {
    try {
      const res = await demandsApi.getMy();
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setIndustry(d.industry || ''); setSubIndustry(d.sub_industry || '');
        setProvince(d.province || ''); setCity(d.city || '');
        setBudgetMin(String(d.budget_min || '')); setBudgetMax(String(d.budget_max || ''));
        setScale(d.scale || ''); setPurpose(d.purpose || '');
        setPriority(d.priority || ''); setPayMethod(d.pay_method || '');
        setNote(d.note || '');
      }
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchExisting(); }, [fetchExisting]));

  const save = async () => {
    if (!industry || !subIndustry) { setToast({ visible: true, message: 'Select industry', type: 'error' }); return; }
    if (!province || !city) { setToast({ visible: true, message: 'Select region', type: 'error' }); return; }
    if (!purpose) { setToast({ visible: true, message: 'Select purpose', type: 'error' }); return; }
    setLoading(true);
    try {
      await demandsApi.save({ industry, sub_industry: subIndustry, province, city, budget_min: budgetMin || null, budget_max: budgetMax || null, scale, purpose, priority, pay_method: payMethod, note: note.trim() });
      setToast({ visible: true, message: 'Demand saved. Check AI recommendations!', type: 'success' });
      navigation.goBack();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <CascadePicker visible={industryPicker} data={industryData} title="Select Industry" onSelect={(p, c) => { setIndustry(p); setSubIndustry(c); }} onClose={() => setIndustryPicker(false)} />
      <CascadePicker visible={regionPicker} data={regionData} title="Select Region" onSelect={(p, c) => { setProvince(p); setCity(c); }} onClose={() => setRegionPicker(false)} />

      <Card>
        <Text style={styles.section}>Required Info</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setIndustryPicker(true)}>
          <Text style={industry ? styles.pickerVal : styles.pickerPlace}>{industry ? `${industry} / ${subIndustry}` : 'Select Industry *'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.picker} onPress={() => setRegionPicker(true)}>
          <Text style={province ? styles.pickerVal : styles.pickerPlace}>{province ? `${province} / ${city}` : 'Select Region *'}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min Budget (10k)" value={budgetMin} onChangeText={setBudgetMin} keyboardType="numeric" />
          <Text style={styles.dash}>-</Text>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Max Budget (10k)" value={budgetMax} onChangeText={setBudgetMax} keyboardType="numeric" />
        </View>

        <Text style={styles.label}>Scale</Text>
        <View style={styles.chipRow}>
          {['1-5','6-20','21-50','51-100','101-300','300+'].map(v => (
            <TouchableOpacity key={v} style={[styles.chip, scale === v && styles.chipActive]} onPress={() => setScale(v)}><Text style={[styles.chipText, scale === v && styles.chipActiveText]}>{v}</Text></TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Purpose *</Text>
        <View style={styles.chipRow}>
          {['创业','业务扩张','上下游整合','投资','多元化','其他'].map(v => (
            <TouchableOpacity key={v} style={[styles.chip, purpose === v && styles.chipActive]} onPress={() => setPurpose(v)}><Text style={[styles.chipText, purpose === v && styles.chipActiveText]}>{v}</Text></TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {['盈利稳定','成长潜力','管理团队','地理位置','价格优惠'].map(v => (
            <TouchableOpacity key={v} style={[styles.chip, priority === v && styles.chipActive]} onPress={() => setPriority(v)}><Text style={[styles.chipText, priority === v && styles.chipActiveText]}>{v}</Text></TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.chipRow}>
          {['全款现金','分期付款','股权置换','可协商'].map(v => (
            <TouchableOpacity key={v} style={[styles.chip, payMethod === v && styles.chipActive]} onPress={() => setPayMethod(v)}><Text style={[styles.chipText, payMethod === v && styles.chipActiveText]}>{v}</Text></TouchableOpacity>
          ))}
        </View>

        <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes..." value={note} onChangeText={setNote} multiline textAlignVertical="top" />
      </Card>

      <Button title="Save Demand" onPress={save} loading={loading} size="block" />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  section: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222' },
  textArea: { height: 80 },
  label: { fontSize: 13, fontWeight: '600', color: '#222', marginTop: 4, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dash: { fontSize: 18, color: '#888' },
  picker: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, marginBottom: 12, backgroundColor: '#fff' },
  pickerVal: { fontSize: 15, color: '#111', fontWeight: '500' },
  pickerPlace: { fontSize: 15, color: '#888' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#bbb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#d4e4fd', borderColor: '#1a44aa' },
  chipText: { fontSize: 13, color: '#555' },
  chipActiveText: { color: '#1a44aa', fontWeight: '600' },
});
