import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { adminApi, projectsApi } from '../../api';

export default function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchProject = async () => {
    try {
      const res = await projectsApi.getById(projectId);
      if (res.data.success && res.data.data) setProject(res.data.data);
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [projectId]);

  const approve = async () => {
    try {
      await adminApi.approveProject(projectId);
      setToast({ visible: true, message: '已通过', type: 'success' });
      fetchProject();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const reject = async () => {
    try {
      await adminApi.rejectProject(projectId);
      setToast({ visible: true, message: '已拒绝', type: 'success' });
      fetchProject();
    } catch (e: any) { setToast({ visible: true, message: e.message || '失败', type: 'error' }); }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { pending: '待审', online: '已上线', rejected: '已拒绝', offline: '已下线' };
    return map[s] || s;
  };

  const statusVariant = (s: string) => {
    const map: Record<string, string> = { pending: 'warn', online: 'ok', rejected: 'err', offline: 'gray' };
    return (map[s] || 'gray') as 'warn' | 'ok' | 'err' | 'gray';
  };

  const renderListItem = (item: any, i: number) => {
    if (typeof item !== 'object' || !item) return <Text key={i} style={styles.listItem}>• {String(item)}</Text>;
    const parts = [item.name, item.spec, item.qty, item.year, item.value].filter(Boolean);
    return <Text key={i} style={styles.listItem}>• {parts.join(' | ')}</Text>;
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#1a44aa" /></View>;

  if (!project) return <View style={styles.loading}><Text>项目不存在</Text></View>;

  const parseJSON = (val: any) => { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return val; } };
  const equipment = parseJSON(project.equipment);
  const rawMaterial = parseJSON(project.raw_material);
  const inventory = parseJSON(project.inventory);

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(s => ({ ...s, visible: false }))} />

      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.pid}>{project.id}</Text>
          <Badge text={statusLabel(project.status)} variant={statusVariant(project.status)} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <InfoRow label="行业" value={(project.industry || '') + ' / ' + (project.sub_industry || '')} />
        <InfoRow label="地区" value={(project.province || '') + ' ' + (project.city || '')} />
        <InfoRow label="营收" value={'¥' + (project.revenue || 0).toLocaleString() + '万'} />
        <InfoRow label="价格" value={'¥' + (project.price || 0).toLocaleString() + '万'} />
        <InfoRow label="利润率" value={(project.profit_rate || 0) + '%'} />
        <InfoRow label="员工数" value={project.employees || '-'} />
        <InfoRow label="转让原因" value={project.transfer_reason || '-'} />
        <InfoRow label="提交时间" value={project.submit_time?.slice(0, 10) || '-'} />
      </Card>

      {project.description ? (
        <Card>
          <Text style={styles.sectionTitle}>项目描述</Text>
          <Text style={styles.desc}>{project.description}</Text>
        </Card>
      ) : null}

      {Array.isArray(equipment) && equipment.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>设备清单</Text>
          {equipment.map((item: any, i: number) => renderListItem(item, i))}
        </Card>
      )}

      {Array.isArray(rawMaterial) && rawMaterial.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>原材料</Text>
          {rawMaterial.map((item: any, i: number) => renderListItem(item, i))}
        </Card>
      )}

      {Array.isArray(inventory) && inventory.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>库存</Text>
          {inventory.map((item: any, i: number) => renderListItem(item, i))}
        </Card>
      )}

      {project.status === 'pending' && (
        <View style={styles.btnRow}>
          <Button title="通过" onPress={approve} variant="green" size="block" />
          <Button title="拒绝" onPress={reject} variant="red" size="block" />
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6fa' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pid: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  infoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8e8e8' },
  infoLabel: { width: 80, fontSize: 13, color: '#888' },
  infoValue: { flex: 1, fontSize: 13, color: '#222' },
  desc: { fontSize: 13, color: '#444', lineHeight: 20 },
  listItem: { fontSize: 13, color: '#444', paddingVertical: 3 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
