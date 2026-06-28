const { parse } = require('csv-parse/sync')
const fs = require('fs')
const Contact = require('../models/Contact')
const Tenant = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')

// GET /api/v1/contacts
const getContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, tag, status, source } = req.query
  const filter = { tenant: req.tenantId }

  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ]
  if (tag) filter.tags = tag
  if (status) filter.status = status
  if (source) filter.source = source

  const skip = (Number(page) - 1) * Number(limit)
  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Contact.countDocuments(filter),
  ])

  return success(res, { contacts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// POST /api/v1/contacts
const createContact = asyncHandler(async (req, res) => {
  const { name, phone, email, tags, notes, source, city, product, isOptedIn, status } = req.body
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' })

  const contact = await Contact.create({
    tenant: req.tenantId, name, phone, email, tags, notes,
    source: source || 'manual', city, product,
    isOptedIn: isOptedIn !== undefined ? isOptedIn : true,
    status: status || 'active',
  })
  await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.contacts': 1 } })
  return success(res, { contact }, 'Contact created', 201)
})

// PUT /api/v1/contacts/:id
const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenantId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
  return success(res, { contact }, 'Contact updated')
})

// DELETE /api/v1/contacts/:id
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId })
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
  await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.contacts': -1 } })
  return success(res, {}, 'Contact deleted')
})

// DELETE /api/v1/contacts/bulk
const bulkDeleteContacts = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!ids?.length) return res.status(400).json({ success: false, message: 'No contact IDs provided' })
  const result = await Contact.deleteMany({ _id: { $in: ids }, tenant: req.tenantId })
  await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.contacts': -result.deletedCount } })
  return success(res, { deleted: result.deletedCount }, `${result.deletedCount} contacts deleted`)
})

// POST /api/v1/contacts/import
const importContacts = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' })

  const raw = fs.readFileSync(req.file.path, 'utf8')
  fs.unlinkSync(req.file.path) // clean up

  let rows
  try {
    rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid CSV format' })
  }

  if (!rows.length) return res.status(400).json({ success: false, message: 'CSV is empty' })

  const ops = rows
    .filter(r => r.phone || r.Phone || r.PHONE)
    .map(r => ({
      updateOne: {
        filter: { tenant: req.tenantId, phone: r.phone || r.Phone || r.PHONE },
        update: {
          $setOnInsert: {
            tenant: req.tenantId,
            name:   r.name  || r.Name  || r.NAME  || 'Unknown',
            phone:  r.phone || r.Phone || r.PHONE,
            email:  r.email || r.Email || '',
            tags:   r.tags  ? r.tags.split(',').map(t => t.trim()) : [],
            source: 'import',
          },
        },
        upsert: true,
      },
    }))

  const result = await Contact.bulkWrite(ops)
  const added = result.upsertedCount
  await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.contacts': added } })

  return success(res, { imported: added, skipped: rows.length - added }, `${added} contacts imported`)
})

// GET /api/v1/contacts/export
const exportContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({ tenant: req.tenantId }).lean()
  const header = 'name,phone,email,tags,status,source,createdAt\n'
  const rows = contacts.map(c =>
    `"${c.name}","${c.phone}","${c.email || ''}","${(c.tags || []).join('|')}","${c.status}","${c.source}","${c.createdAt?.toISOString() || ''}"`
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"')
  res.send(header + rows)
})

module.exports = { getContacts, createContact, updateContact, deleteContact, bulkDeleteContacts, importContacts, exportContacts }
