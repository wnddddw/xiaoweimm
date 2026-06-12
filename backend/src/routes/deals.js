const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/', auth, (req, res) => {
  const deals = req.user.role === 'admin' ? all('SELECT * FROM deals ORDER BY created_at DESC') : all('SELECT * FROM deals WHERE seller_id=? OR buyer_id=? ORDER BY created_at DESC', [req.user.id, req.user.id]);
  res.json({ success: true, data: deals });
});
router.post('/', auth, (req, res) => {
  const { project_id, seller_name, buyer_name, price, advisor, note } = req.body;
  if (!project_id || !seller_name || !buyer_name || !price) return res.json({ success: false, error: 'Fill all fields' });
  const id = 'D' + Date.now().toString(36) + require('crypto').randomBytes(3).toString('hex'), now = new Date().toISOString(), st = JSON.stringify({ matching: now });
  run('INSERT INTO deals (id,project_id,seller_name,buyer_name,price,advisor,note,stage,stage_time,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [id, project_id, seller_name, buyer_name, price, advisor || 'Auto', note || '', 'matching', st, now, now]);
  run('INSERT INTO deal_events (id,deal_id,stage,action,detail,created_at) VALUES (?,?,?,?,?,?)', [uuidv4(), id, 'matching', 'Deal Created', seller_name + ' <-> ' + buyer_name + ', price ' + price, now]);
  res.json({ success: true, data: get('SELECT * FROM deals WHERE id=?', [id]) });
});
router.get('/:id', auth, (req, res) => { const d = get('SELECT * FROM deals WHERE id=?', [req.params.id]); if (!d) return res.json({ success: false, error: 'Not found' }); res.json({ success: true, data: d }); });
router.patch('/:id/stage', auth, (req, res) => {
  const d = get('SELECT * FROM deals WHERE id=?', [req.params.id]); if (!d) return res.json({ success: false, error: 'Not found' });
  const stage = req.body.stage, now = new Date().toISOString();
  let st = {};
  try { st = JSON.parse(d.stage_time || '{}'); } catch (e) { st = {}; }
  st[stage] = now;
  run('UPDATE deals SET stage=?,stage_time=?,updated_at=? WHERE id=?', [stage, JSON.stringify(st), now, req.params.id]);
  const labels = { matching: 'Matching', nda: 'NDA', due_diligence: 'Due Diligence', contract: 'Contract', payment: 'Payment', handover: 'Handover', complete: 'Complete' };
  run('INSERT INTO deal_events (id,deal_id,stage,action,detail,created_at) VALUES (?,?,?,?,?,?)', [uuidv4(), req.params.id, stage, 'Stage: ' + (labels[stage] || stage), 'Advanced to ' + (labels[stage] || stage), now]);
  res.json({ success: true });
});
router.get('/:id/timeline', auth, (req, res) => { res.json({ success: true, data: all('SELECT * FROM deal_events WHERE deal_id=? ORDER BY created_at DESC', [req.params.id]) }); });
module.exports = router;
