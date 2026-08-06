// Run once to create (or reset) the platform super_admin account:
//   node scripts/createAdmin.js
// Reads credentials from .env — set ADMIN_EMAIL, ADMIN_PASSWORD (and optionally ADMIN_NAME)
// before running. Never hardcode real credentials in this file — it's committed to git.

require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../src/models/User')

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_NAME     = process.env.ADMIN_NAME || 'Platform Admin'

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const existing = await User.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    existing.role = 'super_admin'
    existing.isOnboarded = true
    existing.password = ADMIN_PASSWORD  // plaintext — pre-save hook hashes it once
    await existing.save()
    console.log(`Updated existing user ${ADMIN_EMAIL} → super_admin (password reset)`)
  } else {
    await User.create({
      name:        ADMIN_NAME,
      email:       ADMIN_EMAIL,
      password:    ADMIN_PASSWORD,  // plaintext — pre-save hook hashes it once
      role:        'super_admin',
      isOnboarded: true,
    })
    console.log(`Created super_admin: ${ADMIN_EMAIL}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => { console.error(err); process.exit(1) })
