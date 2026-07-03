const multer = require('multer')
const path   = require('path')
const crypto = require('crypto')

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/3gpp',
  'audio/aac', 'audio/mp4', 'audio/amr', 'audio/mpeg', 'audio/ogg',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

function mimeToMediaType(mime) {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'document'
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/media'))
  },
  filename: (req, file, cb) => {
    const rand = crypto.randomBytes(12).toString('hex')
    const ext  = path.extname(file.originalname).toLowerCase()
    cb(null, `${rand}${ext}`)
  },
})

const mediaUpload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB — WhatsApp limit
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true)
    cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

module.exports = { mediaUpload, mimeToMediaType }
