const { verifyToken } = require('../utils/generateToken')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' })
  }

  const token = authHeader.split(' ')[1]

  let decoded
  try {
    decoded = verifyToken(token)
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }

  const user = await User.findById(decoded.id).select('-password -apiKeyHash')
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'User no longer exists or is deactivated.' })
  }

  req.user = user
  req.tenantId = user.tenant?.toString()
  next()
})

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' })
  }
  next()
}

module.exports = { protect, restrictTo }
