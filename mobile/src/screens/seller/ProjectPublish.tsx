import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CascadePicker from '../../components/cascader/CascadePicker';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { sellerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { projectsApi } from '../../api/projects';
import { industryData, regionData } from '../../utils/constants';

type AssetRow = { name: string; spec: string; qty: string; unitOrYear: string; value: string };

const emptyAsset = (): AssetRow => ({ name: '', spec: '', qty: '', unitOrYear: '', value: '' });
const employeeOptions = ['1-5', '6-20', '21-50', '51-100', '101-300', '300+'];

export default function ProjectPublish({ navigation }: any) {
  const [industryPicker, setIndustryPicker] = useState(false);
  const [regionPicker, setRegionPicker] = useState(false);
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [revenue, setRevenue] = useState('');
  const [employees, setEmployees] = useState('');
  const [profitRate, setProfitRate] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState<AssetRow[]>([emptyAsset()]);
  const [rawMaterial, setRawMaterial] = useState<AssetRow[]>([emptyAsset()]);
  const [inventory, setInventory] = useState<AssetRow[]>([emptyAsset()]);
  const [hideCompany, setHideCompany] = useState(false);
  const [hideAddress, setHideAddress] = useState(false);
  const [hideCustomers, setHideCustomers] = useState(true);
  const [hidePartners, setHidePartners] = useState(true);
  const [hideFinancial, setHideFinancial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const showError = (message: string) => setToast({ visible: true, message, type: 'error' });

  const updateAsset = (rows: AssetRow[], setRows: (rows: AssetRow[]) => void, index: number, key: keyof AssetRow, value: string) => {
    setRows(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };

  const validateAssets = (label: string, rows: AssetRow[]) => {
    if (!rows.length) return `${label}至少添加一行`;
    const invalidIndex = rows.findIndex(row => !row.name.trim() || !row.spec.trim() || !row.qty.trim() || !row.unitOrYear.trim() || !row.value.trim());
    return invalidIndex >= 0 ? `${label}第 ${invalidIndex + 1} 行请补全名称、规格、数量、年份/单位、价格` : '';
  };

  const submit = async () => {
    if (!industry || !subIndustry) { showError('请选择行业'); return; }
    if (!province || !city) { showError('请选择地区'); return; }
    if (!revenue || +revenue <= 0) { showError('请输入年营收'); return; }
    if (!employees) { showError('请选择员工规模'); return; }
    if (!profitRate) { showError('请输入利润率'); return; }
    if (!price || +price <= 0) { showError('请输入期望转让价格'); return; }
    if (!description.trim()) { showError('请输入项目说明'); return; }

    const assetError = validateAssets('设备', equipment) || validateAssets('原料', rawMaterial) || validateAssets('库存', inventory);
    if (assetError) { showError(assetError); return; }

    setLoading(true);
    try {
      const res = await projectsApi.create({
        industry,
        sub_industry: subIndustry,
        province,
        city,
        revenue: +revenue,
        employees,
        transfer_reason: '',
        profit_rate: +profitRate,
        price: +price,
        description: description.trim(),
        equipment: JSON.stringify(equipment),
        raw_material: JSON.stringify(rawMaterial),
        inventory: JSON.stringify(inventory),
        hide_company: hideCompany ? 1 : 0,
        hide_address: hideAddress ? 1 : 0,
        hide_customers: hideCustomers ? 1 : 0,
        hide_partners: hidePartners ? 1 : 0,
        hide_financial: hideFinancial ? 1 : 0,
      } as any);
      if (res.data.success) {
        setToast({ visible: true, message: '项目已提交审核', type: 'success' });
        navigation.goBack();
      } else {
        showError(res.data.error || '提交失败');
      }
    } catch (error: any) {
      showError(error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <WorkbenchTabs tabs={sellerWorkbenchTabs} activeKey="publish" navigation={navigation} />
      <CascadePicker visible={industryPicker} data={industryData} title="选择行业" onSelect={(parent, child) => { setIndustry(parent); setSubIndustry(child); }} onClose={() => setIndustryPicker(false)} />
      <CascadePicker visible={regionPicker} data={regionData} title="选择地区" onSelect={(parent, child) => { setProvince(parent); setCity(child); }} onClose={() => setRegionPicker(false)} />

      <Card>
        <Text style={styles.sectionTitle}>基础信息</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setIndustryPicker(true)}>
          <Text style={industry ? styles.pickerVal : styles.pickerPlace}>{industry ? `${industry} / ${subIndustry}` : '请选择行业 *'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setRegionPicker(true)}>
          <Text style={province ? styles.pickerVal : styles.pickerPlace}>{province ? `${province} / ${city}` : '请选择地区 *'}</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="年营收（万元）*" value={revenue} onChangeText={setRevenue} keyboardType="numeric" />
        <Text style={styles.label}>员工规模 *</Text>
        <View style={styles.chipRow}>
          {employeeOptions.map(option => (
            <TouchableOpacity key={option} style={[styles.chip, employees === option && styles.chipActive]} onPress={() => setEmployees(option)}>
              <Text style={[styles.chipText, employees === option && styles.chipActiveText]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>财务信息</Text>
        <TextInput style={styles.input} placeholder="利润率（%）*" value={profitRate} onChangeText={setProfitRate} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="期望转让价格（万元）*" value={price} onChangeText={setPrice} keyboardType="numeric" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>项目说明</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="请说明项目亮点、经营状态和适合的接手方..." value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" />
      </Card>

      <AssetSection title="设备清单" rows={equipment} onChange={(index, key, value) => updateAsset(equipment, setEquipment, index, key, value)} onAdd={() => setEquipment([...equipment, emptyAsset()])} unitLabel="年份" />
      <AssetSection title="原料清单" rows={rawMaterial} onChange={(index, key, value) => updateAsset(rawMaterial, setRawMaterial, index, key, value)} onAdd={() => setRawMaterial([...rawMaterial, emptyAsset()])} unitLabel="单位" />
      <AssetSection title="库存清单" rows={inventory} onChange={(index, key, value) => updateAsset(inventory, setInventory, index, key, value)} onAdd={() => setInventory([...inventory, emptyAsset()])} unitLabel="单位" />

      <Card>
        <Text style={styles.sectionTitle}>隐私设置</Text>
        <PrivacyRow label="隐藏公司名称" value={hideCompany} onChange={setHideCompany} />
        <PrivacyRow label="隐藏详细地址" value={hideAddress} onChange={setHideAddress} />
        <PrivacyRow label="隐藏客户名单" value={hideCustomers} onChange={setHideCustomers} />
        <PrivacyRow label="隐藏合作方名称" value={hidePartners} onChange={setHidePartners} />
        <PrivacyRow label="隐藏财务明细" value={hideFinancial} onChange={setHideFinancial} />
      </Card>

      <Button title="提交审核" onPress={submit} loading={loading} size="block" />
      <Text style={styles.hint}>审核通常需要 10 分钟至 2 小时</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function AssetSection({ title, rows, onChange, onAdd, unitLabel }: { title: string; rows: AssetRow[]; onChange: (index: number, key: keyof AssetRow, value: string) => void; onAdd: () => void; unitLabel: string }) {
  return (
    <Card>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onAdd}><Text style={styles.addText}>+ 添加</Text></TouchableOpacity>
      </View>
      {rows.map((row, index) => (
        <View key={`${title}-${index}`} style={styles.assetRow}>
          <Text style={styles.assetTitle}>第 {index + 1} 行</Text>
          <TextInput style={styles.input} placeholder="名称 *" value={row.name} onChangeText={value => onChange(index, 'name', value)} />
          <TextInput style={styles.input} placeholder="规格 *" value={row.spec} onChangeText={value => onChange(index, 'spec', value)} />
          <View style={styles.twoCol}>
            <TextInput style={[styles.input, styles.flexInput]} placeholder="数量 *" value={row.qty} onChangeText={value => onChange(index, 'qty', value)} keyboardType="numeric" />
            <TextInput style={[styles.input, styles.flexInput]} placeholder={`${unitLabel} *`} value={row.unitOrYear} onChangeText={value => onChange(index, 'unitOrYear', value)} />
          </View>
          <TextInput style={styles.input} placeholder="价格/估值（万元）*" value={row.value} onChangeText={value => onChange(index, 'value', value)} keyboardType="numeric" />
        </View>
      ))}
    </Card>
  );
}

function PrivacyRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.privacyRow}>
      <Text style={styles.privacyLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#ccc', true: '#1a44aa' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  addText: { color: '#1a44aa', fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: '#222', backgroundColor: '#fff' },
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
  assetRow: { padding: 12, borderWidth: 1, borderColor: '#d8dee8', borderRadius: 12, backgroundColor: '#f9fbff', marginBottom: 12 },
  assetTitle: { fontSize: 13, fontWeight: '700', color: '#1a44aa', marginBottom: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  flexInput: { flex: 1 },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  privacyLabel: { fontSize: 14, color: '#333' },
  hint: { textAlign: 'center', fontSize: 12, color: '#555', marginTop: 8 },
});
