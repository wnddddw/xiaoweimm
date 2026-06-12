const express = require('express');
const { get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/recommendations', auth, (req, res) => {
  const demand = get('SELECT * FROM demands WHERE user_id=? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
  let projects = all("SELECT * FROM projects WHERE status='online' ORDER BY is_top DESC, submit_time DESC");
  projects = projects.map(p => {
    let score = 0, reasons = [];
    if (demand) {
      if (demand.industry && p.industry === demand.industry) { score += 40; reasons.push('Industry match'); }
      else if (demand.industry) { score += 15; }
      if (demand.province && p.province === demand.province) { score += 20; reasons.push('Region match'); }
      if (demand.budget_max && p.price && p.price <= demand.budget_max && p.price >= (demand.budget_min || 0)) { score += 30; reasons.push('Budget match'); }
    }
    return { ...p, match_score: Math.min(score, 100), match_reasons: reasons };
  });
  projects.sort((a, b) => b.match_score - a.match_score);
  res.json({ success: true, data: projects.slice(0, 20) });
});
module.exports = router;
