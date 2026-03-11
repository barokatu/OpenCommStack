const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
      'application/pdf', 'application/zip',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak didukung'), false);
    }
  }
});

// Upload file
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.split('/')[0]; // image, video, audio, application

    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      mediaType,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengupload file' });
  }
});

module.exports = router;
