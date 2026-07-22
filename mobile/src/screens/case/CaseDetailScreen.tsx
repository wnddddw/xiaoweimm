import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';

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
  page: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: 40 },
  coverImage: { width: '100%', height: 220, backgroundColor: colors.muted },
  body: { paddingHorizontal: 18, paddingTop: 20 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  industryTag: {
    color: colors.primary, backgroundColor: colors.primarySoft,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    fontSize: 13, fontWeight: '700',
  },
  doneTag: {
    color: colors.successDark, backgroundColor: colors.successSoft,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    fontSize: 13, fontWeight: '700',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 30, marginBottom: 18 },
  metrics: {
    flexDirection: 'row',
    backgroundColor: colors.bg, borderRadius: 12,
    padding: 16, gap: 8,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  metricLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 26 },
  ctaButton: {
    marginTop: 30, alignSelf: 'stretch',
    backgroundColor: colors.primary, borderRadius: 12,
    minHeight: 50, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 15 },
});
