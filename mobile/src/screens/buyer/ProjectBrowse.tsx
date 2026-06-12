import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi, demandsApi } from '../../api';
import { Project } from '../../types';

const SORT_OPTS = [
  { key: '', label: 'Newest' },
  { key: 'price_asc', label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
];

const BUDGET_OPTS = [
  { key: '', label: 'All' },
  { key: '0-300', label: '0-300万' },
  { key: '300-1000', label: '300-1000万' },
  { key: '1000-3000', label: '1000-3000万' },
  { key: '3000+', label: '3000万+' },
];

export default function ProjectBrowse({ navigation }: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [province, setProvince] = useState('');
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
      if (fRes.data.success && fRes.data.data) setFavorites(fRes.data.data.map((f: any) => f.project_id));
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, [industry, province, budget, sort]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const toggleFav = async (projectId: string) => {
    try {
      if (favorites.includes(projectId)) {
        await demandsApi.removeFavorite(projectId);
        setFavorites(favorites.filter(id => id !== projectId));
      } else {
        await demandsApi.addFavorite(projectId);
        setFavorites([...favorites, projectId]);
      }
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const quickApply = async (projectId: string) => {
    try {
      await demandsApi.apply(projectId, 'Quick apply from browse');
      setToast({ visible: true, message: 'Application submitted!', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
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
      </Card>

      <Text style={styles.count}>{projects.length} projects</Text>

      {projects.length === 0 ? (
        <Card><Text style={styles.empty}>No projects found</Text></Card>
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
                <Text style={styles.detail}>Rev: ¥{(p.revenue || 0).toLocaleString()}万</Text>
                <Text style={styles.price}>¥{(p.price || 0).toLocaleString()}万</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.detail}>Profit: {p.profit_rate || 0}% | Staff: {p.employees || '-'}</Text>
                <Text style={styles.detail}>Views: {p.views || 0}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title={favorites.includes(p.id) ? '★' : '☆'} onPress={() => toggleFav(p.id)} variant={favorites.includes(p.id) ? 'green' : 'gray'} size="sm" />
              <Button title="Apply" onPress={() => quickApply(p.id)} variant="outline" size="sm" />
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  filterRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, backgroundColor: '#e5e7ea' },
  chipActive: { backgroundColor: '#1a44aa' },
  chipText: { fontSize: 12, color: '#555' },
  chipActiveText: { color: '#fff' },
  count: { fontSize: 13, color: '#555', marginBottom: 8, marginTop: 4 },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pid: { fontSize: 11, color: '#888', fontFamily: 'monospace' },
  title: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  loc: { fontSize: 13, color: '#555', marginBottom: 4 },
  detail: { fontSize: 12, color: '#555' },
  price: { fontSize: 15, fontWeight: '700', color: '#c0392b' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
});
