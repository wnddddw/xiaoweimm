const express = require('express');
const { run, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/', auth, (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM messages WHERE user_id=?'; const params = [req.user.id];
  if (category && category !== 'all') { sql += ' AND category=?'; params.push(category); }
  sql += ' ORDER BY created_at DESC';
  res.json({ success: true, data: all(sql, params) });
});
router.get('/unread-count', auth, (req, res) => {
  const rows = all('SELECT category, COUNT(*) as count FROM messages WHERE user_id=? AND is_read=0 GROUP BY category', [req.user.id]);
  const counts = { project: 0, intent: 0, nda: 0, advisor: 0, system: 0 };
  rows.forEach(r => { counts[r.category] = r.count; });
  res.json({ success: true, data: counts });
});
router.put('/:id/read', auth, (req, res) => { run('UPDATE messages SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]); res.json({ success: true }); });
router.put('/read-all', auth, (req, res) => {
  const { category } = req.body;
  if (category && category !== 'all') run('UPDATE messages SET is_read=1 WHERE user_id=? AND category=?', [req.user.id, category]);
  else run('UPDATE messages SET is_read=1 WHERE user_id=?', [req.user.id]);
  res.json({ success: true });
});
router.delete('/:id', auth, (req, res) => { run('DELETE FROM messages WHERE id=? AND user_id=?', [req.params.id, req.user.id]); res.json({ success: true }); });
module.exports = router;
