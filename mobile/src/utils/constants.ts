import { Platform } from 'react-native';

// Auto-detect API base URL:
//   Android emulator → 10.0.2.2 (maps to host localhost)
//   iOS simulator    → localhost
//   Physical device  → configure API_HOST in your environment
//
// IMPORTANT: Production must use HTTPS. Set API_HOST env var when building release.
const getApiBaseUrl = (): string => {
  // Allow override via environment / global variable
  const override = (globalThis as any).__API_HOST;
  if (override) {
    // Force HTTPS for non-localhost, non-LAN IPs
    const host = override.includes('://') ? override : `https://${override}`;
    return host.endsWith('/api') ? host : `${host}/api`;
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001/api'; // Android emulator → host localhost
    }
    return 'http://localhost:3001/api'; // iOS simulator
  }

  // Production: MUST configure API_HOST via env/build config
  throw new Error(
    'API_HOST not configured for production build. ' +
    'Set it in your environment or via globalThis.__API_HOST before app init.'
  );
};

export const API_BASE_URL = getApiBaseUrl();

export const industryData: Record<string, string[]> = {
  'Catering': ['Chinese Restaurant','Western Restaurant','Hotpot/BBQ','Fast Food','Cafe/Tea','Bakery/Dessert','Japanese/Korean','Other Catering'],
  'Retail': ['Supermarket','Convenience Store','Clothing/Shoes','Beauty/Cosmetics','Home/Furniture','Electronics','Maternity/Baby','Other Retail'],
  'Manufacturing': ['Precision Machinery','Heavy Equipment','Auto Parts','Electronics/PCB','Home Appliances','Chemical','Food Processing','Textile','Metal Products','Medical Devices','New Energy','Other Manufacturing'],
  'IT/Internet': ['SaaS/ERP','Mobile App','Web Development','IoT/Embedded','E-commerce','Social/Community','EdTech','FinTech','AI/ML','Big Data','Cloud/DevOps','Cybersecurity','Gaming','Blockchain/Web3','VR/AR','IT Outsourcing','Other IT'],
  'Life Services': ['Beauty/Salon','Housekeeping','Wedding/Photography','Auto Repair','Pet Services','Laundry','Appliance Repair','Moving/Delivery','Other Services'],
  'Construction': ['Building Construction','Municipal Engineering','Renovation/Interior','Landscape/Garden','Steel Structure','Other Construction'],
  'Trade/Wholesale': ['Import/Export','Clothing Wholesale','Food Wholesale','Industrial Wholesale','Cross-border E-commerce','Other Trade'],
  'Logistics': ['Express/Delivery','Freight Transport','Cold Chain','Warehousing','International Shipping','Other Logistics'],
  'Education': ['Preschool/Daycare','K-12 School','Higher Education','Test Prep','IT Training','Vocational Training','Language Training','Art/Sports Training','Online Education','Driving School','Other Education'],
  'Healthcare': ['Hospital','Community Clinic','Dental','Cosmetic Surgery','Ophthalmology','OB/GYN','Pediatrics','Orthopedics','TCM/Acupuncture','Health Checkup','Elderly Care','Pharmacy','Medical Devices','Telemedicine','Mental Health','Other Healthcare'],
  'Finance': ['Banking','Insurance','Securities','Fund Management','Trust','Microfinance','Payment/FinTech','Financial Advisory','Wealth Management','Other Finance'],
  'Agriculture': ['Crop Farming','Vegetable/Fruit','Herbal Medicine','Forestry','Poultry','Livestock','Aquaculture','Leisure Agriculture','Agricultural Products Processing','Other Agriculture'],
  'Culture/Media': ['Advertising','Film/TV','Short Video/MCN','Anime/Gaming','Publishing','Printing/Packaging','Entertainment','Artist Management','Museum/Gallery','Sports/Esports','Tourism/Theme Park','Events/Exhibition','Creative Products','Other Culture'],
  'Other': ['Comprehensive/Diversified','Other']
};

export const regionData: Record<string, string[]> = {
  'Beijing': ['Dongcheng','Xicheng','Chaoyang','Haidian','Fengtai','Tongzhou','Daxing','Shunyi','Changping','Fangshan','Other'],
  'Shanghai': ['Pudong','Huangpu','Xuhui','Jing\'an','Changning','Hongkou','Minhang','Yangpu','Putuo','Baoshan','Other'],
  'Guangdong': ['Guangzhou','Shenzhen','Dongguan','Foshan','Zhuhai','Huizhou','Zhongshan','Jiangmen','Shantou','Other'],
  'Zhejiang': ['Hangzhou','Ningbo','Wenzhou','Jiaxing','Shaoxing','Jinhua','Taizhou','Huzhou','Other'],
  'Jiangsu': ['Nanjing','Suzhou','Wuxi','Changzhou','Nantong','Xuzhou','Yangzhou','Zhenjiang','Yancheng','Other'],
  'Sichuan': ['Chengdu','Mianyang','Deyang','Yibin','Nanchong','Luzhou','Leshan','Other'],
  'Hubei': ['Wuhan','Yichang','Xiangyang','Jingzhou','Huanggang','Shiyan','Other'],
  'Shandong': ['Qingdao','Jinan','Yantai','Weifang','Linyi','Weihai','Zibo','Jining','Other'],
  'Fujian': ['Xiamen','Fuzhou','Quanzhou','Zhangzhou','Putian','Longyan','Other'],
  'Henan': ['Zhengzhou','Luoyang','Kaifeng','Nanyang','Xuchang','Xinxiang','Other'],
  'Hunan': ['Changsha','Zhuzhou','Xiangtan','Yueyang','Hengyang','Changde','Other'],
  'Shaanxi': ['Xi\'an','Xianyang','Baoji','Weinan','Yan\'an','Other'],
  'Anhui': ['Hefei','Wuhu','Bengbu','Anqing','Ma\'anshan','Other'],
  'Liaoning': ['Dalian','Shenyang','Anshan','Jinzhou','Yingkou','Other'],
  'Chongqing': ['Yuzhong','Jiangbei','Nan\'an','Jiulongpo','Shapingba','Yubei','Banan','Other'],
  'Tianjin': ['Heping','Hexi','Nankai','Hedong','Hebei','Binhai','Xiqing','Other'],
  'Other': ['Other City']
};

export const dealStages = [
  { id: 'matching', label: 'Matching', icon: '🤝' },
  { id: 'nda', label: 'NDA', icon: '🔒' },
  { id: 'due_diligence', label: 'Due Diligence', icon: '🔍' },
  { id: 'contract', label: 'Contract', icon: '📝' },
  { id: 'payment', label: 'Payment', icon: '💰' },
  { id: 'handover', label: 'Handover', icon: '📦' },
  { id: 'complete', label: 'Complete', icon: '✅' },
];
