const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

// ── Avatar upload ──────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'avatars')
    ensureDir(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${req.user.id}_${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})

const avatarFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false)
  }
}

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
})

// ── CSV contact import ─────────────────────────────────────────────
const csvStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'csv')
    ensureDir(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(null, `contacts_${req.user.id}_${Date.now()}.csv`)
  },
})

const csvFilter = (req, file, cb) => {
  if (['text/csv', 'application/vnd.ms-excel', 'text/plain'].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only CSV files are allowed'), false)
  }
}

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

module.exports = { uploadAvatar, uploadCSV }
