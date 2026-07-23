const express = require('express');
const path = require('path');
const { auth } = require('../middleware/auth');
const { get } = require('../db/init');
const upload = require('../middleware/upload');
const config = require('../config');
const router = express.Router();

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请选择文件' });
  const url = '/uploads/' + req.file.filename;
  res.json({ success: true, data: { url, filename: req.file.originalname } });
});

// Serve uploaded files — require auth for sensitive documents.
// 身份证照片/营业执照等认证材料仅本人或管理员可访问。
function sensitiveFileGuard(req, res, next) {
  const filename = path.basename(req.path || '');
  if (!filename) return next();
  // 仅认证材料（verifications 表引用的文件）做归属限制，其余上传文件登录即可读
  const v = get(
    'SELECT user_id FROM verifications WHERE id_card_url=? OR license_url=? LIMIT 1',
    ['/uploads/' + filename, '/uploads/' + filename]
  );
  if (v && req.user.role !== 'admin' && req.user.id !== v.user_id) {
    return res.status(403).json({ success: false, error: '无权访问该文件' });
  }
  next();
}

router.use('/', auth, sensitiveFileGuard, express.static(path.resolve(config.uploadDir)));

module.exports = router;
