import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';

export default function ProjectDetail({ route, navigation }: any) {
  const { projectId } = route.params || {};
  const [project, setProject] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ industry: '', sub_industry: '', province: '', city: '', revenue: '', employees: '', transfer_reason: '', profit_rate: '', price: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsApi.getById(projectId);
      if (res.data.success && res.data.data) {
        setProject(res.data.data);
        const p = res.data.data;
        setForm({ industry: p.industry, sub_industry: p.sub_industry, province: p.province, city: p.city, revenue: String(p.revenue || ''), employees: p.employees, transfer_reason: p.transfer_reason, profit_rate: String(p.profit_rate || ''), price: String(p.price || ''), description: p.description || '' });
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const statusBadge = (s: string) => {
    switch (s) {
      case 'online': return <Badge text="Online" variant="ok" />;
      case 'pending': return <Badge text="Pending Review" variant="warn" />;
      case 'offline': return <Badge text="Offline" variant="gray" />;
      case 'sold': return <Badge text="Sold" variant="info" />;
      default: return <Badge text={s || 'Unknown'} variant="gray" />;
    }
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      await projectsApi.update(projectId, {
        industry: form.industry, sub_industry: form.sub_industry, province: form.province, city: form.city,
        revenue: +form.revenue, employees: form.employees, transfer_reason: form.transfer_reason,
        profit_rate: +form.profit_rate, price: +form.price, description: form.description,
      } as any);
      setEditing(false);
      setToast({ visible: true, message: 'Updated', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Update failed', type: 'error' });
    } finally { setLoading(false); }
  };

  if (!project) return <ScrollView style={styles.container}><Card><Text>Loading...</Text></Card></ScrollView>;

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <View style={styles.row}>
          <Text style={styles.pid}>{project.id}</Text>
          {statusBadge(project.status)}
        </View>
        {editing ? (
          <>
            <TextInput style={styles.input} value={form.industry} onChangeText={v => setForm({ ...form, industry: v })} placeholder="Industry" />
            <TextInput style={styles.input} value={form.sub_industry} onChangeText={v => setForm({ ...form, sub_industry: v })} placeholder="Sub Industry" />
            <TextInput style={styles.input} value={form.province} onChangeText={v => setForm({ ...form, province: v })} placeholder="Province" />
            <TextInput style={styles.input} value={form.city} onChangeText={v => setForm({ ...form, city: v })} placeholder="City" />
            <TextInput style={styles.input} value={form.revenue} onChangeText={v => setForm({ ...form, revenue: v })} placeholder="Revenue (10k)" keyboardType="numeric" />
            <TextInput style={styles.input} value={form.employees} onChangeText={v => setForm({ ...form, employees: v })} placeholder="Employees" />
            <TextInput style={styles.input} value={form.profit_rate} onChangeText={v => setForm({ ...form, profit_rate: v })} placeholder="Profit Rate %" keyboardType="numeric" />
            <TextInput style={styles.input} value={form.price} onChangeText={v => setForm({ ...form, price: v })} placeholder="Price (10k)" keyboardType="numeric" />
            <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Description" multiline textAlignVertical="top" />
            <View style={styles.btnRow}>
              <Button title="Cancel" onPress={() => setEditing(false)} variant="gray" />
              <Button title="Save" onPress={saveEdit} loading={loading} />
            </View>
          </>
        ) : (
          <>
            <DetailRow label="Industry" value={`${project.industry} / ${project.sub_industry || '-'}`} />
            <DetailRow label="Region" value={`${project.province} ${project.city}`} />
            <DetailRow label="Revenue" value={`¥${(project.revenue || 0).toLocaleString()}万`} />
            <DetailRow label="Employees" value={project.employees || '-'} />
            <DetailRow label="Reason" value={project.transfer_reason || '-'} />
            <DetailRow label="Profit Rate" value={`${project.profit_rate || 0}%`} />
            <DetailRow label="Price" value={`¥${(project.price || 0).toLocaleString()}万`} />
            <DetailRow label="Description" value={project.description || '-'} />
            <View style={styles.stats}>
              <Text style={styles.statText}>Views: {project.views || 0}</Text>
              <Text style={styles.statText}>Offers: {project.offers || 0}</Text>
              <Text style={styles.statText}>Matches: {project.matches || 0}</Text>
            </View>
            {project.status !== 'sold' && (
              <View style={styles.btnRow}>
                <Button title="Edit" onPress={() => setEditing(true)} variant="outline" />
              </View>
            )}
          </>
        )}
      </Card>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  detailRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { width: 100, fontSize: 13, fontWeight: '600', color: '#555' },
  detailValue: { flex: 1, fontSize: 14, color: '#111' },
  stats: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  statText: { fontSize: 13, color: '#555' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 10, color: '#222' },
  textArea: { height: 80 },
});
