const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, run, get } = require('./init');

async function seed() {
  const db = await getDb();
  console.log('Seeding database...');

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync('123456', 10);

  // Admin
  const adminId = uuidv4();
  if (!get('SELECT id FROM users WHERE phone = ?', ['13800000000'])) {
    run('INSERT INTO users (id, phone, password_hash, name, role, member_level, member_expire, auto_renew, avatar_url, verify_status, status, balance, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [adminId, '13800000000', hash, '系统管理员', 'admin', 'free', null, 0, null, 'approved', 'active', 0, now, now]);
  }

  // Seller
  const sellerId = uuidv4();
  if (!get('SELECT id FROM users WHERE phone = ?', ['13800138001'])) {
    run('INSERT INTO users (id, phone, password_hash, name, role, member_level, member_expire, auto_renew, avatar_url, verify_status, status, balance, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [sellerId, '13800138001', hash, '张建国', 'seller', 'free', null, 0, null, 'approved', 'active', 10000, now, now]);
  }

  // Buyer
  const buyerId = uuidv4();
  if (!get('SELECT id FROM users WHERE phone = ?', ['13800138002'])) {
    run('INSERT INTO users (id, phone, password_hash, name, role, member_level, member_expire, auto_renew, avatar_url, verify_status, status, balance, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [buyerId, '13800138002', hash, '李明远', 'buyer', 'free', null, 0, null, 'approved', 'active', 10000, now, now]);
  }

  // Get actual IDs from DB
  const seller = get('SELECT id FROM users WHERE phone = ?', ['13800138001']);
  const sellerUserId = seller ? seller.id : sellerId;

  // Projects
  const projects = [
    ['P20260501001', sellerUserId, '餐饮美食', '火锅/烧烤', '北京', '朝阳区', 1200, '6-20', 'no_heir', 18, 800, '北京知名火锅连锁，经营12年，客源稳定。', 342, 8, 23, '2026-05-01 10:30', '2026-05-01 11:45'],
    ['P20260515002', sellerUserId, '生产制造', '精密加工', '江苏省', '苏州市', 3500, '21-50', 'owner_age', 12, 2500, '苏州工业园区精密机械加工厂，设备齐全。', 218, 5, 16, '2026-05-15 14:20', '2026-05-15 15:10'],
    ['P20260520003', sellerUserId, 'IT互联网', '金融科技/支付', '广东省', '深圳市', 5000, '6-20', 'transformation', 25, 4200, '深圳金融科技外包公司，客户资源丰富。', 0, 0, 0, '2026-05-20 16:48', null],
    ['P20260410004', sellerUserId, '零售百货', '服装/鞋包', '四川省', '成都市', 450, '1-5', 'other', null, 320, '成都文创零售店，地理位置优越。', 56, 1, 3, '2026-04-10 09:15', '2026-04-10 10:30'],
  ];

  projects.forEach(p => {
    if (!get('SELECT id FROM projects WHERE id = ?', [p[0]])) {
      run('INSERT INTO projects (id, user_id, industry, sub_industry, province, city, revenue, employees, transfer_reason, profit_rate, price, description, equipment, raw_material, inventory, hide_company, hide_address, hide_customers, hide_partners, hide_financial, status, views, offers, matches, submit_time, review_time, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11], '[]', '[]', '[]', 0, 0, 1, 1, 1, 'online', p[12], p[13], p[14], p[15], p[16] || now, now, now]);
    }
  });

  // Messages for seller
  if (!get('SELECT id FROM messages WHERE user_id = ? LIMIT 1', [sellerUserId])) {
    const msgs = [
      [sellerUserId, 'system', '欢迎加入小微买卖', '欢迎加入小微买卖M&A平台！开始您的企业转让之旅。', 0, '2026-05-15 00:01'],
      [sellerUserId, 'project', '项目审核通过', '您的项目已通过审核并上线展示。', 1, '2026-05-01 11:45'],
      [sellerUserId, 'intent', '收到新报价', '有买家对您的项目提交了报价，请及时查看。', 0, '2026-05-20 14:30'],
    ];
    msgs.forEach(m => { run('INSERT INTO messages (id, user_id, category, subject, body, is_read, created_at) VALUES (?,?,?,?,?,?,?)', [uuidv4(), ...m]); });
  }

  // Messages for buyer
  const buyer = get('SELECT id FROM users WHERE phone = ?', ['13800138002']);
  if (buyer && !get('SELECT id FROM messages WHERE user_id = ? LIMIT 1', [buyer.id])) {
    const msgs = [
      [buyer.id, 'system', '欢迎加入小微买卖', '欢迎！开始浏览项目并提交收购意向。', 0, '2026-05-15 00:01'],
      [buyer.id, 'intent', '申请已通过', '卖家已同意您的收购申请。', 1, '2026-05-17 15:45'],
    ];
    msgs.forEach(m => { run('INSERT INTO messages (id, user_id, category, subject, body, is_read, created_at) VALUES (?,?,?,?,?,?,?)', [uuidv4(), ...m]); });
  }

  // Default config
  const cfg = { commission: 2, minFee: 6000, personalFee: 300, companyFee: 600, vipFee: 1800, reviewTimeout: 120, projectExpire: 90, notifyWindow: 60 };
  Object.keys(cfg).forEach(k => {
    if (!get('SELECT key FROM config WHERE key = ?', [k])) {
      run('INSERT INTO config (key, value) VALUES (?,?)', [k, JSON.stringify(cfg[k])]);
    }
  });

  console.log('Seed data complete. Test accounts: admin/seller/buyer (default password, see seed.js source)');
}

seed().catch(e => { console.error(e); process.exit(1); });
