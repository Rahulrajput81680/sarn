const crypto = require('crypto')

// AES-256-CBC — used to encrypt WhatsApp access tokens at rest.
// Key source priority: ENCRYPTION_KEY env (32-byte hex) → SHA-256 of JWT_SECRET
function getKey() {
  if (process.env.ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    return key
  }
  return crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback-change-me').digest()
}

function encrypt(plaintext) {
  const key = getKey()
  const iv  = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(ciphertext) {
  const key = getKey()
  const [ivHex, encHex] = String(ciphertext).split(':')
  if (!ivHex || !encHex) throw new Error('Invalid encrypted value format')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
}

module.exports = { encrypt, decrypt }
