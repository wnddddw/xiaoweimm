import { StyleSheet } from 'react-native';

/**
 * 小微买卖设计规范（Design Tokens）
 * 可信的商务/并购平台视觉语言：深蓝主色 + 金色点缀 + 中性灰阶
 */

export const colors = {
  // 品牌主色
  primary: '#1A44AA', // 深蓝 — 信任、专业
  primaryDark: '#12306B', // 深海军蓝 — 英雄区/强调面
  primarySoft: '#EAF0FB', // 主色浅底 — 选中态/标签底
  primaryBorder: '#B9C9E8', // 主色系描边

  // 点缀金（会员/价值强调）
  accent: '#B8912A',
  accentSoft: '#FBF3DE',

  // 功能色
  success: '#1E8449',
  successDark: '#145A32',
  successSoft: '#DFF5E7',
  warn: '#9C7A0A',
  warnDark: '#7D6608',
  warnSoft: '#FDF0D5',
  danger: '#C0392B',
  dangerDark: '#922B21',
  dangerSoft: '#FADBD8',
  price: '#C0392B', // 价格/金额强调

  // 中性色阶
  text: '#101828',
  textSecondary: '#475467',
  textTertiary: '#98A2B3',
  border: '#CBD2DC',
  borderLight: '#ECEFF3',
  muted: '#E5E7EA',
  bg: '#F4F6FA',
  bgSoft: '#F8FAFD',
  white: '#FFFFFF',
  black: '#000000',
  dark: '#151D2B', // 深色页脚/底栏
  overlay: 'rgba(16,24,40,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const typography = {
  hero: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34 },
  h1: { fontSize: 22, fontWeight: '800' as const, lineHeight: 30 },
  h2: { fontSize: 17, fontWeight: '700' as const, lineHeight: 24 },
  title: { fontSize: 15, fontWeight: '700' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  tiny: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16 },
  metric: { fontSize: 22, fontWeight: '800' as const, lineHeight: 28 },
};

export const shadows = {
  card: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  subtle: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};

/** 通用表单/页面基础样式，页面级 StyleSheet 可展开复用 */
export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
});

/** 头部导航通用配置 */
export const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};
