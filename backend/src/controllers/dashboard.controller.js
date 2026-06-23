const Contact = require('../models/Contact')
const Campaign = require('../models/Campaign')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Template = require('../models/Template')
const Tenant = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')

// GET /api/v1/dashboard/stats
const getStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId

  const [totalContacts, totalCampaigns, totalReplies, activeFlows, tenant] = await Promise.all([
    Contact.countDocuments({ tenant: tenantId, status: 'active' }),
    Campaign.countDocuments({ tenant: tenantId, status: { $in: ['completed', 'running'] } }),
    Message.countDocuments({ tenant: tenantId, type: 'customer' }),
    Template.countDocuments({ tenant: tenantId, status: 'APPROVED' }),
    Tenant.findById(tenantId),
  ])

  return success(res, {
    totalContacts,
    totalCampaigns,
    totalReplies,
    activeFlows,
    usage: tenant?.usage || {},
    limits: tenant?.limits || {},
    plan: tenant?.plan || 'starter',
    whatsapp: tenant?.whatsapp || {},
  })
})

// GET /api/v1/dashboard/message-trend
const getMessageTrend = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId
  const days = 30
  const since = new Date()
  since.setDate(since.getDate() - days)

  const messages = await Message.aggregate([
    { $match: { tenant: require('mongoose').Types.ObjectId.createFromHexString(tenantId), createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  // Fill missing days with 0
  const map = Object.fromEntries(messages.map(m => [m._id, m.count]))
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    return { date: key, value: map[key] || 0 }
  })

  return success(res, { trend })
})

// GET /api/v1/dashboard/delivery-stats
const getDeliveryStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const stats = await Message.aggregate([
    {
      $match: {
        tenant: require('mongoose').Types.ObjectId.createFromHexString(tenantId),
        type: 'agent',
        createdAt: { $gte: since },
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const totals = { sent: 0, delivered: 0, read: 0, failed: 0 }
  stats.forEach(s => { if (totals[s._id] !== undefined) totals[s._id] = s.count })
  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1

  return success(res, {
    delivered: +((totals.delivered / total) * 100).toFixed(1),
    read:      +((totals.read / total) * 100).toFixed(1),
    failed:    +((totals.failed / total) * 100).toFixed(1),
  })
})

// GET /api/v1/dashboard/recent-conversations
const getRecentConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ tenant: req.tenantId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('contact', 'name phone')
    .lean()

  return success(res, { conversations })
})

module.exports = { getStats, getMessageTrend, getDeliveryStats, getRecentConversations }
