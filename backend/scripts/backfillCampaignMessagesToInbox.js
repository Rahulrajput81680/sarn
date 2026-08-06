// One-time backfill: campaign messages sent before the Inbox-linking fix were created with
// conversation: null, so they never appeared in the Inbox — only in campaign stats. This finds
// each orphaned campaign message's contact, links it to that contact's open conversation
// (creating one if needed), then recomputes each touched conversation's lastMessage/updatedAt
// from its true latest message so we don't clobber anything more recent with old backfilled data.
require('dotenv').config()
const mongoose = require('mongoose')
const Message = require('../src/models/Message')
const Conversation = require('../src/models/Conversation')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  const orphans = await Message.find({ campaign: { $ne: null }, conversation: null })
    .sort({ timestamp: 1 })
    .lean()
  console.log(`Found ${orphans.length} orphaned campaign message(s)`)

  const touchedConvIds = new Set()

  for (const msg of orphans) {
    if (!msg.contact) continue

    let conv = await Conversation.findOne({ tenant: msg.tenant, contact: msg.contact, status: 'open' })
    if (!conv) {
      conv = await Conversation.create({
        tenant:  msg.tenant,
        contact: msg.contact,
        status:  'open',
        window:  { open: false, expiresAt: null },
      })
    }

    await Message.updateOne({ _id: msg._id }, { $set: { conversation: conv._id } })
    touchedConvIds.add(conv._id.toString())
  }

  console.log(`Linked messages into ${touchedConvIds.size} conversation(s), recomputing lastMessage...`)

  for (const convId of touchedConvIds) {
    const latest = await Message.findOne({ conversation: convId }).sort({ timestamp: -1 }).lean()
    if (!latest) continue
    await Conversation.updateOne(
      { _id: convId },
      { $set: { lastMessage: { text: latest.text, type: latest.type, time: latest.timestamp }, updatedAt: latest.timestamp } }
    )
  }

  console.log('Done.')
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
