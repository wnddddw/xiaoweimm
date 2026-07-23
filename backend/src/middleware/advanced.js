const { get } = require('../db/init');

/**
 * 高级会员权限中间件。
 * 平台已转为免费审核制：basic（基础会员）只能浏览；
 * advanced（高级会员，管理员审核开通）解锁发布项目、查看联系方式、
 * 发起意向/交易、诊断与专家服务申请等全部功能。管理员不受限。
 */
function requireAdvanced(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  const u = get('SELECT member_level FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
  if (u.member_level !== 'advanced') {
    return res.status(403).json({ success: false, error: '需高级会员，请申请', need_advanced: true });
  }
  next();
}

module.exports = { requireAdvanced };
