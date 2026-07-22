import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Toast from '../../components/common/Toast';
import { colors } from '../../theme';

export type PublicPageKey = 'service' | 'case' | 'column' | 'company' | 'contact';

type PublicItem = {
  title: string;
  body: string;
};

type PublicPageContent = {
  title: string;
  subtitle: string;
  items: PublicItem[];
};

export const publicPageContent: Record<Exclude<PublicPageKey, 'contact'>, PublicPageContent> = {
  service: {
    title: '服务介绍',
    subtitle: 'xiaoweimm提供的M&A综合支援服务',
    items: [
      {
        title: '1. 企业转让支援服务',
        body: '面向中小企业经营者，从免费事业评估、匿名案件刊登、买方介绍到谈判辅助提供一站式支持。可在不泄露信息的前提下安心进行出售活动。',
      },
      {
        title: '2. 企业收购支援服务',
        body: '可按行业・区域・预算搜索最佳转让案件。从实地调查、财务确认到签约支持，全程辅助买方各项工作。',
      },
      {
        title: '3. 事业价值免费评估',
        body: '即使在犹豫是否出售的阶段，也可通过简单信息推算出售价格。基于市场动向为您提供合理的价格参考。',
      },
      {
        title: '4. 企业并购咨询',
        body: '比较研究亲属继承・高管继承・第三方转让等多种继承方案，为企业提供最佳选择建议。',
      },
    ],
  },
  case: {
    title: '成交成功案例',
    subtitle: '介绍实际完成的M&A・企业并购案例',
    items: [
      {
        title: '餐饮店事业转让 成功案例',
        body: '因店主高龄。通过刊登获得多个买方报价，以维持员工雇佣为条件圆满成交。',
      },
      {
        title: '区域服务企业收购案例',
        body: '大型企业为扩大地方据点而收购区域密集型服务公司。短期内完成案件匹配，顺利实现业务整合。',
      },
      {
        title: '制造业企业并购案例',
        body: '中小制造企业将事业转让给同行业企业。在守护技术与设备的同时实现了稳定的经营交接。',
      },
    ],
  },
  column: {
    title: 'M&A・企业并购专栏',
    subtitle: '行业动向・基础知识・经营实用信息',
    items: [
      {
        title: '中小企业M&A市场趋势：2026年最新动态',
        body: '近年来中小企业M&A市场持续扩大。人口结构变化背景下企业并购需求日益增长，本文将解读最新市场趋势与成功要点。',
      },
      {
        title: '企业并购应做好的5项准备',
        body: '顺利的企业并购需要充分准备。本文将按财务整理、人才确保、业务标准化等主题讲解关键要点。',
      },
      {
        title: '首次M&A：购买事业的基础知识',
        body: '面向考虑收购事业的经营者，从流程、费用到注意事项全面讲解。也介绍了实际案件与成功案例。',
      },
      {
        title: '利用企业并购税收优惠政策',
        body: '介绍企业并购相关的税收制度与补助金活用方法。由税务师监修的实用信息汇总。',
      },
      {
        title: '如何为企业转让提升企业价值',
        body: '讲解如何在考虑企业转让的同时提升企业价值的要点。从日常经营改善到让企业更具吸引力的诀窍。',
      },
      {
        title: '避免M&A失败的尽职调查要点',
        body: '尽职调查是M&A成功的关键。由经验丰富的专家解说买方应检查的要点与常见陷阱。',
      },
    ],
  },
  company: {
    title: '公司简介',
    subtitle: '小微买卖企业信息 / 经营理念',
    items: [
      {
        title: '经营理念',
        body: '通过企业转让与并购服务守护中国的中小企业，为区域经济活力提升做出贡献。打造安心、透明、公平的M&A环境，实现所有经营者都能认可的企业交接。',
      },
      {
        title: '企业基本信息',
        body: 'xiaoweimm 专注中小企业转让、收购、价值评估与并购咨询。平台以匿名刊登、买方匹配、顾问陪同和交易流程管理为核心服务。',
      },
    ],
  },
};

export const getPublicPageTitle = (page?: PublicPageKey) => {
  if (!page || page === 'contact') return '免费咨询';
  return publicPageContent[page].title;
};

export default function PublicContentScreen({ route }: any) {
  const page = (route?.params?.page || 'service') as PublicPageKey;
  const [toast, setToast] = useState({ visible: false, message: '', type: '' as '' | 'success' | 'error' });

  if (page === 'contact') {
    return <ContactPage toast={toast} setToast={setToast} />;
  }

  const content = publicPageContent[page] || publicPageContent.service;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Hero title={content.title} subtitle={content.subtitle} />
      <View style={styles.body}>
        {content.items.map(item => (
          <Card key={item.title}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

function ContactPage({
  toast,
  setToast,
}: {
  toast: { visible: boolean; message: string; type: '' | 'success' | 'error' };
  setToast: (value: { visible: boolean; message: string; type: '' | 'success' | 'error' }) => void;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
      <Hero title="免费咨询" subtitle="欢迎随时咨询，专业团队将为您服务" />
      <View style={styles.body}>
        <Card>
          <Text style={styles.fieldLabel}>姓名</Text>
          <TextInput style={styles.input} placeholder="请输入姓名" />
          <Text style={styles.fieldLabel}>电话号码</Text>
          <TextInput style={styles.input} placeholder="请输入电话号码" keyboardType="phone-pad" />
          <Text style={styles.fieldLabel}>邮箱地址</Text>
          <TextInput style={styles.input} placeholder="请输入邮箱地址" keyboardType="email-address" />
          <Text style={styles.fieldLabel}>咨询类型</Text>
          <TextInput style={styles.input} placeholder="企业转让 / 企业收购 / 价值评估 / 其他" />
          <Text style={styles.fieldLabel}>咨询内容</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="请填写咨询内容" multiline textAlignVertical="top" />
          <Button title="发送" onPress={() => setToast({ visible: true, message: '咨询提交接口待接入', type: 'success' })} size="block" />
        </Card>
      </View>
    </ScrollView>
  );
}

function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgSoft },
  content: { paddingBottom: 28 },
  hero: { backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 34 },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '800', lineHeight: 36 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 23, marginTop: 10 },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  cardTitle: { fontSize: 17, color: colors.text, fontWeight: '800', marginBottom: 10 },
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 23 },
  fieldLabel: { fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.white, marginBottom: 14 },
  textArea: { height: 110 },
});
