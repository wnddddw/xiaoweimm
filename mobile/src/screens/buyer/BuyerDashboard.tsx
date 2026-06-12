import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { demandsApi, matchingApi } from '../../api';
import { Project } from '../../types';

export default function BuyerDashboard({ navigation }: any) {
  const [demand, setDemand] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [dRes, mRes] = await Promise.all([demandsApi.getMy(), matchingApi.getRecommendations()]);
      if (dRes.data.success && dRes.data.data) setDemand(dRes.data.data);
      if (mRes.data.success && mRes.data.data) setRecommendations(mRes.data.data.slice(0, 5));
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />

      {demand ? (
        <Card>
          <Text style={styles.sectionTitle}>My Demand</Text>
          <Text style={styles.detail}>{demand.industry} / {demand.sub_industry || '-'}</Text>
          <Text style={styles.detail}>{demand.province} {demand.city} | Budget: {demand.budget_min || 0}-{demand.budget_max || '∞'}万</Text>
          <Text style={styles.detail}>Purpose: {demand.purpose || '-'}</Text>
          <Button title="Edit Demand" onPress={() => navigation.navigate('DemandInput')} variant="outline" size="sm" />
        </Card>
      ) : (
        <Card>
          <Text style={styles.empty}>No demand set yet. Create one to get AI-matched projects.</Text>
          <Button title="Create Demand" onPress={() => navigation.navigate('DemandInput')} size="block" />
        </Card>
      )}

      <View style={{ height: 10 }} />
      <Button title="Browse All Projects" onPress={() => navigation.navigate('ProjectBrowse')} variant="outline" size="block" />
      <View style={{ height: 10 }} />
      <Button title="My Applications" onPress={() => navigation.navigate('MyApplications')} variant="outline" size="block" />

      {recommendations.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>AI Recommendations</Text>
          {recommendations.map(p => (
            <View key={p.id} style={styles.recItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>{p.industry} / {p.sub_industry}</Text>
                <Text style={styles.recLoc}>{p.province} {p.city} | ¥{(p.price || 0).toLocaleString()}万</Text>
                {p.match_score != null && (
                  <Badge text={`${p.match_score}% Match`} variant={p.match_score >= 70 ? 'ok' : p.match_score >= 40 ? 'warn' : 'gray'} />
                )}
              </View>
              <Button title="View" onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })} size="sm" />
            </View>
          ))}
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 10 },
  detail: { fontSize: 13, color: '#555', marginBottom: 3 },
  empty: { textAlign: 'center', color: '#555', marginBottom: 12 },
  recItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  recLoc: { fontSize: 13, color: '#555', marginBottom: 4 },
});
