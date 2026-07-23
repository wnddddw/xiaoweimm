const express = require('express');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

// ── 会员模型（免费审核制）────────────────────────────────────────────
// basic    基础会员（注册默认）：只能浏览项目/案例/内容
// advanced 高级会员：免费，提交申请后由管理员审核开通，解锁全部功能

const tierBenefits = {
  basic: [
    { title: '浏览公开项目', description: '查看平台上所有公开的转让项目', icon: 'eye' },
    { title: '浏览成功案例与专栏', description: '查看成交案例与行业内容', icon: 'book' },
  ],
  advanced: [
    { title: '查看联系方式', description: '查看项目方联系方式，直接沟通', icon: 'chat' },
    { title: '发布项目', description: '免费发布企业转让项目', icon: 'upload' },
    { title: '发起意向与交易', description: '提交收购申请、创建并推进交易', icon: 'deal' },
    { title: '成交顾问与专家服务', description: '免费申请估值诊断与法律/会计/税务专家服务', icon: 'user-tie' },
  ],
};

// GET /benefits — membership tier benefits (public)
router.get('/benefits', (req, res) => {
  res.json({ success: true, data: tierBenefits });
});

// ── Membership Info ──────────────────────────────────────────────────

router.get('/', auth, (req, res) => {
  const u = get('SELECT member_level, advanced_status, advanced_reason, advanced_contact, advanced_id_note, advanced_review_note, advanced_apply_time, advanced_review_time FROM users WHERE id=?', [req.user.id]);
  res.json({ success: true, data: u });
});

// ── Apply for Advanced Membership ────────────────────────────────────

// POST /apply-advanced — 提交高级会员申请（免费，管理员审核）
router.post('/apply-advanced', auth, (req, res) => {
  const { reason, contact, id_note } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ success: false, error: '请填写申请理由' });
  if (!contact || !contact.trim()) return res.status(400).json({ success: false, error: '请填写联系方式' });
  if (!id_note || !id_note.trim()) return res.status(400).json({ success: false, error: '请填写身份说明' });

  const u = get('SELECT member_level, advanced_status FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
  if (u.member_level === 'advanced') return res.status(409).json({ success: false, error: '您已是高级会员' });
  if (u.advanced_status === 'pending') return res.status(409).json({ success: false, error: '您已有待审核的申请，请耐心等待' });

  const now = new Date().toISOString();
  run(
    'UPDATE users SET advanced_status=?, advanced_reason=?, advanced_contact=?, advanced_id_note=?, advanced_review_note=?, advanced_apply_time=?, advanced_review_time=NULL, updated_at=? WHERE id=?',
    ['pending', reason.trim(), contact.trim(), id_note.trim(), '', now, now, req.user.id]
  );
  res.json({ success: true, data: { status: 'pending', apply_time: now }, message: '申请已提交，请等待管理员审核' });
});

// GET /apply-advanced/status — 查询自己的申请状态
router.get('/apply-advanced/status', auth, (req, res) => {
  const u = get('SELECT member_level, advanced_status, advanced_review_note, advanced_apply_time, advanced_review_time FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
  res.json({ success: true, data: u });
});

// ── 已下线的付费功能（平台已转为免费审核制）──────────────────────────

const gone = (req, res) => res.status(410).json({ success: false, error: '平台已转为免费审核制，付费会员功能已下线，请申请高级会员' });
router.post('/upgrade', auth, gone);
router.put('/auto-renew', auth, gone);
router.post('/cancel', auth, gone);

// GET /subscription — 兼容旧客户端：返回新会员模型
router.get('/subscription', auth, (req, res) => {
  const u = get('SELECT member_level, advanced_status FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
  res.json({ success: true, data: { level: u.member_level, advanced_status: u.advanced_status, free: true, renew_amount: 0 } });
});

// GET /orders — 历史订单（旧付费数据只读保留）
router.get('/orders', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM membership_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });
});

module.exports = router;
