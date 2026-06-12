import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { messagesApi } from '../../api';
import { Message } from '../../types';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'project', label: 'Project' },
  { key: 'intent', label: 'Intents' },
  { key: 'nda', label: 'NDA' },
  { key: 'advisor', label: 'Advisor' },
  { key: 'system', label: 'System' },
];

export function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, uRes] = await Promise.all([messagesApi.list(category !== 'all' ? category : undefined), messagesApi.unreadCount()]);
      if (mRes.data.success && mRes.data.data) setMessages(mRes.data.data);
      if (uRes.data.success && uRes.data.data) setUnreadCounts(uRes.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || 'Load failed', type: 'error' });
    }
  }, [category]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const markRead = async (id: string) => {
    try {
      await messagesApi.markRead(id);
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const markAllRead = async () => {
    try {
      await messagesApi.markAllRead(category !== 'all' ? category : undefined);
      setToast({ visible: true, message: 'All marked read', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: e.message || 'Failed', type: 'error' }); }
  };

  const catBadge = (cat: string) => {
    const map: Record<string, { label: string; variant: 'ok' | 'warn' | 'info' | 'err' | 'gray' }> = {
      project: { label: 'Project', variant: 'info' },
      intent: { label: 'Intent', variant: 'warn' },
      nda: { label: 'NDA', variant: 'err' },
      advisor: { label: 'Advisor', variant: 'ok' },
      system: { label: 'System', variant: 'gray' },
    };
    const m = map[cat] || { label: cat, variant: 'gray' as const };
    return <Badge text={m.label} variant={m.variant} />;
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c.key} style={[styles.tab, category === c.key && styles.tabActive]} onPress={() => setCategory(c.key)}>
            <Text style={[styles.tabText, category === c.key && styles.tabActiveText]}>
              {c.label} {unreadCounts[c.key] ? `(${unreadCounts[c.key]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {messages.filter(m => m.is_read === 0).length > 0 && (
        <TouchableOpacity style={styles.markAll} onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {messages.length === 0 ? (
        <Card><Text style={styles.empty}>No messages</Text></Card>
      ) : (
        messages.map(m => (
          <TouchableOpacity key={m.id} onPress={() => markRead(m.id)}>
            <Card style={m.is_read === 0 ? { borderLeftWidth: 3, borderLeftColor: '#1a44aa' } : undefined}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    {catBadge(m.category)}
                    <Text style={[styles.subject, m.is_read === 0 && styles.bold]}>{m.subject}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{m.body}</Text>
                  <Text style={styles.time}>{m.created_at?.slice(0, 16).replace('T', ' ')}</Text>
                </View>
                {m.is_read === 0 && <View style={styles.dot} />}
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  tabs: { marginBottom: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: '#e5e7ea' },
  tabActive: { backgroundColor: '#1a44aa' },
  tabText: { fontSize: 12, color: '#555' },
  tabActiveText: { color: '#fff', fontWeight: '600' },
  markAll: { alignItems: 'flex-end', marginBottom: 6 },
  markAllText: { fontSize: 12, color: '#1a44aa' },
  empty: { textAlign: 'center', color: '#555', padding: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  subject: { fontSize: 14, color: '#111', flex: 1 },
  bold: { fontWeight: '700' },
  body: { fontSize: 13, color: '#555', marginBottom: 4 },
  time: { fontSize: 11, color: '#999' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a44aa', marginTop: 4 },
});
