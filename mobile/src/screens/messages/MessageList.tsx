import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { getApiErrorMessage, messagesApi } from '../../api';
import { Message } from '../../types';
import { colors } from '../../theme';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'project', label: '项目' },
  { key: 'intent', label: '意向' },
  { key: 'nda', label: '保密协议' },
  { key: 'advisor', label: '顾问' },
  { key: 'system', label: '系统' },
];

export function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [messageRes, unreadRes] = await Promise.all([messagesApi.list(category !== 'all' ? category : undefined), messagesApi.unreadCount()]);
      if (messageRes.data.success && messageRes.data.data) setMessages(messageRes.data.data);
      if (unreadRes.data.success && unreadRes.data.data) setUnreadCounts(unreadRes.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: getApiErrorMessage(e, '加载失败'), type: 'error' });
    }
  }, [category]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const markRead = async (id: string) => {
    try {
      await messagesApi.markRead(id);
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: getApiErrorMessage(e, '操作失败'), type: 'error' }); }
  };

  const markAllRead = async () => {
    try {
      await messagesApi.markAllRead(category !== 'all' ? category : undefined);
      setToast({ visible: true, message: '已全部标为已读', type: 'success' });
      fetchData();
    } catch (e: any) { setToast({ visible: true, message: getApiErrorMessage(e, '操作失败'), type: 'error' }); }
  };

  const catBadge = (cat: string) => {
    const map: Record<string, { label: string; variant: 'ok' | 'warn' | 'info' | 'err' | 'gray' }> = {
      project: { label: '项目', variant: 'info' },
      intent: { label: '意向', variant: 'warn' },
      nda: { label: '保密协议', variant: 'err' },
      advisor: { label: '顾问', variant: 'ok' },
      system: { label: '系统', variant: 'gray' },
    };
    const item = map[cat] || { label: cat, variant: 'gray' as const };
    return <Badge text={item.label} variant={item.variant} />;
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {CATEGORIES.map(item => (
          <TouchableOpacity key={item.key} style={[styles.tab, category === item.key && styles.tabActive]} onPress={() => setCategory(item.key)}>
            <Text style={[styles.tabText, category === item.key && styles.tabActiveText]}>
              {item.label} {unreadCounts[item.key] ? `(${unreadCounts[item.key]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {messages.filter(message => message.is_read === 0).length > 0 && (
        <TouchableOpacity style={styles.markAll} onPress={markAllRead}>
          <Text style={styles.markAllText}>全部标为已读</Text>
        </TouchableOpacity>
      )}

      {messages.length === 0 ? (
        <Card><Text style={styles.empty}>暂无消息</Text></Card>
      ) : (
        messages.map(message => (
          <TouchableOpacity key={message.id} onPress={() => markRead(message.id)}>
            <Card style={message.is_read === 0 ? { borderLeftWidth: 3, borderLeftColor: colors.primary } : undefined}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    {catBadge(message.category)}
                    <Text style={[styles.subject, message.is_read === 0 && styles.bold]}>{message.subject}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{message.body}</Text>
                  <Text style={styles.time}>{message.created_at?.slice(0, 16).replace('T', ' ')}</Text>
                </View>
                {message.is_read === 0 && <View style={styles.dot} />}
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
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  tabs: { marginBottom: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: colors.muted },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, color: colors.textSecondary },
  tabActiveText: { color: colors.white, fontWeight: '600' },
  markAll: { alignItems: 'flex-end', marginBottom: 6 },
  markAllText: { fontSize: 12, color: colors.primary },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  subject: { fontSize: 14, color: colors.text, flex: 1 },
  bold: { fontWeight: '700' },
  body: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  time: { fontSize: 11, color: colors.textTertiary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
});
