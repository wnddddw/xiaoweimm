import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';

export default function SellerDashboard({ navigation }: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsApi.myProjects();
      if (res.data.success && res.data.data) setProjects(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Failed to load', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const totalViews = projects.reduce((s, p) => s + (p.views || 0), 0);
  const totalOffers = projects.reduce((s, p) => s + (p.offers || 0), 0);
  const totalMatches = projects.reduce((s, p) => s + (p.matches || 0), 0);
  const online = projects.filter(p => p.status === 'online').length;
  const pending = projects.filter(p => p.status === 'pending').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.num}>{projects.length}</Text><Text style={styles.label}>Projects</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalViews}</Text><Text style={styles.label}>Views</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalOffers}</Text><Text style={styles.label}>Offers</Text></View>
          <View style={styles.stat}><Text style={styles.num}>{totalMatches}</Text><Text style={styles.label}>Matches</Text></View>
        </View>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Project Status</Text>
        <View style={styles.statusRow}>
          <Badge text={`${online} Online`} variant="ok" />
          <Badge text={`${pending} Pending`} variant="warn" />
          <Badge text={`${projects.filter(p => p.status === 'offline').length} Offline`} variant="gray" />
          <Badge text={`${projects.filter(p => p.status === 'sold').length} Sold`} variant="info" />
        </View>
      </Card>
      <Button title="Publish New Project" onPress={() => navigation.navigate('ProjectPublish')} size="block" />
      <View style={{ height: 10 }} />
      <Button title="Manage Projects" onPress={() => navigation.navigate('ProjectManage')} variant="outline" size="block" />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  num: { fontSize: 24, fontWeight: '700', color: '#1a44aa' },
  label: { fontSize: 12, color: '#555', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
