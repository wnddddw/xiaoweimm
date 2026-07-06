const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db/init');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// ── Shared submit logic — DRY: used by both /submit and /resubmit ──
function handleSubmit(req) {
  const { type } = req.body;
  if (!['personal', 'company'].includes(type)) {
    return { success: false, error: '认证类型必须是 personal 或 company', status: 400 };
  }

  const now = new Date().toISOString();
  const id = uuidv4();

  if (type === 'personal') {
    const { real_name, id_number, address } = req.body;
    if (!real_name || !id_number) {
      return { success: false, error: '个人认证需填写姓名和身份证号', status: 400 };
    }
    const idCardUrl = req.files && req.files.id_card ? '/uploads/' + req.files.id_card[0].filename : '';
    run(
      'INSERT INTO verifications (id,user_id,type,real_name,id_number,address,' +
      'status,id_card_url,submit_time,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, req.user.id, 'personal', real_name, id_number, address || '',
       'pending', idCardUrl, now, now]
    );
  } else {
    const { company_name, legal_person, biz_type, address } = req.body;
    if (!company_name || !legal_person) {
      return { success: false, error: '法人认证需填写公司名称和法定代表人', status: 400 };
    }
    const licenseUrl = req.files && req.files.license ? '/uploads/' + req.files.license[0].filename : '';
    run(
      'INSERT INTO verifications (id,user_id,type,company_name,legal_person,biz_type,' +
      'address,status,license_url,submit_time,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, req.user.id, 'company', company_name, legal_person, biz_type || '',
       address || '', 'pending', licenseUrl, now, now]
    );
  }

  run('UPDATE users SET verify_status=?,updated_at=? WHERE id=?', ['pending', now, req.user.id]);

  return { success: true, data: { id, type, status: 'pending', submit_time: now } };
}

// ── Status ───────────────────────────────────────────────────────────

// GET /status — current user's latest verification
router.get('/status', auth, (req, res) => {
  const v = get(
    'SELECT id, type, real_name, id_number, address, company_name, legal_person, ' +
    'biz_type, status, reject_reason, id_card_url, license_url, ' +
    'submit_time, review_time FROM verifications ' +
    'WHERE user_id=? ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  if (!v) return res.json({ success: true, data: { status: 'none' } });
  res.json({ success: true, data: v });
});

// ── Submit ───────────────────────────────────────────────────────────

// POST /submit — submit personal or company verification with file uploads
router.post('/submit', auth, (req, res) => {
  upload.fields([
    { name: 'id_card', maxCount: 1 },
    { name: 'license', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });

    // Prevent duplicate pending
    const exist = get(
      'SELECT id FROM verifications WHERE user_id=? AND status=? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, 'pending']
    );
    if (exist) return res.status(409).json({ success: false, error: '您已有待审核的认证，请等待结果' });

    const result = handleSubmit(req);
    if (!result.success && result.status) {
      return res.status(result.status).json({ success: false, error: result.error });
    }
    res.json(result);
  });
});

// ── Resubmit ─────────────────────────────────────────────────────────

// POST /resubmit — resubmit after rejection
router.post('/resubmit', auth, (req, res) => {
  upload.fields([
    { name: 'id_card', maxCount: 1 },
    { name: 'license', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });

    // Need a previous rejected submission
    const last = get(
      'SELECT id FROM verifications WHERE user_id=? AND status=? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, 'rejected']
    );
    if (!last) return res.status(404).json({ success: false, error: '没有可重新提交的被驳回认证' });

    const result = handleSubmit(req);
    if (!result.success && result.status) {
      return res.status(result.status).json({ success: false, error: result.error });
    }
    res.json(result);
  });
});

module.exports = router;
