import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi, demandsApi } from '../../api';
import { Project } from '../../types';

export default function ProjectDetail({ route, navigation }: any) {
  const { projectId } = route.params || {};
  const [project, setProject] = useState<Project | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applyNote, setApplyNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([projectsApi.getById(projectId), demandsApi.getFavorites()]);
      if (pRes.data.success && pRes.data.data) setProject(pRes.data.data);
      if (fRes.data.success && fRes.data.data) {
        setIsFav(fRes.data.data.some((f: any) => f.project_id === projectId));
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const toggleFav = async () => {
    try {
      if (isFav) { await demandsApi.removeFavorite(projectId); setIsFav(false); }
      else { await demandsApi.addFavorite(projectId); setIsFav(true); }
      setToast({ visible: true, message: isFav ? 'Removed from favorites' : 'Added to favorites', type: 'success' });
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const submitApply = async () => {
    setLoading(true);
    try {
      await demandsApi.apply(projectId, applyNote.trim());
      setShowApply(false);
      setApplyNote('');
      setToast({ visible: true, message: 'Application submitted!', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  if (!project) return <ScrollView style={styles.container}><Card><Text>Loading...</Text></Card></ScrollView>;

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <View style={styles.row}>
          <Text style={styles.pid}>{project.id}</Text>
          {project.match_score != null && <Badge text={`${project.match_score}% Match`} variant={project.match_score >= 70 ? 'ok' : 'warn'} />}
        </View>
        <DetailRow label="Industry" value={`${project.industry} / ${project.sub_industry || '-'}`} />
        <DetailRow label="Region" value={`${project.province} ${project.city}`} />
        <DetailRow label="Revenue" value={`¥${(project.revenue || 0).toLocaleString()}万`} />
        <DetailRow label="Employees" value={project.employees || '-'} />
        <DetailRow label="Profit Rate" value={`${project.profit_rate || 0}%`} />
        <DetailRow label="Price" value={`¥${(project.price || 0).toLocaleString()}万`} />
        <DetailRow label="Reason" value={project.transfer_reason || '-'} />
        <DetailRow label="Description" value={project.description || '-'} />

        <Text style={styles.confidential}>* Some info hidden per seller settings. Apply and sign NDA to unlock full details.</Text>

        <View style={styles.btnRow}>
          <Button title={isFav ? '★ Favorited' : '☆ Favorite'} onPress={toggleFav} variant={isFav ? 'green' : 'gray'} />
          <Button title="Apply for Details" onPress={() => setShowApply(true)} />
        </View>
      </Card>

      {showApply && (
        <Card>
          <Text style={styles.sectionTitle}>Apply for Confidential Info</Text>
          <Text style={styles.hint}>After approval, you'll need to sign an NDA to view full details.</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Briefly describe your acquisition intent and funding..." value={applyNote} onChangeText={setApplyNote} multiline textAlignVertical="top" />
          <View style={styles.btnRow}>
            <Button title="Cancel" onPress={() => setShowApply(false)} variant="gray" />
            <Button title="Submit" onPress={submitApply} loading={loading} />
          </View>
        </Card>
      )}
      <View style={{ height: 20 }} />
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
  detailLabel: { width: 90, fontSize: 13, fontWeight: '600', color: '#555' },
  detailValue: { flex: 1, fontSize: 14, color: '#111' },
  confidential: { fontSize: 11, color: '#888', marginTop: 10, fontStyle: 'italic' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 8 },
  hint: { fontSize: 13, color: '#555', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, color: '#222', marginBottom: 12 },
  textArea: { height: 80 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
