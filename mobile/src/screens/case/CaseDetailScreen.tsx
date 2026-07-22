import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export interface CaseData {
  id?: number;
  industry: string;
  title: string;
  price: string;
  revenue: string;
  days: string;
  image: string;
  description: string;
}

export default function CaseDetailScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const caseData: CaseData = route?.params?.caseData;

  if (!caseData) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>案例数据不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Image source={{ uri: caseData.image }} style={styles.coverImage} />

      <View style={styles.body}>
        <View style={styles.tags}>
          <Text style={styles.industryTag}>{caseData.industry}</Text>
          <Text style={styles.doneTag}>✓ 已成交</Text>
        </View>

        <Text style={styles.title}>{caseData.title}</Text>

        <View style={styles.metrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{caseData.price}</Text>
            <Text style={styles.metricLabel}>成交价</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{caseData.revenue}</Text>
            <Text style={styles.metricLabel}>年营收</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{caseData.days}</Text>
            <Text style={styles.metricLabel}>成交周期</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>案例详情</Text>
        <Text style={styles.description}>{caseData.description}</Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('PublicContent', { page: 'contact' })}
        >
          <Text style={styles.ctaText}>免费咨询类似案例</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  coverImage: { width: '100%', height: 220, backgroundColor: '#e5e7ea' },
  body: { paddingHorizontal: 18, paddingTop: 20 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  industryTag: {
    color: '#1a44aa', backgroundColor: '#d4e4fd',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    fontSize: 13, fontWeight: '700',
  },
  doneTag: {
    color: '#145a32', backgroundColor: '#d5f5e3',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    fontSize: 13, fontWeight: '700',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111', lineHeight: 30, marginBottom: 18 },
  metrics: {
    flexDirection: 'row',
    backgroundColor: '#f4f6fa', borderRadius: 12,
    padding: 16, gap: 8,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '800', color: '#1a44aa' },
  metricLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eef0f3', marginVertical: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },
  description: { fontSize: 15, color: '#444', lineHeight: 26 },
  ctaButton: {
    marginTop: 30, alignSelf: 'stretch',
    backgroundColor: '#1a44aa', borderRadius: 12,
    minHeight: 50, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});
