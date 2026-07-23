import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import ProjectSnapshot from '../../components/project/ProjectSnapshot';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { colors } from '../../theme';

export default function ProjectDetail({ route }: any) {
  const { projectId } = route.params || {};
  const [project, setProject] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    industry: '',
    sub_industry: '',
    province: '',
    city: '',
    revenue: '',
    employees: '',
    profit_rate: '',
    price: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsApi.getById(projectId);
      if (res.data.success && res.data.data) {
        const item = res.data.data;
        setProject(item);
        setForm({
          industry: item.industry || '',
          sub_industry: item.sub_industry || '',
          province: item.province || '',
          city: item.city || '',
          revenue: String(item.revenue || ''),
          employees: item.employees || '',
          profit_rate: String(item.profit_rate || ''),
          price: String(item.price || ''),
          description: item.description || '',
        });
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const saveEdit = async () => {
    setLoading(true);
    try {
      await projectsApi.update(projectId, {
        industry: form.industry,
        sub_industry: form.sub_industry,
        province: form.province,
        city: form.city,
        revenue: +form.revenue,
        employees: form.employees,
        transfer_reason: '',
        profit_rate: +form.profit_rate,
        price: +form.price,
        description: form.description,
      } as any);
      setEditing(false);
      setToast({ visible: true, message: '项目已更新', type: 'success' });
      fetchData();
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '更新失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge text="展示中" variant="ok" />;
      case 'pending':
        return <Badge text="待审核" variant="warn" />;
      case 'offline':
        return <Badge text="已下线" variant="gray" />;
      case 'sold':
        return <Badge text="已成交" variant="info" />;
      default:
        return <Badge text={status || '未知状态'} variant="gray" />;
    }
  };

  if (!project) {
    return (
      <ScrollView style={styles.container}>
        <Card>
          <Text>加载中...</Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />

      {editing ? (
        <Card>
          <Text style={styles.sectionTitle}>编辑项目</Text>
          <TextInput style={styles.input} value={form.industry} onChangeText={(value) => setForm({ ...form, industry: value })} placeholder="行业" />
          <TextInput style={styles.input} value={form.sub_industry} onChangeText={(value) => setForm({ ...form, sub_industry: value })} placeholder="细分行业" />
          <TextInput style={styles.input} value={form.province} onChangeText={(value) => setForm({ ...form, province: value })} placeholder="省份" />
          <TextInput style={styles.input} value={form.city} onChangeText={(value) => setForm({ ...form, city: value })} placeholder="城市" />
          <TextInput style={styles.input} value={form.revenue} onChangeText={(value) => setForm({ ...form, revenue: value })} placeholder="年营收（万）" keyboardType="numeric" />
          <TextInput style={styles.input} value={form.employees} onChangeText={(value) => setForm({ ...form, employees: value })} placeholder="员工规模" />
          <TextInput style={styles.input} value={form.profit_rate} onChangeText={(value) => setForm({ ...form, profit_rate: value })} placeholder="利润率 %" keyboardType="numeric" />
          <TextInput style={styles.input} value={form.price} onChangeText={(value) => setForm({ ...form, price: value })} placeholder="转让价格（万）" keyboardType="numeric" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(value) => setForm({ ...form, description: value })}
            placeholder="项目简介"
            multiline
            textAlignVertical="top"
          />
          <View style={styles.btnRow}>
            <Button title="取消" onPress={() => setEditing(false)} variant="gray" />
            <Button title="保存" onPress={saveEdit} loading={loading} />
          </View>
        </Card>
      ) : (
        <ProjectSnapshot
          project={project}
          topRight={renderStatusBadge(project.status)}
          note="当前展示的是卖家端原生详情页，资产和图片信息已经和网页详情结构同步。"
          footer={(
            <View>
              <View style={styles.stats}>
                <Text style={styles.statText}>浏览 {project.views || 0}</Text>
                <Text style={styles.statText}>报价 {project.offers || 0}</Text>
                <Text style={styles.statText}>匹配 {project.matches || 0}</Text>
              </View>
              {project.status !== 'sold' && (
                <View style={styles.btnRow}>
                  <Button title="编辑项目" onPress={() => setEditing(true)} variant="outline" />
                </View>
              )}
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  stats: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  statText: { fontSize: 13, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 10, color: colors.text },
  textArea: { height: 96 },
});
