const multer = require('multer')

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

const mediaUpload = multer({
  // In-memory — the buffer is uploaded straight to ImageKit (see imagekit.js), never written to
  // local disk. Render's disk is ephemeral (wiped on every redeploy), so disk storage here would
  // silently break media Meta hadn't fetched yet by the time of the next deploy.
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB — WhatsApp limit
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true)
    cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

module.exports = { mediaUpload, mimeToMediaType }
