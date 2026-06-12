const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /agreements/current?type=privacy|terms — latest active agreement
router.get('/current', (req, res) => {
  const { type } = req.query;
  if (!type || !['privacy', 'terms'].includes(type)) {
    return res.json({ success: false, error: '类型参数无效，请使用 privacy 或 terms' });
  }
  const agreement = get(
    'SELECT id, type, version, title, content, published_at FROM agreements WHERE type=? AND is_active=1 ORDER BY published_at DESC LIMIT 1',
    [type]
  );
  if (!agreement) return res.json({ success: false, error: '未找到相关协议' });
  res.json({ success: true, data: agreement });
});

// POST /agreements/agree — record user consent
router.post('/agree', auth, (req, res) => {
  const { agreement_id } = req.body;
  if (!agreement_id) return res.json({ success: false, error: '缺少协议ID' });

  const agreement = get('SELECT id, is_active FROM agreements WHERE id=?', [agreement_id]);
  if (!agreement) return res.json({ success: false, error: '协议不存在' });
  if (!agreement.is_active) return res.json({ success: false, error: '协议已失效' });

  const now = new Date().toISOString();
  try {
    run(
      'INSERT OR REPLACE INTO user_agreements (id, user_id, agreement_id, agreed_at) VALUES (?,?,?,?)',
      [uuidv4(), req.user.id, agreement_id, now]
    );
    res.json({ success: true, message: '已同意' });
  } catch (e) {
    res.json({ success: false, error: '操作失败，请重试' });
  }
});

// GET /agreements/status — check if user needs to re-agree
router.get('/status', auth, (req, res) => {
  const types = ['privacy', 'terms'];
  const result = {};

  for (const type of types) {
    const latest = get(
      'SELECT id, version FROM agreements WHERE type=? AND is_active=1 ORDER BY published_at DESC LIMIT 1',
      [type]
    );
    if (!latest) { result[type] = { needed: false }; continue; }

    const consented = get(
      'SELECT id FROM user_agreements WHERE user_id=? AND agreement_id=?',
      [req.user.id, latest.id]
    );
    result[type] = {
      needed: !consented,
      agreement_id: latest.id,
      version: latest.version,
    };
  }

  res.json({ success: true, data: result });
});

module.exports = router;
