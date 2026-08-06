// One-time correction: campaign stats.delivered/read were inflated by duplicate Meta status
// webhooks double-incrementing counters, and stats.failed never counted async failures at all
// (fixed in webhook.routes.js handleStatus). Recomputes every campaign's delivered/read/failed
// from the actual Message records, which are the real source of truth.
require('dotenv').config()
const mongoose = require('mongoose')
const Campaign = require('../src/models/Campaign')
const Message = require('../src/models/Message')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  const campaigns = await Campaign.find({}).lean()
  let updated = 0

  for (const c of campaigns) {
    const msgs = await Message.find({ campaign: c._id }).select('status').lean()
    if (!msgs.length) continue

    const delivered = msgs.filter(m => m.status === 'delivered' || m.status === 'read').length
    const read = msgs.filter(m => m.status === 'read').length
    const failed = msgs.filter(m => m.status === 'failed').length

    const before = c.stats || {}
    if (before.delivered === delivered && before.read === read && before.failed === failed) continue

    await Campaign.updateOne(
      { _id: c._id },
      { $set: { 'stats.delivered': delivered, 'stats.read': read, 'stats.failed': failed } }
    )
    console.log(
      `${c.name} (${c._id}): delivered ${before.delivered}->${delivered}, read ${before.read}->${read}, failed ${before.failed}->${failed}`
    )
    updated++
  }

  console.log(`\nUpdated ${updated} of ${campaigns.length} campaign(s)`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
