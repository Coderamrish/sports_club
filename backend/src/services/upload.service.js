/**
 * Upload Service
 * ─────────────────────────────────────────────────────────
 * Currently uses LOCAL disk storage (multer default).
 * Switch to S3 in production by setting AWS_* env vars
 * and uncommenting the S3 section below.
 */
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/appError');

// ─── Ensure uploads directory exists ──────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Allowed types ─────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOC_TYPES   = ['application/pdf'];
const ALL_ALLOWED         = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

// ─── Size limits ───────────────────────────────────────────────────────────
const IMAGE_MAX_SIZE = 1 * 1024 * 1024;  // 1 MB
const PDF_MAX_SIZE   = 2 * 1024 * 1024;  // 2 MB

// ─── Local disk storage ────────────────────────────────────────────────────
const diskStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const userId   = req.user?._id || 'anonymous';
    const filename = `${userId}-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// ─── Create uploader ───────────────────────────────────────────────────────
const createUploader = (folder, allowedTypes = ALL_ALLOWED, maxSize = PDF_MAX_SIZE) => {
  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`, 400
      ), false);
    }
  };

  return multer({
    storage: diskStorage(folder),
    fileFilter,
    limits: { fileSize: maxSize },
  });
};

// ─── Pre-configured uploaders ──────────────────────────────────────────────
const athleteDocUpload  = createUploader('athletes/documents', ALL_ALLOWED,         PDF_MAX_SIZE);
const profilePhotoUpload= createUploader('profile-photos',     ALLOWED_IMAGE_TYPES, IMAGE_MAX_SIZE);
const coachDocUpload    = createUploader('coaches/documents',  ALL_ALLOWED,         PDF_MAX_SIZE);

// ─── Delete local file ─────────────────────────────────────────────────────
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    console.error('File delete error:', err);
    return false;
  }
};

// ─── Get public URL for local file ────────────────────────────────────────
const getFileUrl = (key) => {
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${key}`;
};

// ─── Multer error handler middleware ──────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Images: max 1MB, PDFs: max 2MB.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

module.exports = {
  athleteDocUpload,
  profilePhotoUpload,
  coachDocUpload,
  deleteFile,
  getFileUrl,
  handleMulterError,
};