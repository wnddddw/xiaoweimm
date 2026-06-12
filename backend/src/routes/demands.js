const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/my', auth, (req, res) => { res.json({ success: true, data: get('SELECT * FROM demands WHERE user_id=? ORDER BY updated_at DESC LIMIT 1', [req.user.id]) || null }); });
router.post('/', auth, (req, res) => {
  const b = req.body, now = new Date().toISOString(), existing = get('SELECT id FROM demands WHERE user_id=?', [req.user.id]);
  if (existing) {
    run('UPDATE demands SET industry=?,sub_industry=?,province=?,city=?,budget_min=?,budget_max=?,scale=?,purpose=?,priority=?,pay_method=?,note=?,updated_at=? WHERE id=?', [b.industry, b.sub_industry, b.province, b.city, b.budget_min || null, b.budget_max || null, b.scale, b.purpose, b.priority, b.pay_method, b.note, now, existing.id]);
    res.json({ success: true, data: { id: existing.id } });
  } else {
    const id = uuidv4();
    run('INSERT INTO demands (id,user_id,industry,sub_industry,province,city,budget_min,budget_max,scale,purpose,priority,pay_method,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, req.user.id, b.industry, b.sub_industry, b.province, b.city, b.budget_min || null, b.budget_max || null, b.scale, b.purpose, b.priority, b.pay_method, b.note, now, now]);
    res.json({ success: true, data: { id } });
  }
});
router.delete('/', auth, (req, res) => { run('DELETE FROM demands WHERE user_id=?', [req.user.id]); res.json({ success: true }); });
router.get('/favorites', auth, (req, res) => { res.json({ success: true, data: all('SELECT f.*,p.industry,p.sub_industry,p.province,p.city,p.revenue,p.price FROM favorites f JOIN projects p ON f.project_id=p.id WHERE f.user_id=? ORDER BY f.created_at DESC', [req.user.id]) }); });
router.post('/favorites/:projectId', auth, (req, res) => { try { run('INSERT INTO favorites (id,user_id,project_id,created_at) VALUES (?,?,?,?)', [uuidv4(), req.user.id, req.params.projectId, new Date().toISOString()]); res.json({ success: true }); } catch (e) { res.json({ success: false, error: 'Already favorited' }); } });
router.delete('/favorites/:projectId', auth, (req, res) => { run('DELETE FROM favorites WHERE user_id=? AND project_id=?', [req.user.id, req.params.projectId]); res.json({ success: true }); });
router.get('/applications', auth, (req, res) => { res.json({ success: true, data: all('SELECT a.*,p.industry,p.province,p.city FROM applications a JOIN projects p ON a.project_id=p.id WHERE a.user_id=? ORDER BY a.created_at DESC', [req.user.id]) }); });
router.post('/applications', auth, (req, res) => { const { project_id, note } = req.body; if (!project_id) return res.json({ success: false, error: 'Select project' }); run('INSERT INTO applications (id,user_id,project_id,note,created_at) VALUES (?,?,?,?,?)', [uuidv4(), req.user.id, project_id, note || '', new Date().toISOString()]); res.json({ success: true }); });
module.exports = router;
