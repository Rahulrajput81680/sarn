const META_ERROR_MAP = {
  131030: "Recipient not in test whitelist — go to developers.facebook.com → WhatsApp → API Setup and add their number.",
  131047: "24-hour messaging window closed — use an approved template to re-engage this contact.",
  131026: "This number is not a valid WhatsApp account.",
  131000: "WhatsApp reported an internal error. Please try again shortly.",
  131021: "Sender and recipient phone number cannot be the same.",
  131051: "Unsupported message type for this contact.",
  100:    "Invalid request to WhatsApp API — check your template configuration.",
  368:    "Your WhatsApp Business Account has been temporarily restricted by Meta.",
  190:    "WhatsApp access token is invalid or expired — reconnect in Settings.",
}

function translateMetaError(err) {
  const apiErr = err.response?.data?.error
  const code    = apiErr?.code
  const subcode = apiErr?.error_subcode

  if (subcode && META_ERROR_MAP[subcode]) return META_ERROR_MAP[subcode]
  if (code    && META_ERROR_MAP[code])    return META_ERROR_MAP[code]

  // Fallback: use Meta's own message but strip internal jargon
  return apiErr?.message || err.message || 'WhatsApp delivery failed. Please try again.'
}

module.exports = { translateMetaError }
