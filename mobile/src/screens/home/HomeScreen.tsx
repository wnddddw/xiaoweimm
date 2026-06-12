import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { projectsApi, matchingApi, paymentsApi, messagesApi } from '../../api';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState({ projects: 0, recommend: 0, unread: 0, balance: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const calls: Promise<any>[] = [paymentsApi.getBalance(), messagesApi.unreadCount()];
      if (isSeller) calls.push(projectsApi.myProjects());
      if (!isSeller && !isAdmin) calls.push(matchingApi.getRecommendations());

      const results = await Promise.allSettled(calls);
      let projects = 0, recommend = 0, unread = 0, balance = 0;

      const bRes = results[0].status === 'fulfilled' ? results[0].value : null;
      if (bRes?.data?.success && bRes.data.data) balance = bRes.data.data.balance || 0;

      const uRes = results[1].status === 'fulfilled' ? results[1].value : null;
      if (uRes?.data?.success && uRes.data.data) {
        unread = Object.values(uRes.data.data).reduce((a: number, b: any) => a + (b || 0), 0);
      }

      if (results[2]) {
        const r = results[2].status === 'fulfilled' ? results[2].value : null;
        if (r?.data?.success && r.data.data) {
          if (isSeller) projects = Array.isArray(r.data.data) ? r.data.data.length : 0;
          else recommend = Array.isArray(r.data.data) ? r.data.data.length : 0;
        }
      }

      setStats({ projects, recommend, unread, balance });
    } catch (e: any) { /* ignore */ }
  }, [isSeller, isAdmin]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <Card>
        <Text style={styles.greeting}>Welcome, {user?.name || 'User'}!</Text>
        <View style={styles.row}>
          <Badge text={isAdmin ? 'Admin' : isSeller ? 'Seller' : 'Buyer'} variant="info" />
          <Badge text={(user?.member_level || 'free').toUpperCase()} variant="ok" />
          <Text style={styles.balance}>¥{stats.balance}</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.stats}>
          {isSeller && (
            <View style={styles.stat}>
              <Text style={styles.num}>{stats.projects}</Text>
              <Text style={styles.label}>My Projects</Text>
            </View>
          )}
          {!isAdmin && !isSeller && (
            <View style={styles.stat}>
              <Text style={styles.num}>{stats.recommend}</Text>
              <Text style={styles.label}>Recommendations</Text>
            </View>
          )}
          <View style={styles.stat}>
            <Text style={styles.num}>{stats.unread}</Text>
            <Text style={styles.label}>Unread</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.num}>{stats.balance}</Text>
            <Text style={styles.label}>Balance</Text>
          </View>
        </View>
      </Card>

      {!isAdmin && (
        <Card>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {isSeller ? (
            <View style={styles.actions}>
              <Button title="Publish Project" onPress={() => navigation.navigate('Seller', { screen: 'ProjectPublish' })} size="block" />
            </View>
          ) : (
            <View style={styles.actions}>
              <Button title="Browse Projects" onPress={() => navigation.navigate('Buyer', { screen: 'ProjectBrowse' })} size="block" />
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balance: { fontSize: 14, fontWeight: '700', color: '#1a44aa', marginLeft: 'auto' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  num: { fontSize: 24, fontWeight: '700', color: '#1a44aa' },
  label: { fontSize: 12, color: '#555', marginTop: 2 },
  actions: { gap: 10 },
});
