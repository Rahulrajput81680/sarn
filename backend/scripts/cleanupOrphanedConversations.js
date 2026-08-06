// One-time cleanup: conversations whose contact was deleted before deleteContact
// cascaded (fixed in contact.controller.js) are left with a dangling contact ref
// and render as "Unknown" in the inbox. Removes those conversations + their messages.
require('dotenv').config()
const mongoose = require('mongoose')
const Contact = require('../src/models/Contact')
const Conversation = require('../src/models/Conversation')
const Message = require('../src/models/Message')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  const convos = await Conversation.find({}).lean()
  let cleaned = 0

  for (const c of convos) {
    const contact = await Contact.findById(c.contact).lean()
    if (!contact) {
      console.log('Deleting orphan conversation', c._id.toString(), 'tenant:', c.tenant.toString())
      await Message.deleteMany({ conversation: c._id })
      await Conversation.deleteOne({ _id: c._id })
      cleaned++
    }
  }

  console.log(`Cleaned ${cleaned} orphaned conversation(s)`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
