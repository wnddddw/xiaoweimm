import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { demandsApi, getApiErrorMessage } from '../../api';
import CascadePicker from '../../components/cascader/CascadePicker';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { buyerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { industryData, regionData } from '../../utils/constants';
import { colors } from '../../theme';

const scaleOptions = ['1-5', '6-20', '21-50', '51-100', '101-300', '300+'];
const purposeOptions = ['创业接手', '业务扩张', '上下游整合', '投资收益', '多元布局', '其他'];
const priorityOptions = ['盈利稳定', '成长潜力', '管理团队', '地理位置', '价格合理'];
const payMethodOptions = ['全款现金', '分期付款', '股权置换', '可协商'];

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
  const [savedDemand, setSavedDemand] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchExisting = useCallback(async () => {
    try {
      const res = await demandsApi.getMy();
      if (res.data.success && res.data.data) {
        const demand = res.data.data;
        setSavedDemand(demand);
        setIndustry(demand.industry || '');
        setSubIndustry(demand.sub_industry || '');
        setProvince(demand.province || '');
        setCity(demand.city || '');
        setBudgetMin(String(demand.budget_min || ''));
        setBudgetMax(String(demand.budget_max || ''));
        setScale(demand.scale || '');
        setPurpose(demand.purpose || '');
        setPriority(demand.priority || '');
        setPayMethod(demand.pay_method || '');
        setNote(demand.note || '');
      }
    } catch {
      // Existing demand is optional.
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchExisting(); }, [fetchExisting]));

  const showError = (message: string) => setToast({ visible: true, message, type: 'error' });

  const save = async () => {
    if (!industry || !subIndustry) { showError('请选择行业'); return; }
    if (!province || !city) { showError('请选择地区'); return; }
    if (!purpose) { showError('请选择收购目的'); return; }
    setLoading(true);
    try {
      const payload = {
        industry,
        sub_industry: subIndustry,
        province,
        city,
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        scale,
        purpose,
        priority,
        pay_method: payMethod,
        note: note.trim(),
      };
      await demandsApi.save(payload);
      setSavedDemand(payload);
      setToast({ visible: true, message: '需求已保存，正在更新智能推荐', type: 'success' });
    } catch (error: any) {
      showError(getApiErrorMessage(error, '保存失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <WorkbenchTabs tabs={buyerWorkbenchTabs} activeKey="demand" navigation={navigation} />
      <CascadePicker visible={industryPicker} data={industryData} title="选择行业" onSelect={(parent, child) => { setIndustry(parent); setSubIndustry(child); }} onClose={() => setIndustryPicker(false)} />
      <CascadePicker visible={regionPicker} data={regionData} title="选择地区" onSelect={(parent, child) => { setProvince(parent); setCity(child); }} onClose={() => setRegionPicker(false)} />

      <Card>
        <Text style={styles.section}>必填信息</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setIndustryPicker(true)}>
          <Text style={industry ? styles.pickerVal : styles.pickerPlace}>{industry ? `${industry} / ${subIndustry}` : '请选择行业 *'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.picker} onPress={() => setRegionPicker(true)}>
          <Text style={province ? styles.pickerVal : styles.pickerPlace}>{province ? `${province} / ${city}` : '请选择地区 *'}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="最低预算（万元）" value={budgetMin} onChangeText={setBudgetMin} keyboardType="numeric" />
          <Text style={styles.dash}>-</Text>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="最高预算（万元）" value={budgetMax} onChangeText={setBudgetMax} keyboardType="numeric" />
        </View>

        <Text style={styles.label}>规模偏好</Text>
        <ChipGroup values={scaleOptions} selected={scale} onSelect={setScale} />

        <Text style={styles.label}>收购目的 *</Text>
        <ChipGroup values={purposeOptions} selected={purpose} onSelect={setPurpose} />

        <Text style={styles.label}>优先关注</Text>
        <ChipGroup values={priorityOptions} selected={priority} onSelect={setPriority} />

        <Text style={styles.label}>付款方式</Text>
        <ChipGroup values={payMethodOptions} selected={payMethod} onSelect={setPayMethod} />

        <TextInput style={[styles.input, styles.textArea]} placeholder="补充说明..." value={note} onChangeText={setNote} multiline textAlignVertical="top" />
      </Card>

      {savedDemand && (
        <Card>
          <Text style={styles.section}>已保存的收购需求</Text>
          <View style={styles.savedDemand}>
            <Text style={styles.savedLine}>期望行业：{savedDemand.industry || '-'} / {savedDemand.sub_industry || '-'}</Text>
            <Text style={styles.savedLine}>期望地区：{savedDemand.province || '-'} / {savedDemand.city || '-'}</Text>
            <Text style={styles.savedLine}>预算范围：{savedDemand.budget_min || '不限'} - {savedDemand.budget_max || '不限'} 万元</Text>
            <Text style={styles.savedLine}>收购目的：{savedDemand.purpose || '-'}</Text>
            <Text style={styles.savedLine}>优先条件：{savedDemand.priority || '-'}</Text>
          </View>
        </Card>
      )}

      <Button title="保存需求" onPress={save} loading={loading} size="block" />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ChipGroup({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {values.map(value => (
        <TouchableOpacity key={value} style={[styles.chip, selected === value && styles.chipActive]} onPress={() => onSelect(value)}>
          <Text style={[styles.chipText, selected === value && styles.chipActiveText]}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: colors.text, backgroundColor: colors.white },
  textArea: { height: 80 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dash: { fontSize: 18, color: colors.textTertiary },
  picker: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, marginBottom: 12, backgroundColor: colors.white },
  pickerVal: { fontSize: 15, color: colors.text, fontWeight: '500' },
  pickerPlace: { fontSize: 15, color: colors.textTertiary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipActiveText: { color: colors.primary, fontWeight: '600' },
  savedDemand: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 10 },
  savedLine: { fontSize: 13, color: colors.textSecondary, lineHeight: 22 },
});
