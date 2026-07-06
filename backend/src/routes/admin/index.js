const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../../db/init');
const { auth } = require('../../middleware/auth');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(auth, adminAuth);
router.get('/dashboard', (req, res) => {
  const pc = all('SELECT COUNT(*) as count FROM projects')[0].count;
  const pp = all("SELECT COUNT(*) as count FROM projects WHERE status='pending'")[0].count;
  const pv = all("SELECT COUNT(*) as count FROM verifications WHERE status='pending'")[0].count;
  const uc = all("SELECT COUNT(*) as count FROM users WHERE role!='admin'")[0].count;
  res.json({ success: true, data: { projectCount: pc, pendingProjects: pp, pendingVerifications: pv, userCount: uc } });
});
router.get('/projects', (req, res) => {
  const { status, industry, page, pageSize } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1'; const p = [];
  if (status) { sql += ' AND status=?'; p.push(status); }
  if (industry) { sql += ' AND industry=?'; p.push(industry); }
  const countSql = sql.replace(/SELECT\s.+\sFROM/, 'SELECT COUNT(*) as total FROM');
  const total = all(countSql, p)[0]?.total || 0;
  sql += ' ORDER BY created_at DESC';
  const pg = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
  sql += ' LIMIT ? OFFSET ?';
  p.push(ps, (pg - 1) * ps);
  res.json({ success: true, data: all(sql, p), pagination: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
});
router.patch('/projects/:id/approve', (req, res) => {
  const now = new Date().toISOString();
  run("UPDATE projects SET status='online',review_time=?,updated_at=? WHERE id=?", [now, now, req.params.id]);
  const pr = get('SELECT user_id FROM projects WHERE id=?', [req.params.id]);
  if (pr) run('INSERT INTO messages (id,user_id,category,subject,body,created_at) VALUES (?,?,?,?,?,?)', [uuidv4(), pr.user_id, 'project', '审核通过', '项目已通过审核', now]);
  res.json({ success: true });
});
router.patch('/projects/:id/reject', (req, res) => {
  run("UPDATE projects SET status='rejected',review_time=?,updated_at=? WHERE id=?", [new Date().toISOString(), new Date().toISOString(), req.params.id]);
  res.json({ success: true });
});
router.get('/verifications', (req, res) => {
  const { page, pageSize } = req.query;
  const baseSql = 'SELECT v.id,v.type,v.real_name,v.company_name,v.id_card_url,v.license_url,' +
    'v.status,v.reject_reason,v.submit_time,v.review_time,' +
    'u.phone,u.name as user_name FROM verifications v ' +
    'JOIN users u ON v.user_id=u.id';
  const total = all('SELECT COUNT(*) as total FROM verifications')[0]?.total || 0;
  const pg = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
  const sql = baseSql + ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  res.json({ success: true, data: all(sql, [ps, (pg - 1) * ps]), pagination: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
});
router.patch('/verifications/:id/approve', (req, res) => {
  const now = new Date().toISOString();
  run('UPDATE verifications SET status=?,review_time=?,reviewer_id=? WHERE id=?',
    ['approved', now, req.user.id, req.params.id]);
  const v = get('SELECT user_id,type,real_name,company_name FROM verifications WHERE id=?',
    [req.params.id]);
  if (v) {
    run('UPDATE users SET verify_status=?,updated_at=? WHERE id=?',
      ['approved', now, v.user_id]);
    const subject = v.type === 'personal'
      ? `实名认证已通过：${v.real_name || ''}`.trim()
      : `企业认证已通过：${v.company_name || ''}`.trim();
    run(
      'INSERT INTO messages (id,user_id,category,subject,body,created_at) VALUES (?,?,?,?,?,?)',
      [uuidv4(), v.user_id, 'system', subject,
       `恭喜，您的${v.type === 'personal' ? '实名认证' : '企业认证'}已通过审核，您现在可以使用平台的全部功能。`, now]
    );
  }
  res.json({ success: true });
});
router.patch('/verifications/:id/reject', (req, res) => {
  const { reason } = req.body, now = new Date().toISOString();
  run('UPDATE verifications SET status=?,reject_reason=?,review_time=?,reviewer_id=? WHERE id=?',
    ['rejected', reason || '', now, req.user.id, req.params.id]);
  if (reason) {
    const v = get('SELECT user_id,real_name,company_name FROM verifications WHERE id=?',
      [req.params.id]);
    if (v) {
      run(
        'INSERT INTO messages (id,user_id,category,subject,body,created_at) VALUES (?,?,?,?,?,?)',
        [uuidv4(), v.user_id, 'system', '认证申请已驳回',
         `您的认证申请未通过审核。\n驳回原因：${reason}\n请根据提示修改后重新提交。`, now]
      );
    }
  }
  res.json({ success: true });
});
router.get('/users', (req, res) => {
  let sql = "SELECT id,phone,name,role,member_level,verify_status,status,created_at FROM users WHERE role!='admin'"; const p = [];
  if (req.query.role) { sql += ' AND role=?'; p.push(req.query.role); }
  if (req.query.status) { sql += ' AND status=?'; p.push(req.query.status); }
  const countSql = sql.replace(/SELECT\s.+\sFROM/, 'SELECT COUNT(*) as total FROM');
  const total = all(countSql, p)[0]?.total || 0;
  sql += ' ORDER BY created_at DESC';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  sql += ' LIMIT ? OFFSET ?';
  p.push(pageSize, (page - 1) * pageSize);
  res.json({ success: true, data: all(sql, p), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});
router.patch('/users/:id/status', (req, res) => { run('UPDATE users SET status=?,updated_at=? WHERE id=?', [req.body.status, new Date().toISOString(), req.params.id]); res.json({ success: true }); });
router.get('/config', (req, res) => {
  const rows = all('SELECT key,value FROM config'), cfg = {};
  rows.forEach(r => { try { cfg[r.key] = JSON.parse(r.value); } catch (e) { cfg[r.key] = r.value; } });
  res.json({ success: true, data: cfg });
});
router.put('/config', (req, res) => {
  Object.keys(req.body).forEach(k => {
    const v = JSON.stringify(req.body[k]);
    if (get('SELECT key FROM config WHERE key=?', [k])) run('UPDATE config SET value=? WHERE key=?', [v, k]);
    else run('INSERT INTO config (key,value) VALUES (?,?)', [k, v]);
  });
  res.json({ success: true });
});
router.get('/analytics', (req, res) => {
  res.json({ success: true, data: {
    monthlyProjects: all("SELECT substr(created_at,1,7) as month,COUNT(*) as count FROM projects GROUP BY month ORDER BY month"),
    industryDist: all('SELECT industry,COUNT(*) as count FROM projects GROUP BY industry ORDER BY count DESC')
  }});
});
module.exports = router;
