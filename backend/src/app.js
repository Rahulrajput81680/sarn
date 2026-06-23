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

// Security headers
app.use(helmet())

// CORS — only allow configured frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Body parsers — limit size to prevent DoS
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Sanitize MongoDB operators in req.body/params/query (NoSQL injection)
app.use(mongoSanitize())

// Strip dangerous HTML tags (XSS)
app.use(xss())

// Prevent HTTP parameter pollution
app.use(hpp())

// Gzip responses
app.use(compression())

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Static files (avatar uploads etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// API routes
app.use('/api/v1', routes)

// 404 + global error handler
app.use(notFound)
app.use(errorHandler)

module.exports = app
