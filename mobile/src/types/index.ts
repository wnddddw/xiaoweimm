export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'seller' | 'buyer' | 'admin';
  member_level: 'free' | 'personal' | 'company' | 'vip';
  member_expire: string | null;
  auto_renew: boolean;
  verify_status: 'none' | 'pending' | 'approved' | 'rejected';
  status: 'active' | 'disabled';
  balance: number;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  industry: string;
  sub_industry: string;
  province: string;
  city: string;
  revenue: number;
  employees: string;
  transfer_reason: string;
  profit_rate: number;
  price: number;
  description: string;
  equipment: string;
  raw_material: string;
  inventory: string;
  hide_company: number;
  hide_address: number;
  hide_customers: number;
  hide_partners: number;
  hide_financial: number;
  status: 'pending' | 'online' | 'offline' | 'rejected' | 'sold';
  views: number;
  offers: number;
  matches: number;
  is_top: number;
  submit_time: string;
  review_time: string | null;
  match_score?: number;
  match_reasons?: string[];
}

export interface Deal {
  id: string;
  project_id: string;
  seller_name: string;
  buyer_name: string;
  price: number;
  advisor: string;
  stage: string;
  stage_time: string;
  note: string;
  created_at: string;
}

export interface DealEvent {
  id: string;
  deal_id: string;
  stage: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface Message {
  id: string;
  category: 'project' | 'intent' | 'nda' | 'advisor' | 'system';
  subject: string;
  body: string;
  is_read: number;
  created_at: string;
}

export interface Verification {
  id: string;
  type: 'personal' | 'company';
  status: 'pending' | 'approved' | 'rejected';
  data: string;
  submit_time: string;
  review_time?: string;
  reject_reason?: string;
}

export interface Payment {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  pay_method: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
