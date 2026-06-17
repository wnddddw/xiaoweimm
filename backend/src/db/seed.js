const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, run, get } = require('./init');

async function seed() {
  await getDb();
  console.log('Seeding database...');

  const now = new Date().toISOString();
  const defaultHash = bcrypt.hashSync('123456', 10);
  const sellerHash = bcrypt.hashSync('test123', 10);

  const users = [
    { phone: '13800000000', passwordHash: defaultHash, name: '系统管理员', role: 'admin', balance: 0 },
    { phone: '13800138001', passwordHash: sellerHash, name: '张建国', role: 'seller', balance: 10000 },
    { phone: '13800138002', passwordHash: defaultHash, name: '李明远', role: 'buyer', balance: 10000 },
  ];

  for (const user of users) {
    const existing = get('SELECT id FROM users WHERE phone = ?', [user.phone]);
    if (existing) {
      run('UPDATE users SET password_hash=?, name=?, role=?, status=?, verify_status=?, updated_at=? WHERE phone=?',
        [user.passwordHash, user.name, user.role, 'active', 'approved', now, user.phone]);
    } else {
      run('INSERT INTO users (id, phone, password_hash, name, role, member_level, member_expire, auto_renew, avatar_url, verify_status, status, balance, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [uuidv4(), user.phone, user.passwordHash, user.name, user.role, 'free', null, 0, null, 'approved', 'active', user.balance, now, now]);
    }
  }

  const seller = get('SELECT id FROM users WHERE phone = ?', ['13800138001']);
  const buyer = get('SELECT id FROM users WHERE phone = ?', ['13800138002']);
  const sellerUserId = seller.id;

  const projects = [
    ['P20260501001', '餐饮美食', '火锅/串串', '北京', '朝阳区', 1200, '6-20', 'no_heir', 18, 800, '北京知名火锅连锁门店，经营12年，客源稳定，适合餐饮团队接手。', 342, 8, 23, '2026-05-01 10:30', '2026-05-01 11:45'],
    ['P20260515002', '生产制造', '精密机械', '江苏省', '苏州市', 3500, '21-50', 'owner_age', 12, 2500, '苏州工业园区精密机械加工厂，设备齐全，客户结构稳定。', 218, 5, 16, '2026-05-15 14:20', '2026-05-15 15:10'],
    ['P20260520003', 'IT互联网', '金融科技/支付系统', '广东省', '深圳市', 5000, '6-20', 'transformation', 25, 4200, '深圳金融科技外包公司，拥有成熟支付系统项目经验。', 0, 0, 0, '2026-05-20 16:48', null],
    ['P20260410004', '零售百货', '服装鞋包', '四川省', '成都市', 450, '1-5', 'other', null, 320, '成都文创零售店，地理位置优越，库存和客户资源可交接。', 56, 1, 3, '2026-04-10 09:15', '2026-04-10 10:30'],
  ];

  for (const project of projects) {
    if (!get('SELECT id FROM projects WHERE id = ?', [project[0]])) {
      run('INSERT INTO projects (id, user_id, industry, sub_industry, province, city, revenue, employees, transfer_reason, profit_rate, price, description, equipment, raw_material, inventory, hide_company, hide_address, hide_customers, hide_partners, hide_financial, status, views, offers, matches, submit_time, review_time, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [project[0], sellerUserId, project[1], project[2], project[3], project[4], project[5], project[6], project[7], project[8], project[9], project[10], '[]', '[]', '[]', 0, 0, 1, 1, 1, 'online', project[11], project[12], project[13], project[14], project[15] || now, now, now]);
    }
  }

  if (!get('SELECT id FROM messages WHERE user_id = ? LIMIT 1', [sellerUserId])) {
    [
      [sellerUserId, 'system', '欢迎加入小微买卖', '欢迎加入小微买卖 M&A 平台，开始您的企业转让之旅。', 0, '2026-05-15 00:01'],
      [sellerUserId, 'project', '项目审核通过', '您的项目已通过审核并上线展示。', 1, '2026-05-01 11:45'],
      [sellerUserId, 'intent', '收到新的报价', '有买家对您的项目提交了报价，请及时查看。', 0, '2026-05-20 14:30'],
    ].forEach(message => {
      run('INSERT INTO messages (id, user_id, category, subject, body, is_read, created_at) VALUES (?,?,?,?,?,?,?)', [uuidv4(), ...message]);
    });
  }

  if (buyer && !get('SELECT id FROM messages WHERE user_id = ? LIMIT 1', [buyer.id])) {
    [
      [buyer.id, 'system', '欢迎加入小微买卖', '欢迎您开始浏览项目并提交收购意向。', 0, '2026-05-15 00:01'],
      [buyer.id, 'intent', '申请已通过', '卖家已同意您的收购申请。', 1, '2026-05-17 15:45'],
    ].forEach(message => {
      run('INSERT INTO messages (id, user_id, category, subject, body, is_read, created_at) VALUES (?,?,?,?,?,?,?)', [uuidv4(), ...message]);
    });
  }

  const configValues = { commission: 2, minFee: 6000, personalFee: 300, companyFee: 600, vipFee: 1800, reviewTimeout: 120, projectExpire: 90, notifyWindow: 60 };
  Object.keys(configValues).forEach(key => {
    if (!get('SELECT key FROM config WHERE key = ?', [key])) {
      run('INSERT INTO config (key, value) VALUES (?,?)', [key, JSON.stringify(configValues[key])]);
    }
  });

  console.log('Seed data complete. Test accounts: 13800000000/123456, 13800138001/test123, 13800138002/123456');
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
