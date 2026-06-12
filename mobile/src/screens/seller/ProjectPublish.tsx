import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import CascadePicker from '../../components/cascader/CascadePicker';
import { projectsApi } from '../../api/projects';
import { industryData, regionData } from '../../utils/constants';

export default function ProjectPublish({ navigation }: any) {
  const [industryPicker, setIndustryPicker] = useState(false);
  const [regionPicker, setRegionPicker] = useState(false);
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [revenue, setRevenue] = useState('');
  const [employees, setEmployees] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [profitRate, setProfitRate] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  // Inventory
  const [equipment, setEquipment] = useState([{ name: '', spec: '', qty: '', year: '', value: '' }]);
  const [rawMaterial, setRawMaterial] = useState([{ name: '', spec: '', qty: '', unit: '', value: '' }]);
  const [inventory, setInventory] = useState([{ name: '', spec: '', qty: '', unit: '', price: '' }]);
  // Privacy
  const [hideCompany, setHideCompany] = useState(false);
  const [hideAddress, setHideAddress] = useState(false);
  const [hideCustomers, setHideCustomers] = useState(true);
  const [hidePartners, setHidePartners] = useState(true);
  const [hideFinancial, setHideFinancial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const addEquip = () => setEquipment([...equipment, { name: '', spec: '', qty: '', year: '', value: '' }]);
  const addMaterial = () => setRawMaterial([...rawMaterial, { name: '', spec: '', qty: '', unit: '', value: '' }]);
  const addInventory = () => setInventory([...inventory, { name: '', spec: '', qty: '', unit: '', price: '' }]);

  const submit = async () => {
    if (!industry || !subIndustry) { setToast({ visible: true, message: 'Please select industry', type: 'error' }); return; }
    if (!province || !city) { setToast({ visible: true, message: 'Please select region', type: 'error' }); return; }
    if (!revenue || +revenue <= 0) { setToast({ visible: true, message: 'Enter annual revenue', type: 'error' }); return; }
    if (!employees) { setToast({ visible: true, message: 'Select employee count', type: 'error' }); return; }
    if (!transferReason) { setToast({ visible: true, message: 'Select transfer reason', type: 'error' }); return; }
    if (!profitRate) { setToast({ visible: true, message: 'Enter profit rate', type: 'error' }); return; }
    if (!price || +price <= 0) { setToast({ visible: true, message: 'Enter desired price', type: 'error' }); return; }
    if (!description.trim()) { setToast({ visible: true, message: 'Enter description', type: 'error' }); return; }
    setLoading(true);
    try {
      const res = await projectsApi.create({
        industry, sub_industry: subIndustry, province, city,
        revenue: +revenue, employees, transfer_reason: transferReason,
        profit_rate: +profitRate, price: +price, description: description.trim(),
        equipment: JSON.stringify(equipment.filter(e => e.name)),
        raw_material: JSON.stringify(rawMaterial.filter(m => m.name)),
        inventory: JSON.stringify(inventory.filter(i => i.name)),
        hide_company: hideCompany ? 1 : 0, hide_address: hideAddress ? 1 : 0,
        hide_customers: hideCustomers ? 1 : 0, hide_partners: hidePartners ? 1 : 0,
        hide_financial: hideFinancial ? 1 : 0,
      } as any);
      if (res.data.success) {
        setToast({ visible: true, message: 'Project submitted for review', type: 'success' });
        navigation.goBack();
      }
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
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setIndustryPicker(true)}>
          <Text style={industry ? styles.pickerVal : styles.pickerPlace}>{industry ? `${industry} / ${subIndustry}` : 'Select Industry *'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setRegionPicker(true)}>
          <Text style={province ? styles.pickerVal : styles.pickerPlace}>{province ? `${province} / ${city}` : 'Select Region *'}</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="Annual Revenue (10k RMB) *" value={revenue} onChangeText={setRevenue} keyboardType="numeric" />
        <View style={styles.pickerBtn}>
          <Text style={styles.label}>Employees *</Text>
          <View style={styles.chipRow}>
            {['1-5','6-20','21-50','51-100','101-300','300+'].map(v => (
              <TouchableOpacity key={v} style={[styles.chip, employees === v && styles.chipActive]} onPress={() => setEmployees(v)}>
                <Text style={[styles.chipText, employees === v && styles.chipActiveText]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.label}>Transfer Reason *</Text>
        <View style={styles.chipRow}>
          {[{ k:'no_heir', v:'No Heir' },{ k:'owner_age', v:'Owner Age' },{ k:'transformation', v:'Transformation' },{ k:'other', v:'Other' }].map(r => (
            <TouchableOpacity key={r.k} style={[styles.chip, transferReason === r.k && styles.chipActive]} onPress={() => setTransferReason(r.k)}>
              <Text style={[styles.chipText, transferReason === r.k && styles.chipActiveText]}>{r.v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Financial</Text>
        <TextInput style={styles.input} placeholder="Profit Rate (%) *" value={profitRate} onChangeText={setProfitRate} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Desired Price (10k RMB) *" value={price} onChangeText={setPrice} keyboardType="numeric" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the project..." value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        <PrivacyRow label="Hide Company Name" value={hideCompany} onChange={setHideCompany} />
        <PrivacyRow label="Hide Address" value={hideAddress} onChange={setHideAddress} />
        <PrivacyRow label="Hide Customer List" value={hideCustomers} onChange={setHideCustomers} />
        <PrivacyRow label="Hide Partner Names" value={hidePartners} onChange={setHidePartners} />
        <PrivacyRow label="Hide Financial Details" value={hideFinancial} onChange={setHideFinancial} />
      </Card>

      <Button title="Submit for Review" onPress={submit} loading={loading} size="block" />
      <Text style={styles.hint}>Review takes 10 min ~ 2 hours</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function PrivacyRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.privacyRow}>
      <Text style={styles.privacyLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#ccc', true: '#1a44aa' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222' },
  textArea: { height: 120 },
  label: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 6 },
  pickerBtn: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, marginBottom: 12, backgroundColor: '#fff' },
  pickerVal: { fontSize: 15, color: '#111', fontWeight: '500' },
  pickerPlace: { fontSize: 15, color: '#888' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#bbb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#d4e4fd', borderColor: '#1a44aa' },
  chipText: { fontSize: 13, color: '#555' },
  chipActiveText: { color: '#1a44aa', fontWeight: '600' },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  privacyLabel: { fontSize: 14, color: '#333' },
  hint: { textAlign: 'center', fontSize: 12, color: '#555', marginTop: 8 },
});
