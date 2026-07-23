import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CascadePicker from '../../components/cascader/CascadePicker';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import WorkbenchTabs, { buyerWorkbenchTabs } from '../../components/workbench/WorkbenchTabs';
import { projectsApi, demandsApi } from '../../api';
import { Project } from '../../types';
import { industryData, regionData } from '../../utils/constants';
import { colors } from '../../theme';

const SORT_OPTS = [
  { key: '', label: '最新' },
  { key: 'price_asc', label: '价格↑' },
  { key: 'price_desc', label: '价格↓' },
];

const BUDGET_OPTS = [
  { key: '', label: '全部预算' },
  { key: '0-300', label: '0-300万' },
  { key: '300-1000', label: '300-1000万' },
  { key: '1000-3000', label: '1000-3000万' },
  { key: '3000+', label: '3000万+' },
];

export default function ProjectBrowse({ navigation }: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [industryPicker, setIndustryPicker] = useState(false);
  const [regionPicker, setRegionPicker] = useState(false);
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [sort, setSort] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (industry) params.industry = industry;
      if (province) params.province = province;
      if (budget) params.budget = budget;
      if (sort) params.sort = sort;
      const [pRes, fRes] = await Promise.all([projectsApi.list(params), demandsApi.getFavorites()]);
      if (pRes.data.success && pRes.data.data) setProjects(pRes.data.data);
      if (fRes.data.success && Array.isArray(fRes.data.data)) setFavorites(fRes.data.data.map((f: any) => f.project_id));
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '项目加载失败', type: 'error' });
    }
  }, [industry, province, budget, sort]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const clearFilters = () => {
    setIndustry('');
    setSubIndustry('');
    setProvince('');
    setCity('');
    setBudget('');
    setSort('');
  };

  const toggleFav = async (projectId: string) => {
    try {
      if (favorites.includes(projectId)) {
        await demandsApi.removeFavorite(projectId);
        setFavorites(favorites.filter(id => id !== projectId));
      } else {
        await demandsApi.addFavorite(projectId);
        setFavorites([...favorites, projectId]);
      }
    } catch (e: any) { setToast({ visible: true, message: e.message || '收藏操作失败', type: 'error' }); }
  };

  const quickApply = async (projectId: string) => {
    try {
      await demandsApi.apply(projectId, '从项目浏览提交申请');
      setToast({ visible: true, message: '申请已提交', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '申请失败', type: 'error' });
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <CascadePicker visible={industryPicker} data={industryData} title="选择行业" onSelect={(parent, child) => { setIndustry(parent); setSubIndustry(child); }} onClose={() => setIndustryPicker(false)} />
      <CascadePicker visible={regionPicker} data={regionData} title="选择地区" onSelect={(parent, child) => { setProvince(parent); setCity(child); }} onClose={() => setRegionPicker(false)} />
      <WorkbenchTabs tabs={buyerWorkbenchTabs} activeKey="browse" navigation={navigation} />
      <Card>
        <Text style={styles.filterTitle}>项目筛选</Text>
        <View style={styles.filterSelectors}>
          <TouchableOpacity style={styles.selector} onPress={() => setIndustryPicker(true)}>
            <Text style={industry ? styles.selectorValue : styles.selectorPlaceholder}>{industry ? `${industry}${subIndustry ? ` / ${subIndustry}` : ''}` : '全部行业'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selector} onPress={() => setRegionPicker(true)}>
            <Text style={province ? styles.selectorValue : styles.selectorPlaceholder}>{province ? `${province}${city ? ` / ${city}` : ''}` : '全部地区'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {BUDGET_OPTS.map(o => (
            <TouchableOpacity key={o.key} style={[styles.chip, budget === o.key && styles.chipActive]} onPress={() => setBudget(o.key)}>
              <Text style={[styles.chipText, budget === o.key && styles.chipActiveText]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ width: 8 }} />
          {SORT_OPTS.map(o => (
            <TouchableOpacity key={o.key} style={[styles.chip, sort === o.key && styles.chipActive]} onPress={() => setSort(o.key)}>
              <Text style={[styles.chipText, sort === o.key && styles.chipActiveText]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearText}>清空筛选</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.count}>共 {projects.length} 个项目</Text>

      {projects.length === 0 ? (
        <Card><Text style={styles.empty}>暂无匹配项目</Text></Card>
      ) : (
        projects.map(p => (
          <Card key={p.id}>
            <TouchableOpacity onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}>
              <View style={styles.row}>
                <Text style={styles.pid}>{p.id}</Text>
                {p.match_score != null && <Badge text={`${p.match_score}%`} variant={p.match_score >= 70 ? 'ok' : 'warn'} />}
              </View>
              <Text style={styles.title}>{p.industry} / {p.sub_industry || '-'}</Text>
              <Text style={styles.loc}>{p.province} {p.city}</Text>
              <View style={styles.row}>
                <Text style={styles.detail}>年营业额：¥{(p.revenue || 0).toLocaleString()}万</Text>
                <Text style={styles.price}>¥{(p.price || 0).toLocaleString()}万</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.detail}>利润率：{p.profit_rate || 0}% | 员工：{p.employees || '-'}</Text>
                <Text style={styles.detail}>浏览：{p.views || 0}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title={favorites.includes(p.id) ? '已收藏' : '收藏'} onPress={() => toggleFav(p.id)} variant={favorites.includes(p.id) ? 'green' : 'gray'} size="sm" />
              <Button title="申请查看" onPress={() => quickApply(p.id)} variant="outline" size="sm" />
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  filterTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  filterSelectors: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  selector: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
  selectorValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  selectorPlaceholder: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  filterRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, backgroundColor: colors.muted },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipActiveText: { color: colors.white },
  clearButton: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', marginTop: 10 },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  count: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  loc: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  detail: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 15, fontWeight: '700', color: colors.danger },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
});
