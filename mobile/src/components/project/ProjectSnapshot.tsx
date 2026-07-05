import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import { Project } from '../../types';
import { formatWan, getProjectAssetGroups, getProjectGallery, ProjectAssetItem } from '../../utils/projectAssets';

interface ProjectSnapshotProps {
  project: Project;
  topRight?: React.ReactNode;
  footer?: React.ReactNode;
  note?: string;
}

interface InfoItemProps {
  label: string;
  value: string;
  multiline?: boolean;
}

interface AssetGroupProps {
  title: string;
  items: ProjectAssetItem[];
  emptyText: string;
}

function InfoItem({ label, value, multiline }: InfoItemProps) {
  return (
    <View style={[styles.infoRow, multiline && styles.infoRowBlock]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline && styles.infoValueBlock]}>{value || '-'}</Text>
    </View>
  );
}

function AssetGroup({ title, items, emptyText }: AssetGroupProps) {
  return (
    <View style={styles.assetGroup}>
      <Text style={styles.assetGroupTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.assetEmpty}>{emptyText}</Text>
      ) : (
        items.map((item, index) => (
          <View key={`${title}-${item.name || item.spec || index}`} style={styles.assetItem}>
            <View style={styles.assetItemTop}>
              <Text style={styles.assetName}>{item.name || item.spec || `${title} ${index + 1}`}</Text>
              <Text style={styles.assetValue}>{item.value ? `${item.value}万` : '待评估'}</Text>
            </View>
            {!!item.spec && <Text style={styles.assetMeta}>规格：{item.spec}</Text>}
            {(item.qty || item.unit || item.year) ? (
              <Text style={styles.assetMeta}>
                {item.qty ? `数量：${item.qty}${item.unit || ''}` : ''}
                {item.qty && item.year ? '  ' : ''}
                {item.year ? `年份：${item.year}` : ''}
              </Text>
            ) : null}
            {item.images.length > 0 ? <Text style={styles.assetTag}>含图片 {item.images.length} 张</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

export default function ProjectSnapshot({ project, topRight, footer, note }: ProjectSnapshotProps) {
  const gallery = getProjectGallery(project);
  const assets = getProjectAssetGroups(project);

  return (
    <>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroMain}>
            <Text style={styles.heroPill}>项目详情</Text>
            <Text style={styles.heroTitle}>{project.industry || '未分类项目'}</Text>
            <Text style={styles.heroSubtitle}>{project.sub_industry || '待补充细分行业'}</Text>
          </View>
          {topRight}
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatWan(project.price)}</Text>
            <Text style={styles.metricLabel}>转让价格</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatWan(project.revenue)}</Text>
            <Text style={styles.metricLabel}>年营收</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{project.employees || '-'}</Text>
            <Text style={styles.metricLabel}>员工规模</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoAccent} />
        <Text style={styles.sectionTitle}>原项目信息</Text>
        <InfoItem label="项目编号" value={project.id} />
        <InfoItem label="行业 / 细分" value={`${project.industry || '-'} / ${project.sub_industry || '-'}`} />
        <InfoItem label="所在地区" value={`${project.province || ''} ${project.city || ''}`.trim()} />
        <InfoItem label="利润率" value={`${project.profit_rate || 0}%`} />
        <InfoItem label="转让原因" value={project.transfer_reason || '-'} multiline />
        <InfoItem label="项目简介" value={project.description || '-'} multiline />
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>项目图片</Text>
        {gallery.length === 0 ? (
          <Text style={styles.emptyText}>当前项目还没有同步图片。</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {gallery.map((image, index) => (
              <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>资产清单</Text>
        <AssetGroup title="设备" items={assets.equipment} emptyText="暂无设备清单" />
        <AssetGroup title="原料" items={assets.rawMaterial} emptyText="暂无原料清单" />
        <AssetGroup title="库存" items={assets.inventory} emptyText="暂无库存清单" />
      </Card>

      {footer ? <Card>{footer}</Card> : null}
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#12306B',
    paddingTop: 18,
    paddingBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroMain: {
    flex: 1,
  },
  heroPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    color: '#E8EFFD',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 4,
  },
  infoCard: {
    overflow: 'hidden',
    paddingTop: 0,
  },
  infoAccent: {
    height: 5,
    marginHorizontal: -20,
    marginBottom: 16,
    backgroundColor: '#1A44AA',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF6',
  },
  infoRowBlock: {
    flexDirection: 'column',
    paddingBottom: 12,
  },
  infoLabel: {
    width: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#EEF3FF',
    color: '#1A44AA',
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValueBlock: {
    paddingTop: 10,
    lineHeight: 21,
  },
  note: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  galleryRow: {
    gap: 10,
    paddingRight: 4,
  },
  galleryImage: {
    width: 180,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#D8E0EE',
  },
  assetGroup: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EBF3',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FBFCFF',
  },
  assetGroupTitle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F3F6FB',
    color: '#1B2638',
    fontSize: 15,
    fontWeight: '700',
  },
  assetItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF6',
  },
  assetEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#64748B',
    fontSize: 13,
  },
  assetItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  assetName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  assetValue: {
    color: '#1A44AA',
    fontSize: 13,
    fontWeight: '800',
  },
  assetMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  assetTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF3FF',
    color: '#1A44AA',
    fontSize: 11,
    fontWeight: '700',
  },
});
