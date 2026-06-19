const express = require('express');
const path = require('path');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const config = require('../config');
const router = express.Router();

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ success: false, error: '请选择文件' });
  const url = '/uploads/' + req.file.filename;
  res.json({ success: true, data: { url, filename: req.file.originalname } });
});

// Serve uploaded files — require auth for sensitive documents
router.use('/', auth, express.static(path.resolve(config.uploadDir)));

module.exports = router;
