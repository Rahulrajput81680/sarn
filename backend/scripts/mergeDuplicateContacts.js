// One-time cleanup for contacts that got duplicated by the phone-format mismatch bug:
// manually-added contacts were stored as "+91..." while inbound webhook messages matched
// on bare "91..." digits, so each real person ended up as two Contact + Conversation docs.
// Run with --dry-run first to preview, then without it to apply.
require('dotenv').config()
const mongoose = require('mongoose')
const Contact = require('../src/models/Contact')
const Conversation = require('../src/models/Conversation')
const Message = require('../src/models/Message')
const Tenant = require('../src/models/Tenant')
const { normalizePhone } = require('../src/utils/phone')

const DRY_RUN = process.argv.includes('--dry-run')

function digitsOnly(phone) {
  return String(phone).replace(/\D/g, '')
}

async function mergeGroup(tenantId, contacts) {
  // Prefer a contact with a real human name (name !== its own phone digits) as the keeper.
  // Tie-break: earliest created.
  const withName = contacts.filter(c => digitsOnly(c.name) !== digitsOnly(c.phone) || c.name.trim() === '')
  const pool = withName.length ? withName : contacts
  const keeper = pool.slice().sort((a, b) => a.createdAt - b.createdAt)[0]
  const losers = contacts.filter(c => String(c._id) !== String(keeper._id))

  const normalized = normalizePhone(keeper.phone) || keeper.phone
  console.log(`  KEEP  ${keeper.name} (${keeper.phone} -> ${normalized})  [${keeper._id}]`)
  losers.forEach(l => console.log(`  MERGE ${l.name} (${l.phone})  [${l._id}]`))

  if (DRY_RUN) return

  if (keeper.phone !== normalized) {
    await Contact.updateOne({ _id: keeper._id }, { $set: { phone: normalized } })
  }

  const keeperConvos = await Conversation.find({ tenant: tenantId, contact: keeper._id })
  let targetConv = keeperConvos.find(c => c.status === 'open') || keeperConvos[0] || null

  const windows = []
  let unreadCount = 0

  for (const conv of keeperConvos) {
    windows.push(conv.window)
    unreadCount += conv.unreadCount || 0
  }

  for (const loser of losers) {
    const loserConvos = await Conversation.find({ tenant: tenantId, contact: loser._id })

    for (const conv of loserConvos) {
      windows.push(conv.window)
      unreadCount += conv.unreadCount || 0

      if (!targetConv) {
        targetConv = conv
        continue
      }
      if (String(conv._id) === String(targetConv._id)) continue

      await Message.updateMany({ conversation: conv._id }, { $set: { conversation: targetConv._id } })
      await Conversation.deleteOne({ _id: conv._id })
    }

    // Catch any messages referencing the loser contact directly (e.g. campaign sends)
    await Message.updateMany({ tenant: tenantId, contact: loser._id }, { $set: { contact: keeper._id } })
    await Contact.deleteOne({ _id: loser._id })
  }

  if (targetConv) {
    await Message.updateMany({ conversation: targetConv._id }, { $set: { contact: keeper._id } })

    const messages = await Message.find({ conversation: targetConv._id }).sort({ timestamp: 1 })
    const last = messages[messages.length - 1]
    const openWindow = windows.filter(w => w?.open && w.expiresAt).sort((a, b) => b.expiresAt - a.expiresAt)[0]

    await Conversation.updateOne(
      { _id: targetConv._id },
      {
        $set: {
          contact: keeper._id,
          unreadCount,
          window: openWindow || { open: false, expiresAt: null },
          ...(last ? { lastMessage: { text: last.text, type: last.type, time: last.timestamp } } : {}),
          updatedAt: new Date(),
        },
      }
    )
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log(DRY_RUN ? '=== DRY RUN — no changes will be written ===\n' : '=== APPLYING CHANGES ===\n')

  const tenants = await Tenant.find({}).select('_id name').lean()

  for (const tenant of tenants) {
    const contacts = await Contact.find({ tenant: tenant._id }).lean()
    const groups = new Map()

    for (const c of contacts) {
      const key = normalizePhone(c.phone) || c.phone
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(c)
    }

    const dupes = [...groups.values()].filter(g => g.length > 1)
    if (!dupes.length) continue

    console.log(`Tenant: ${tenant.name || tenant._id}`)
    for (const group of dupes) {
      await mergeGroup(tenant._id, group)
    }
    console.log('')
  }

  if (!DRY_RUN) {
    for (const tenant of tenants) {
      const count = await Contact.countDocuments({ tenant: tenant._id })
      await Tenant.updateOne({ _id: tenant._id }, { $set: { 'usage.contacts': count } })
    }
    console.log('Recomputed tenant.usage.contacts for all tenants.')
  }

  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
