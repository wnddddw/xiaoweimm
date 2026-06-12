const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbPath = path.resolve(config.dbPath);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  createTables();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, phone TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      name TEXT DEFAULT '', email TEXT DEFAULT '', company_name TEXT DEFAULT '',
      wechat_id TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'buyer',
      member_level TEXT DEFAULT 'free', member_expire TEXT, auto_renew INTEGER DEFAULT 0,
      avatar_url TEXT, verify_status TEXT DEFAULT 'none', status TEXT DEFAULT 'active',
      balance REAL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_change_logs (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, field TEXT NOT NULL,
      old_value TEXT, new_value TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
      real_name TEXT DEFAULT '', id_number TEXT DEFAULT '', address TEXT DEFAULT '',
      company_name TEXT DEFAULT '', legal_person TEXT DEFAULT '', biz_type TEXT DEFAULT '',
      status TEXT DEFAULT 'pending', reject_reason TEXT,
      id_card_url TEXT, license_url TEXT, submit_time TEXT, review_time TEXT,
      reviewer_id TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, industry TEXT NOT NULL,
      sub_industry TEXT, province TEXT NOT NULL, city TEXT NOT NULL, revenue REAL,
      employees TEXT, transfer_reason TEXT, profit_rate REAL, price REAL,
      description TEXT, equipment TEXT DEFAULT '[]', raw_material TEXT DEFAULT '[]',
      inventory TEXT DEFAULT '[]', hide_company INTEGER DEFAULT 0, hide_address INTEGER DEFAULT 0,
      hide_customers INTEGER DEFAULT 0, hide_partners INTEGER DEFAULT 0,
      hide_financial INTEGER DEFAULT 0, status TEXT DEFAULT 'pending',
      views INTEGER DEFAULT 0, offers INTEGER DEFAULT 0, matches INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0, submit_time TEXT, review_time TEXT, refresh_time TEXT,
      offline_time TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS demands (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, industry TEXT, sub_industry TEXT,
      province TEXT, city TEXT, budget_min REAL, budget_max REAL, scale TEXT,
      purpose TEXT, priority TEXT, pay_method TEXT, note TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT NOT NULL,
      created_at TEXT NOT NULL, UNIQUE(user_id, project_id)
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT NOT NULL,
      note TEXT, status TEXT DEFAULT 'pending', fund_plan_url TEXT, biz_plan_url TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY, project_id TEXT, seller_id TEXT, buyer_id TEXT,
      seller_name TEXT, buyer_name TEXT, price REAL, advisor TEXT,
      stage TEXT DEFAULT 'matching', stage_time TEXT DEFAULT '{}', note TEXT,
      nda_file TEXT, dd_file TEXT, contract_file TEXT, receipt_file TEXT,
      handover_plan TEXT, final_price REAL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deal_events (
      id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, stage TEXT, action TEXT,
      detail TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT DEFAULT 'system',
      subject TEXT, body TEXT, is_read INTEGER DEFAULT 0,
      related_type TEXT, related_id TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS membership_orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan_type TEXT NOT NULL,
      amount REAL NOT NULL, pay_method TEXT, status TEXT DEFAULT 'completed',
      period_start TEXT, period_end TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
      amount REAL NOT NULL, balance_before REAL, balance_after REAL,
      pay_method TEXT, status TEXT DEFAULT 'completed', related_type TEXT,
      related_id TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, item TEXT,
      amount REAL NOT NULL, status TEXT DEFAULT 'unpaid', pay_time TEXT, due_date TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sms_codes (
      id TEXT PRIMARY KEY, phone TEXT NOT NULL, code TEXT NOT NULL,
      expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, channel TEXT NOT NULL,
      amount REAL NOT NULL, subject TEXT DEFAULT '',
      status TEXT DEFAULT 'pending', out_trade_no TEXT, payment_url TEXT,
      callback_data TEXT, created_at TEXT NOT NULL, paid_at TEXT
    );
    CREATE TABLE IF NOT EXISTS agreements (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, version TEXT NOT NULL,
      title TEXT NOT NULL, content TEXT NOT NULL,
      is_active INTEGER DEFAULT 1, published_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_agreements (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, agreement_id TEXT NOT NULL,
      agreed_at TEXT NOT NULL, UNIQUE(user_id, agreement_id)
    );
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL,
      open_id TEXT NOT NULL, union_id TEXT, nickname TEXT,
      avatar_url TEXT, raw_data TEXT, created_at TEXT NOT NULL,
      UNIQUE(provider, open_id)
    );
    CREATE TABLE IF NOT EXISTS diagnostic_orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT,
      amount REAL NOT NULL, status TEXT DEFAULT 'pending',
      pay_method TEXT, expert_name TEXT, expert_phone TEXT,
      report_url TEXT, report_summary TEXT,
      paid_at TEXT, assigned_at TEXT, completed_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expert_services (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, deal_id TEXT,
      service_type TEXT NOT NULL, description TEXT,
      price REAL NOT NULL, platform_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      pay_method TEXT, expert_name TEXT, expert_phone TEXT,
      paid_at TEXT, completed_at TEXT, created_at TEXT NOT NULL
    );
  `);

  // Create indices for common query patterns (ignore errors for existing)
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_projects_industry ON projects(industry)',
    'CREATE INDEX IF NOT EXISTS idx_projects_province ON projects(province)',
    'CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(user_id, is_read)',
    'CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_deals_seller_buyer ON deals(seller_id, buyer_id)',
    'CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone, code)',
    'CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_membership_orders_user ON membership_orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_agreements_user ON user_agreements(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(type, is_active)',
  ];
  indices.forEach(sql => { try { db.run(sql); } catch(e) { /* ignore */ } });

  // Migrate existing databases — add columns if missing (ignore errors for existing)
  const migrations = [
    "ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN company_name TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN wechat_id TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN real_name TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN id_number TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN address TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN company_name TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN legal_person TEXT DEFAULT ''",
    "ALTER TABLE verifications ADD COLUMN biz_type TEXT DEFAULT ''",
    "ALTER TABLE bills ADD COLUMN related_type TEXT DEFAULT ''",
    "ALTER TABLE bills ADD COLUMN related_id TEXT DEFAULT ''",
  ];
  migrations.forEach(sql => { try { db.run(sql); } catch(e) { /* column already exists */ } });

  // Seed default agreements if none exist
  try {
    const stmt = db.prepare('SELECT COUNT(*) as c FROM agreements');
    let hasAgreements = false;
    if (stmt.step()) hasAgreements = stmt.getAsObject().c > 0;
    stmt.free();
    if (!hasAgreements) {
      const now = new Date().toISOString();
      const { v4: uuidv4 } = require('uuid');
      const privacyId = uuidv4(), termsId = uuidv4();
      db.run(`INSERT INTO agreements (id,type,version,title,content,is_active,published_at,created_at)
        VALUES (?,?,?,?,?,1,?,?)`,
        [privacyId, 'privacy', '1.0', '隐私政策',
         '<h2>隐私政策</h2><p>本隐私政策适用于xiaoweimm平台（以下简称"本平台"）提供的所有产品和服务。</p><h3>1. 信息收集</h3><p>我们收集您的手机号码、身份信息、企业信息等，仅用于提供并购撮合服务。</p><h3>2. 信息使用</h3><p>您的信息仅用于：实名认证、项目匹配、交易撮合、法律合规要求。</p><h3>3. 信息保护</h3><p>我们采用加密传输和存储技术保护您的数据安全。</p><h3>4. 信息共享</h3><p>未经您明确同意，我们不会向第三方共享您的个人信息，法律法规另有规定的除外。</p>',
         now, now]);
      db.run(`INSERT INTO agreements (id,type,version,title,content,is_active,published_at,created_at)
        VALUES (?,?,?,?,?,1,?,?)`,
        [termsId, 'terms', '1.0', '用户服务协议',
         '<h2>用户服务协议</h2><p>欢迎使用xiaoweimm中小企业并购平台。</p><h3>1. 服务说明</h3><p>本平台提供中小企业股权/资产转让的信息撮合服务，不直接参与交易。</p><h3>2. 用户义务</h3><p>您应保证所提供信息的真实性、准确性和合法性。</p><h3>3. 收费规则</h3><p>买家成交佣金为成交额的2%，卖家免费发布项目。</p><h3>4. 免责声明</h3><p>本平台不对交易结果承担任何保证责任，交易风险由双方自行承担。</p>',
         now, now]);
    }
  } catch(e) { /* ignore seed errors on first run */ }

  saveDb();
}

// Route-friendly wrappers
let saveTimer = null;
const SAVE_DEBOUNCE_MS = 500;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDb();
    saveTimer = null;
  }, SAVE_DEBOUNCE_MS);
}

function run(sql, params = []) {
  db.run(sql, params);
  scheduleSave();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

/**
 * Execute multiple run() calls inside a transaction.
 * All statements succeed or all are rolled back.
 * @param {Function} fn — receives ({ run, get }) helpers (transaction-aware)
 * @returns {any} whatever fn returns
 */
function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    const result = fn({ run, get });
    db.run('COMMIT');
    scheduleSave();
    return result;
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

module.exports = { getDb, saveDb, run, get, all, transaction };
