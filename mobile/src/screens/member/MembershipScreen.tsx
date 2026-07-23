import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';
import { membershipsApi } from '../../api';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme';

const ADVANCED_FEATURES = [
  '发布出售 / 转让项目',
  '申请查看项目详情（意向申请）',
  '创建交易并推进全流程',
  '申请免费诊断与专家服务',
];

const levelBadge = (level: string) => {
  if (level === 'advanced') return <Badge text="高级会员" variant="ok" />;
  return <Badge text="基础会员" variant="gray" />;
};

const statusBadge = (status?: string) => {
  switch (status) {
    case 'pending': return <Badge text="审核中" variant="warn" />;
    case 'approved': return <Badge text="已通过" variant="ok" />;
    case 'rejected': return <Badge text="已驳回" variant="info" />;
    default: return null;
  }
};

export default function MembershipScreen() {
  const { user } = useAuth();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState('');
  const [idNote, setIdNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  const fetchData = useCallback(async () => {
    try {
      const res = await membershipsApi.get();
      if (res.data.success && res.data.data) setMemberInfo(res.data.data);
    } catch (e: any) { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const submitApply = async () => {
    if (!reason.trim() || !contact.trim() || !idNote.trim()) {
      setToast({ visible: true, message: '请填写申请理由、联系方式和身份说明', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await membershipsApi.applyAdvanced(reason.trim(), contact.trim(), idNote.trim());
      if (res.data.success) {
        setToast({ visible: true, message: '申请已提交，等待管理员审核', type: 'success' });
        setReason(''); setContact(''); setIdNote('');
        fetchData();
      }
    } catch (e: any) {
      setToast({ visible: true, message: e.message || '提交失败', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentLevel = memberInfo?.member_level || user?.member_level || 'basic';
  const applyStatus = memberInfo?.advanced_status;
  const isAdvanced = currentLevel === 'advanced';

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={() => setToast(current => ({ ...current, visible: false }))} />

      <Card>
        <Text style={styles.sectionTitle}>当前会员</Text>
        <View style={styles.row}>
          {levelBadge(currentLevel)}
          {statusBadge(applyStatus)}
        </View>
        <Text style={styles.hint}>
          平台已转为免费审核制：基础会员免费注册、可浏览；高级会员免费申请、管理员审核开通，不收取任何费用。
        </Text>
        {applyStatus === 'rejected' && memberInfo?.review_note ? (
          <Text style={styles.rejectNote}>驳回原因：{memberInfo.review_note}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>高级会员权益（免费）</Text>
        {ADVANCED_FEATURES.map((feature, index) => (
          <Text key={index} style={styles.feature}>✓ {feature}</Text>
        ))}
      </Card>

      {!isAdvanced && applyStatus !== 'pending' && (
        <Card>
          <Text style={styles.sectionTitle}>申请高级会员</Text>
          <TextInput
            style={styles.input}
            placeholder="申请理由（必填）"
            placeholderTextColor={colors.textTertiary}
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="联系方式（必填）"
            placeholderTextColor={colors.textTertiary}
            value={contact}
            onChangeText={setContact}
          />
          <TextInput
            style={styles.input}
            placeholder="资质/身份说明（必填）"
            placeholderTextColor={colors.textTertiary}
            value={idNote}
            onChangeText={setIdNote}
          />
          <Button title="提交申请" onPress={submitApply} loading={submitting} size="block" />
        </Card>
      )}

      {applyStatus === 'pending' && !isAdvanced && (
        <Card>
          <Text style={styles.pendingText}>您的高级会员申请正在审核中，请耐心等待。</Text>
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { fontSize: 13, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  rejectNote: { fontSize: 13, color: colors.accent, marginTop: 8 },
  feature: { fontSize: 13, color: colors.textSecondary, paddingVertical: 3 },
  input: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, marginBottom: 10, backgroundColor: colors.bgSoft },
  pendingText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
