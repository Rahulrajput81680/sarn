const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')
const morgan = require('morgan')
const path = require('path')

const routes = require('./routes/index')
const { errorHandler, notFound } = require('./middleware/error.middleware')

const app = express()

// Trust proxy — required when running behind Render/ngrok/reverse proxy
app.set('trust proxy', 1)

const corsOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

// Security headers
app.use(helmet())

// CORS — only allow configured frontend origin
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Body parsers — capture raw body for Meta webhook signature verification
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    if (req.path.startsWith('/api/v1/webhooks')) {
      req.rawBody = buf
    }
  },
}))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Sanitize MongoDB operators in req.body/params/query (NoSQL injection)
app.use(mongoSanitize())

// Strip dangerous HTML tags (XSS)
app.use(xss())

// Prevent HTTP parameter pollution
app.use(hpp())

// Gzip responses
app.use(compression())

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Static files (avatar uploads etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// API routes
app.use('/api/v1', routes)

// 404 + global error handler
app.use(notFound)
app.use(errorHandler)

module.exports = app
