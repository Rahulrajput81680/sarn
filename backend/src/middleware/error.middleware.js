const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists`
    statusCode = 409
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ')
    statusCode = 400
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`
    statusCode = 400
  }

  // Never leak stack traces in production
  const response = { success: false, message }
  if (process.env.NODE_ENV === 'development') response.stack = err.stack

  res.status(statusCode).json(response)
}

module.exports = { notFound, errorHandler }
