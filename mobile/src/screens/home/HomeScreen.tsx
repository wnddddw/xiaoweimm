import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authApi, getApiErrorMessage } from '../../api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme';

type AuthMode = 'phoneLogin' | 'passwordLogin' | 'register';
type RoleTarget = 'seller' | 'buyer';

const navMenuItems = [
  { label: '想要出售事业', role: 'seller' as RoleTarget },
  { label: '想要收购事业', role: 'buyer' as RoleTarget },
  { label: '服务介绍', page: 'service' },
  { label: '成功案例', page: 'case' },
  { label: '行业专栏', page: 'column' },
  { label: '公司简介', page: 'company' },
];


const freeConsultTarget = { page: 'contact' };

const dataMetrics = [
  { value: '30万+', label: '注册买家企业' },
  { value: '行业No.1', label: '并购成交业绩' },
  { value: '0元', label: '卖方初始费用' },
  { value: '24h', label: '匿名案件发布' },
];

const serviceCards = [
  { title: '完全免费出售支持', body: '注册费、评估费、月费全部免费，减轻经营者负担。' },
  { title: '匿名安心交易', body: '支持企业名非公开刊登，可悄然顺利推进出售活动，无需担心周围知晓。' },
  { title: '专业顾问陪同', body: '并购实务经验丰富的团队从评估到最终合同全程支持。' },
];

const caseCards = [
  { industry: '餐饮美食', title: '北京朝阳区 · 火锅连锁店', price: '¥780万', revenue: '¥1,200万', days: '45天', image: 'https://picsum.photos/seed/hotpot/600/340', description: '经营者因无人接班欲转让经营15年的火锅店。平台匹配到餐饮集团买家，签署保密协议后2周内完成尽调，45天完成交割。原员工全员留任。' },
  { industry: '生产制造', title: '苏州工业园区 · 精密机械厂', price: '¥2,400万', revenue: '¥3,500万', days: '68天', image: 'https://picsum.photos/seed/factory/600/340', description: '汽车零部件二级供应商，创始人高龄无继承人。通过平台AI匹配推荐给国内上市集团，经3轮谈判达成全资收购，管理团队留任3年。' },
  { industry: 'IT互联网', title: '深圳南山区 · 金融IT公司', price: '¥4,100万', revenue: '¥5,000万', days: '92天', image: 'https://picsum.photos/seed/ittech/600/340', description: '金融软件外包企业，创始团队希望转型。平台顾问协助完成估值报告，吸引3家竞购方，最终以溢价15%成交。原团队核心技术骨干全部保留。' },
];

const footerLinks = [
  { title: '服务', links: ['企业转让', '企业收购', '价值评估'] },
  { title: '实用信息', links: ['成功案例', '行业专栏'] },
  { title: '公司信息', links: ['公司简介'] },
  { title: '联系我们', links: ['TEL：400-888-6688', '免费咨询表单'] },
];

export default function HomeScreen({ navigation }: any) {
  const { login, loginSms, register, logout, isAuthenticated, user } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [roleSwitchMode, setRoleSwitchMode] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode>('phoneLogin');
  const [targetRole, setTargetRole] = useState<RoleTarget>('seller');
  const [justLogin, setJustLogin] = useState(false);
  const [pendingRole, setPendingRole] = useState<RoleTarget | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  useEffect(() => {
    if (!pendingRole || !isAuthenticated || !user) return;
    if (user.role !== pendingRole) { showRoleMismatch(pendingRole); } else { navigateRole(pendingRole); }
    setPendingRole(null);
  }, [pendingRole, isAuthenticated, user]);

  const navigateRole = (role: RoleTarget) => { if (role === 'seller') navigation.navigate('Seller'); else if (role === 'buyer') navigation.navigate('Buyer'); else navigation.navigate('Admin'); };

  const handleRoleEntrance = (role: RoleTarget) => {
    setTargetRole(role);
    if (!isAuthenticated) { setAuthModalVisible(true); setRoleSwitchMode(false); return; }
    if (user?.role === role) { navigateRole(role); return; }
    showRoleMismatch(role);
  };

  const showRoleMismatch = (role: RoleTarget) => { if (user?.role === 'admin') { setRoleSwitchMode(false); setAuthModalVisible(false); setToast({ visible: true, message: '管理员账号不支持角色切换', type: 'error' }); return; } setTargetRole(role); setRoleSwitchMode(true); setAuthModalVisible(true); };

  const openPublicPage = (page: 'service' | 'case' | 'column' | 'company' | 'contact') => { navigation.navigate('PublicContent', { page }); };

  const handleLogin = async () => {
    if (!phone || phone.length < 11) { setToast({ visible: true, message: '请输入手机号', type: 'error' }); return; }
    setLoading(true);
    try {
      if (modalMode === 'phoneLogin') {
        if (!code) { setToast({ visible: true, message: '请输入验证码', type: 'error' }); setLoading(false); return; }
        await loginSms(phone, code);
      } else {
        if (!password) { setToast({ visible: true, message: '请输入密码', type: 'error' }); setLoading(false); return; }
        await login(phone, password);
      }
      setAuthModalVisible(false); if (!justLogin) { setPendingRole(targetRole); } else { setJustLogin(false); }
    } catch (e: any) { setToast({ visible: true, message: getApiErrorMessage(e), type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!phone || !password || !name || !agree) { setToast({ visible: true, message: '请完善信息并同意条款', type: 'error' }); return; }
    setLoading(true);
    try { await register(phone, password, name, targetRole); setAuthModalVisible(false); if (!justLogin) { setPendingRole(targetRole); } else { setJustLogin(false); } }
    catch (e: any) { setToast({ visible: true, message: getApiErrorMessage(e), type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleSendCode = async () => {
    if (!phone) { setToast({ visible: true, message: '请输入手机号', type: 'error' }); return; }
    try {
      await authApi.requestSmsCode(phone); setCountdown(60);
      timerRef.current = setInterval(() => { setCountdown(c => { if (c <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return c - 1; }); }, 1000);
    } catch (e: any) { setToast({ visible: true, message: getApiErrorMessage(e), type: 'error' }); }
  };

  const handleLogoutAndSwitch = async () => {
    setAuthModalVisible(false); setRoleSwitchMode(false);
    try { await logout(); } catch (_) {}
    setPendingRole(targetRole);
  };

  const resetModal = () => {
    setAuthModalVisible(false); setRoleSwitchMode(false); setModalMode('phoneLogin');
    setJustLogin(false); setPhone(''); setCode(''); setPassword(''); setName(''); setAgree(false); setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />

        <View style={styles.topBar}>
          <Text style={styles.logo}>xiaoweimm</Text>
          {isAuthenticated && user ? (
            <TouchableOpacity style={styles.userPill} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.userPillText}>{user.phone || user.name}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginPill} onPress={() => { setJustLogin(true); setAuthModalVisible(true); }}>
              <Text style={styles.loginPillText}>登录 / 注册</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navMenu} contentContainerStyle={styles.navMenuContent}>
          {navMenuItems.map(item => (
            <TouchableOpacity key={item.label} style={styles.navMenuItem} onPress={() => item.role ? handleRoleEntrance(item.role) : openPublicPage(item.page as any)}>
              <Text style={styles.navMenuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.navRoleStrip}>
          <TouchableOpacity style={[styles.navRoleButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => handleRoleEntrance('seller')}>
            <Text style={[styles.navRoleButtonText, { color: colors.white }]}>我是卖家</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRoleButton, { borderColor: colors.primary }]} onPress={() => handleRoleEntrance('buyer')}>
            <Text style={[styles.navRoleButtonText, { color: colors.primary }]}>我是买家</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRoleButton, { borderColor: colors.primary }]} onPress={() => openPublicPage('contact')}>
            <Text style={[styles.navRoleButtonText, { color: colors.primary }]}>免费咨询</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>安心并购，</Text>
          <Text style={styles.heroTitle}>从 xiaoweimm 开始</Text>
          <Text style={styles.heroSubtitle}>保护中小企业，为区域经济贡献力量</Text>
          <Image source={{ uri: 'https://picsum.photos/seed/hero/800/400' }} style={styles.heroImage} />
        </View>

        <View style={styles.dataGrid}>
          {dataMetrics.map((d, i) => (
            <View key={i} style={styles.dataItem}>
              <Text style={styles.dataValue}>{d.value}</Text>
              <Text style={styles.dataLabel}>{d.label}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title={'服务介绍'} subtitle={'从出售到收购，全程免费支持'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
          {serviceCards.map((s, i) => (
            <Card key={i} style={styles.serviceCard}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.body}</Text>
            </Card>
          ))}
        </ScrollView>

        <SectionTitle title={'成功案例'} subtitle={'真实成交，值得信赖'} />
        {caseCards.map((c, i) => (
          <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => navigation.navigate('CaseDetail', { caseData: { id: i, ...c } })}>
            <Card>
              <Image source={{ uri: c.image }} style={styles.caseImage} />
              <View style={styles.caseHead}>
                <Text style={styles.caseTag}>{c.industry}</Text>
                <Text style={styles.caseDone}>✓ 已成交</Text>
              </View>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <View style={styles.caseMetrics}>
                <View style={styles.caseMetric}><Text style={styles.caseMetricValue}>{c.price}</Text><Text style={styles.caseMetricLabel}>成交价</Text></View>
                <View style={styles.caseMetric}><Text style={styles.caseMetricValue}>{c.revenue}</Text><Text style={styles.caseMetricLabel}>年营收</Text></View>
                <View style={styles.caseMetric}><Text style={styles.caseMetricValue}>{c.days}</Text><Text style={styles.caseMetricLabel}>成交周期</Text></View>
              </View>
              <Text style={styles.caseDescription}>{c.description}</Text>
            </Card>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.allCasesButton} onPress={() => openPublicPage('case')}>
          <Text style={styles.allCasesText}>查看全部案例 →</Text>
        </TouchableOpacity>

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>开始免费咨询</Text>
          <Text style={styles.ctaBody}>即使是犹豫是否出售的阶段也没关系。欢迎随时咨询，专业团队将为您提供合理方案。</Text>
          <Button title={'马上免费咨询'} onPress={() => openPublicPage('contact')} size="block" />
        </View>

        <View style={styles.footer}>
          {footerLinks.map((g, i) => (
            <View key={i} style={styles.footerGroup}>
              <Text style={styles.footerTitle}>{g.title}</Text>
              {g.links.map((l, j) => <Text key={j} style={styles.footerText}>{l}</Text>)}
            </View>
          ))}
          <Text style={styles.copyright}>© 2026 xiaoweimm All rights reserved.</Text>
        </View>
      </ScrollView>

      <Modal visible={authModalVisible} transparent animationType="fade" onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={resetModal}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
            {roleSwitchMode ? (
              <View>
                <Text style={styles.roleSwitchMsg}>{'您当前是' + (user?.role === 'admin' ? '管理员' : (targetRole === 'seller' ? '买家' : '卖家')) + '账号，要切换到' + (targetRole === 'seller' ? '卖家' : '买家') + '，请先退出当前账号'}</Text>
                <Button title={'退出当前账号'} onPress={handleLogoutAndSwitch} size="block" />
                <View style={{ height: 10 }} />
                <Button title={'取消'} onPress={resetModal} size="block" />
              </View>
            ) : (
              <View>
                <View style={styles.modalTabs}>
                  {(['phoneLogin', 'passwordLogin', 'register'] as AuthMode[]).map(mode => (
                    <TouchableOpacity key={mode} style={[styles.authTab, modalMode === mode && styles.authTabActive]} onPress={() => setModalMode(mode)}>
                      <Text style={[styles.authTabText, modalMode === mode && styles.authTabTextActive]}>
                        {mode === 'phoneLogin' ? '手机登录' : mode === 'passwordLogin' ? '密码登录' : '注册'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder={'手机号'} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                {modalMode === 'phoneLogin' && (
                  <View style={styles.smsRow}>
                    <TextInput style={[styles.input, styles.smsInput]} placeholder={'验证码'} keyboardType="number-pad" value={code} onChangeText={setCode} />
                    <TouchableOpacity style={[styles.smsBtn, countdown > 0 && styles.smsBtnDisabled]} onPress={handleSendCode} disabled={countdown > 0}>
                      <Text style={styles.smsBtnText}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {modalMode !== 'phoneLogin' && (
                  <TextInput style={styles.input} placeholder={'密码'} secureTextEntry value={password} onChangeText={setPassword} />
                )}
                {modalMode === 'register' && (
                  <TextInput style={styles.input} placeholder={'昵称'} value={name} onChangeText={setName} />
                )}
                {modalMode === 'phoneLogin' && (
                  <TouchableOpacity style={styles.modalExtra} onPress={() => setModalMode('passwordLogin')}>
                    <Text style={styles.modalExtraText}>使用密码登录</Text>
                  </TouchableOpacity>
                )}
                {modalMode === 'register' && (
                  <View style={styles.agreeRow}>
                    <TouchableOpacity onPress={() => setAgree(!agree)}>
                      <Text style={[styles.checkbox, agree && styles.checkboxChecked]}>{agree ? '✓' : ''}</Text>
                    </TouchableOpacity>
                    <Text style={styles.agreeText}>同意用户协议和隐私政策</Text>
                  </View>
                )}
                <Button title={modalMode === 'register' ? '注册' : '登录'} onPress={modalMode === 'register' ? handleRegister : handleLogin} loading={loading} size="block" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  logo: { fontSize: 20, fontWeight: '800', color: colors.primary },
  userPill: { minHeight: 36, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.bg, justifyContent: 'center' },
  userPillText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  loginPill: { minHeight: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center' },
  loginPillText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  navMenu: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  navMenuContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  navMenuItem: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  navMenuText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  navRoleStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white },
  navRoleButton: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  navRoleButtonText: { fontSize: 14, fontWeight: '800' },
  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 34 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, marginBottom: 16 },
  heroImage: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.muted },
  dataGrid: { backgroundColor: colors.bg, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dataItem: { width: '47%', backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  dataValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  dataLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  sectionTitleWrap: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 10, alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  sectionSubtitle: { marginTop: 6, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  serviceScroll: { paddingHorizontal: 16, gap: 12 },
  serviceCard: { width: 260 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 },
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  caseImage: { width: '100%', height: 172, borderRadius: 10, backgroundColor: colors.muted, marginBottom: 14 },
  caseHead: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  caseTag: { color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, fontSize: 12, fontWeight: '700' },
  caseDone: { color: colors.successDark, backgroundColor: colors.successSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, fontSize: 12, fontWeight: '700' },
  caseMetrics: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12, marginTop: 4 },
  caseMetric: { flex: 1 },
  caseMetricValue: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  caseMetricLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  caseDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 12 },
  allCasesButton: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 28, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 8 },
  allCasesText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  cta: { margin: 16, padding: 24, borderRadius: 16, backgroundColor: colors.primaryDark },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 10 },
  ctaBody: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 22, marginBottom: 18 },
  footer: { backgroundColor: colors.dark, paddingHorizontal: 18, paddingVertical: 28, marginTop: 12 },
  footerGroup: { marginBottom: 16 },
  footerTitle: { color: colors.white, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  footerText: { color: colors.border, fontSize: 13, lineHeight: 20 },
  copyright: { color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 },
  modalBox: { backgroundColor: colors.white, borderRadius: 14, padding: 20 },
  roleSwitchMsg: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 18, textAlign: 'center' },
  modalClose: { position: 'absolute', top: 8, right: 12, zIndex: 2, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 26, color: colors.textTertiary },
  modalTabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.borderLight, marginBottom: 20, marginTop: 8 },
  authTab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -2 },
  authTabActive: { borderBottomColor: colors.primary },
  authTabText: { color: colors.textTertiary, fontSize: 15, fontWeight: '700' },
  authTabTextActive: { color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 15, marginBottom: 12, color: colors.text, backgroundColor: colors.white },
  smsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  smsInput: { flex: 1, marginBottom: 0 },
  smsBtn: { minWidth: 104, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  smsBtnDisabled: { backgroundColor: colors.textTertiary },
  smsBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  modalExtra: { alignItems: 'center', paddingTop: 14 },
  modalExtraText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.border, textAlign: 'center', lineHeight: 18, color: colors.white },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  agreeText: { color: colors.textSecondary, fontSize: 13 },
});
