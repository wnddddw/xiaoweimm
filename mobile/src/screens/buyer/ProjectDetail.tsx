import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import ProjectSnapshot from '../../components/project/ProjectSnapshot';
import { demandsApi, projectsApi } from '../../api';
import { Project } from '../../types';

export default function ProjectDetail({ route }: any) {
  const { projectId } = route.params || {};
  const [project, setProject] = useState<Project | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applyNote, setApplyNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, favoriteRes] = await Promise.all([projectsApi.getById(projectId), demandsApi.getFavorites()]);
      if (projectRes.data.success && projectRes.data.data) setProject(projectRes.data.data);
      if (favoriteRes.data.success && favoriteRes.data.data) {
        setIsFav(favoriteRes.data.data.some((item: any) => item.project_id === projectId));
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '加载失败', type: 'error' });
    }
  }, [projectId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const toggleFav = async () => {
    try {
      if (isFav) {
        await demandsApi.removeFavorite(projectId);
        setIsFav(false);
      } else {
        await demandsApi.addFavorite(projectId);
        setIsFav(true);
      }
      setToast({ visible: true, message: isFav ? '已取消收藏' : '已加入收藏', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '操作失败', type: 'error' });
    }
  };

  const submitApply = async () => {
    setLoading(true);
    try {
      await demandsApi.apply(projectId, applyNote.trim());
      setShowApply(false);
      setApplyNote('');
      setToast({ visible: true, message: '申请已提交', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '提交失败', type: 'error' });
    } finally {
      setLoading(false);
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
      <ProjectSnapshot
        project={project}
        topRight={project.match_score != null ? <Badge text={`${project.match_score}% 匹配`} variant={project.match_score >= 70 ? 'ok' : 'warn'} /> : undefined}
        note="部分信息会按卖家隐私设置隐藏。提交申请并签署 NDA 后，可继续查看更完整资料。"
        footer={(
          <View style={styles.btnRow}>
            <Button title={isFav ? '已收藏' : '收藏项目'} onPress={toggleFav} variant={isFav ? 'green' : 'gray'} />
            <Button title="申请查看详情" onPress={() => setShowApply(true)} />
          </View>
        )}
      />

      {showApply && (
        <Card>
          <Text style={styles.sectionTitle}>申请保密资料</Text>
          <Text style={styles.hint}>审核通过后，需要签署 NDA 才能查看更完整的项目资料。</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="简要说明你的收购意向、行业背景和资金安排..."
            value={applyNote}
            onChangeText={setApplyNote}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.btnRow}>
            <Button title="取消" onPress={() => setShowApply(false)} variant="gray" />
            <Button title="提交申请" onPress={submitApply} loading={loading} />
          </View>
        </Card>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 8 },
  hint: { fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 13, fontSize: 15, color: '#222', marginBottom: 12 },
  textArea: { height: 96 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  spacer: { height: 20 },
});
