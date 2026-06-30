// Run once to create the platform super_admin account:
//   node scripts/createAdmin.js
// Change email/password before running.

require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../src/models/User')

const ADMIN_EMAIL    = 'admin@sarnconnect.com'
const ADMIN_PASSWORD = 'Sarnconnect@00'
const ADMIN_NAME     = 'Platform Admin'

async function run() {
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
