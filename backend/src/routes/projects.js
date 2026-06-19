const express = require('express');
const { run, get, all } = require('../db/init');
const { auth, optionalAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  let sql = 'SELECT * FROM projects WHERE status = ?'; const params = ['online'];
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  const { industry, province, budget, sort } = req.query;
  if (industry) { sql += ' AND industry = ?'; params.push(industry); }
  if (province) { sql += ' AND province = ?'; params.push(province); }
  if (budget === '0-300') sql += ' AND price <= 300';
  else if (budget === '300-1000') sql += ' AND price > 300 AND price <= 1000';
  else if (budget === '1000-3000') sql += ' AND price > 1000 AND price <= 3000';
  else if (budget === '3000+') sql += ' AND price > 3000';
  if (sort === 'price_asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY price DESC';
  else sql += ' ORDER BY is_top DESC, submit_time DESC';
  const countSql = sql.replace(/SELECT\s.+\sFROM/, 'SELECT COUNT(*) as total FROM').replace(/\sORDER\s+BY.+/, '');
  const total = all(countSql, params)[0]?.total || 0;
  sql += ' LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);
  res.json({ success: true, data: all(sql, params), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

router.get('/my', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM projects WHERE user_id = ? ORDER BY is_top DESC, created_at DESC', [req.user.id]) });
});

router.post('/', auth, (req, res) => {
  const b = req.body;
  if (!b.industry || !b.sub_industry || !b.province || !b.city) return res.json({ success: false, error: 'Fill industry and region' });
  const id = 'P' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + require('crypto').randomBytes(3).toString('hex');
  const now = new Date().toISOString();
  run('INSERT INTO projects (id,user_id,industry,sub_industry,province,city,revenue,employees,transfer_reason,profit_rate,price,description,equipment,raw_material,inventory,hide_company,hide_address,hide_customers,hide_partners,hide_financial,status,submit_time,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, req.user.id, b.industry, b.sub_industry, b.province, b.city, b.revenue || 0, b.employees || '', b.transfer_reason || '', b.profit_rate || 0, b.price || 0, b.description || '', JSON.stringify(b.equipment || []), JSON.stringify(b.raw_material || []), JSON.stringify(b.inventory || []), b.hide_company ? 1 : 0, b.hide_address ? 1 : 0, b.hide_customers ? 1 : 0, b.hide_partners ? 1 : 0, b.hide_financial ? 1 : 0, 'pending', now, now, now]);
  res.json({ success: true, data: get('SELECT * FROM projects WHERE id = ?', [id]) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const p = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!p) return res.json({ success: false, error: 'Not found' });
  p.views = (p.views || 0) + 1;
  run('UPDATE projects SET views = views + 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: p });
});

router.put('/:id', auth, (req, res) => {
  const p = get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!p) return res.json({ success: false, error: 'Not found' });
  const b = req.body, now = new Date().toISOString();
  let pEquip = []; try { pEquip = JSON.parse(p.equipment || '[]'); } catch(e) {}
  let pRaw = []; try { pRaw = JSON.parse(p.raw_material || '[]'); } catch(e) {}
  let pInv = []; try { pInv = JSON.parse(p.inventory || '[]'); } catch(e) {}
  run('UPDATE projects SET industry=?,sub_industry=?,province=?,city=?,revenue=?,employees=?,transfer_reason=?,profit_rate=?,price=?,description=?,equipment=?,raw_material=?,inventory=?,updated_at=? WHERE id=?', [b.industry || p.industry, b.sub_industry || p.sub_industry, b.province || p.province, b.city || p.city, b.revenue ?? p.revenue, b.employees || p.employees, b.transfer_reason || p.transfer_reason, b.profit_rate ?? p.profit_rate, b.price ?? p.price, b.description || p.description, JSON.stringify(b.equipment || pEquip), JSON.stringify(b.raw_material || pRaw), JSON.stringify(b.inventory || pInv), now, req.params.id]);
  res.json({ success: true, data: get('SELECT * FROM projects WHERE id = ?', [req.params.id]) });
});

router.patch('/:id/status', auth, (req, res) => {
  const p = get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!p) return res.json({ success: false, error: 'Not found' });
  const { status } = req.body;
  if (!['online', 'offline'].includes(status)) return res.json({ success: false, error: 'Invalid status' });
  run('UPDATE projects SET status=?,updated_at=? WHERE id=?', [status, new Date().toISOString(), req.params.id]);
  res.json({ success: true });
});

router.post('/:id/refresh', auth, (req, res) => { run('UPDATE projects SET refresh_time=?,updated_at=? WHERE id=? AND user_id=?', [new Date().toISOString(), new Date().toISOString(), req.params.id, req.user.id]); res.json({ success: true }); });
router.post('/:id/top', auth, (req, res) => { run('UPDATE projects SET is_top=1,updated_at=? WHERE id=? AND user_id=?', [new Date().toISOString(), req.params.id, req.user.id]); res.json({ success: true }); });

module.exports = router;
