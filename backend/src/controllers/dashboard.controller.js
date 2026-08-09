const Contact = require('../models/Contact')
const Campaign = require('../models/Campaign')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Template = require('../models/Template')
const Tenant = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const waService = require('../services/whatsapp/whatsapp.service')

function mapQuality(qualityRating) {
  const value = String(qualityRating || '').toUpperCase()
  if (value === 'GREEN') return 'Healthy'
  if (value === 'YELLOW') return 'Medium'
  if (value === 'RED') return 'Low'
  if (value === 'NA') return 'Not determined'
  return 'Unknown'
}

function mapMessagingLimit(tier, fallback) {
  const value = String(tier || '').toUpperCase()
  const limits = {
    TIER_50: '50/day',
    TIER_250: '250/day',
    TIER_1K: '1,000/day',
    TIER_10K: '10,000/day',
    TIER_100K: '100,000/day',
    TIER_UNLIMITED: 'Unlimited',
    UNLIMITED: 'Unlimited',
  }
  if (limits[value]) return limits[value]
  if (fallback?.messages) return `${Math.max(1, Math.round(fallback.messages / 30)).toLocaleString()}/day`
  return 'Unknown'
}

function buildWhatsAppStatus(tenant, liveDetails, liveError) {
  const whatsapp = tenant?.whatsapp || {}
  const merged = {
    ...whatsapp,
    ...(liveDetails ? {
      displayName: liveDetails.verifiedName,
      phoneNumber: liveDetails.displayPhone,
      qualityRating: liveDetails.qualityRating,
      phoneStatus: liveDetails.phoneStatus,
      nameStatus: liveDetails.nameStatus,
      messagingLimitTier: liveDetails.messagingLimitTier,
      codeVerificationStatus: liveDetails.codeVerificationStatus,
    } : {}),
  }
  const isConnected = merged.status === 'connected'
  const phoneStatus = merged.phoneStatus || (isConnected ? 'CONNECTED' : 'DISCONNECTED')
  const nameStatus = merged.nameStatus || 'UNKNOWN'
  const codeVerificationStatus = merged.codeVerificationStatus || 'UNKNOWN'

  // AVAILABLE_WITHOUT_REVIEW and PENDING_REVIEW are normal, fully-usable display-name states —
  // the name works either way, it just didn't go through Meta's *optional* formal review.
  // Only DECLINED/NONE actually indicate a real problem worth surfacing.
  const NAME_STATUS_OK = new Set(['APPROVED', 'AVAILABLE_WITHOUT_REVIEW', 'PENDING_REVIEW', 'UNKNOWN'])
  const hasNameProblem = !NAME_STATUS_OK.has(nameStatus)

  // code_verification_status only matters during initial setup, before the number is connected.
  // Once CONNECTED, that one-time SMS/voice code is *supposed* to read EXPIRED forever — it
  // already did its job — so it's not a live problem for an already-working number.
  const hasCodeProblem = phoneStatus !== 'CONNECTED' && codeVerificationStatus !== 'VERIFIED' && codeVerificationStatus !== 'UNKNOWN'

  const verified = isConnected && phoneStatus === 'CONNECTED' && !hasNameProblem
  const issues = []

  if (!isConnected) issues.push('WhatsApp is not connected')
  if (isConnected && phoneStatus !== 'CONNECTED') issues.push(`Phone status is ${phoneStatus}`)
  if (isConnected && hasNameProblem) issues.push(`Display name status is ${nameStatus}`)
  if (isConnected && hasCodeProblem) issues.push(`Code verification is ${codeVerificationStatus}`)
  if (isConnected && String(merged.qualityRating || '').toUpperCase() === 'RED') issues.push('Quality rating is low')
  if (liveError) issues.push('Live Meta status could not be refreshed')

  return {
    displayName: merged.displayName || tenant?.name || 'WhatsApp Business',
    phoneNumber: merged.phoneNumber || '',
    connectionStatus: merged.status || 'pending',
    phoneStatus,
    nameStatus,
    codeVerificationStatus,
    qualityRating: merged.qualityRating || null,
    qualityLabel: mapQuality(merged.qualityRating),
    messagingLimitTier: merged.messagingLimitTier || null,
    messagingLimitLabel: mapMessagingLimit(merged.messagingLimitTier, tenant?.limits),
    registered: isConnected && phoneStatus === 'CONNECTED',
    verified,
    primary: true,
    issues,
    issueCount: issues.length,
    source: liveDetails ? 'meta' : 'stored',
    lastCheckedAt: liveDetails ? new Date() : merged.statusLastCheckedAt,
    error: liveError ? liveError.message : null,
  }
}

// GET /api/v1/dashboard/stats
const getStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId

  const [totalContacts, totalCampaigns, totalReplies, activeFlows, tenant] = await Promise.all([
    Contact.countDocuments({ tenant: tenantId, status: 'active' }),
    Campaign.countDocuments({ tenant: tenantId, status: { $in: ['completed', 'running'] } }),
    Message.countDocuments({ tenant: tenantId, type: 'customer' }),
    Template.countDocuments({ tenant: tenantId, status: 'APPROVED' }),
    Tenant.findById(tenantId).lean(),
  ])

  let liveWhatsAppDetails = null
  let liveWhatsAppError = null
  if (tenant?.whatsapp?.status === 'connected' && tenant.whatsapp.phoneNumberId) {
    try {
      liveWhatsAppDetails = await waService.refreshPhoneNumberDetails(tenantId)
    } catch (err) {
      liveWhatsAppError = err
    }
  }

  return success(res, {
    totalContacts,
    totalCampaigns,
    totalReplies,
    activeFlows,
    usage: tenant?.usage || {},
    limits: tenant?.limits || {},
    plan: tenant?.plan || 'starter',
    whatsapp: tenant?.whatsapp || {},
    whatsappStatus: buildWhatsAppStatus(tenant, liveWhatsAppDetails, liveWhatsAppError),
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
