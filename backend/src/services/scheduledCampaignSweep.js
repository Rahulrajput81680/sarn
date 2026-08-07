const Campaign = require('../models/Campaign')
const { startCampaignSend } = require('../controllers/campaign.controller')

// Finds campaigns sitting at status 'scheduled' whose schedule.sendAt has arrived, and starts
// them — the actual "wait until the picked time, then send" mechanism. Without this, scheduling
// a campaign had no effect: nothing ever revisited it after creation.
async function sweepScheduledCampaigns() {
  const due = await Campaign.find({
    status: 'scheduled',
    'schedule.sendAt': { $lte: new Date() },
  }).populate('template')

  for (const campaign of due) {
    try {
      const { error } = await startCampaignSend(campaign, campaign.tenant)
      if (error) {
        console.warn(`[ScheduledCampaignSweep] "${campaign.name}" could not start: ${error.body?.message}`)
        // Leave it at 'scheduled' — TOS/WA-connection/limit issues are often transient
        // (e.g. reconnect WhatsApp later today), so retry on the next sweep rather than
        // silently dropping the campaign.
      }
    } catch (err) {
      console.error(`[ScheduledCampaignSweep] Failed to start "${campaign.name}":`, err.message)
    }
  }

  if (due.length) {
    console.log(`[ScheduledCampaignSweep] Started ${due.length} scheduled campaign(s)`)
  }
}

module.exports = { sweepScheduledCampaigns }
