import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dbFile = process.env.RENTHOOD_DB_FILE
  ? path.resolve(process.env.RENTHOOD_DB_FILE)
  : path.join(__dirname, 'db.json')
const seedListings = JSON.parse(fs.readFileSync(path.join(root, 'shared/listings.json'), 'utf8'))
const categories = JSON.parse(fs.readFileSync(path.join(root, 'shared/categories.json'), 'utf8'))
const categorySlugs = new Set(categories.map((category) => category.slug))
const distDir = path.join(root, 'dist')

const PORT = Number(process.env.PORT || 8787)
const CASHFREE_ENV = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
const CASHFREE_BASE =
  CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
const hasCashfreeKeys = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY)
const API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01'

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '8mb' }))
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})

function defaultDb() {
  return { listings: [], orders: [], bookings: [] }
}

async function readDb() {
  try {
    const raw = await fs.promises.readFile(dbFile, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    }
  } catch {
    return defaultDb()
  }
}

let writeQueue = Promise.resolve()

function writeDb(db) {
  writeQueue = writeQueue.then(async () => {
    await fs.promises.mkdir(path.dirname(dbFile), { recursive: true })
    const temp = `${dbFile}.${process.pid}.tmp`
    await fs.promises.writeFile(temp, JSON.stringify(db, null, 2))
    await fs.promises.rename(temp, dbFile)
  })
  return writeQueue
}

async function allListings() {
  const db = await readDb()
  return [...seedListings, ...db.listings]
}

function cleanString(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function round(value) {
  return Math.round(value)
}

function quoteFor(listing, start, end) {
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  const days = Math.round((endMs - startMs) / 86_400_000) + 1
  if (days > 60) return null
  const subtotal = listing.pricePerDay * days
  const serviceFee = Math.max(19, round(subtotal * 0.06))
  const deposit = listing.deposit
  return {
    days,
    subtotal,
    serviceFee,
    deposit,
    total: subtotal + serviceFee + deposit,
  }
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function orderId() {
  return `rh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function bookingId() {
  return `booking_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
}

async function cashfreeRequest(endpoint, options = {}) {
  const response = await fetch(`${CASHFREE_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      data?.message || data?.error_description || `Cashfree returned ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.details = data
    throw error
  }
  return data
}

function appOrigin(req) {
  return (
    process.env.PUBLIC_APP_URL ||
    req.get('origin') ||
    `${req.protocol}://${req.get('host')}`
  ).replace(/\/$/, '')
}

function makeBooking(order) {
  return {
    id: bookingId(),
    orderId: order.orderId,
    listingId: order.listingId,
    listingTitle: order.listingTitle,
    listingImage: order.listingImage,
    start: order.start,
    end: order.end,
    days: order.quote.days,
    subtotal: order.quote.subtotal,
    serviceFee: order.quote.serviceFee,
    deposit: order.quote.deposit,
    total: order.quote.total,
    customer: order.customer,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    mode: order.mode,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'renthood-api', cashfree: CASHFREE_ENV })
})

app.get('/api/config', (_req, res) => {
  res.json({
    cashfreeConfigured: hasCashfreeKeys,
    cashfreeEnvironment: CASHFREE_ENV,
    whatsappNumber: process.env.VITE_WHATSAPP_NUMBER || '919148738996',
  })
})

app.get('/api/listings', async (_req, res, next) => {
  try {
    res.json({ listings: await allListings() })
  } catch (error) {
    next(error)
  }
})

app.post('/api/listings', async (req, res, next) => {
  try {
    const body = req.body || {}
    const category = cleanString(body.category, 40)
    if (!categorySlugs.has(category)) {
      res.status(400).json({ error: 'Choose one of the three supported categories.' })
      return
    }
    const title = cleanString(body.title, 80)
    const description = cleanString(body.description, 1000)
    const pricePerDay = Number(body.pricePerDay)
    const deposit = Number(body.deposit)
    if (title.length < 4) {
      res.status(400).json({ error: 'Give the listing a title of at least 4 characters.' })
      return
    }
    if (description.length < 10) {
      res.status(400).json({ error: 'Add a description of at least 10 characters.' })
      return
    }
    if (!Number.isFinite(pricePerDay) || pricePerDay < 49 || pricePerDay > 5000) {
      res.status(400).json({ error: 'Daily price must be between ₹49 and ₹5,000.' })
      return
    }
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > 20000) {
      res.status(400).json({ error: 'Deposit must be between ₹0 and ₹20,000.' })
      return
    }
    const ownerName = cleanString(body.owner?.name, 60) || 'RentHood host'
    const listing = {
      id: `user_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      title,
      subtitle: cleanString(body.subtitle, 80) || 'Listed by a neighbour',
      category,
      pricePerDay,
      deposit,
      image: cleanString(body.image, 1_500_000) || categories.find((item) => item.slug === category).image,
      location: cleanString(body.location, 80) || 'Bengaluru',
      distanceKm: 0,
      rating: 5,
      reviewCount: 0,
      owner: {
        name: ownerName,
        initials: ownerName
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        since: '2026',
        responseTime: '~5 min',
        superhost: false,
      },
      condition: cleanString(body.condition, 40) || 'Very good',
      useCase: 'New listing',
      includes: cleanString(body.includes, 120) || 'See description',
      description,
      features: ['New listing', 'Locally owned', 'Handover nearby'],
      handover: `Pickup from ${cleanString(body.location, 80) || 'Bengaluru'}. Coordinate on WhatsApp after booking.`,
      badge: 'New listing',
      availableToday: body.availableToday !== false,
      isUserListing: true,
    }

    const db = await readDb()
    db.listings.unshift(listing)
    await writeDb(db)
    res.status(201).json({ listing })
  } catch (error) {
    next(error)
  }
})

app.post('/api/create-order', async (req, res, next) => {
  try {
    const body = req.body || {}
    const listingId = cleanString(body.listingId, 100)
    const start = cleanString(body.start, 10)
    const end = cleanString(body.end, 10)
    const customer = {
      name: cleanString(body.customer?.name, 80),
      email: cleanString(body.customer?.email, 120),
      phone: cleanString(body.customer?.phone, 20).replace(/\D/g, ''),
    }

    if (!isDate(start) || !isDate(end)) {
      res.status(400).json({ error: 'Choose a valid pickup and return date.' })
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    if (start < today) {
      res.status(400).json({ error: 'Pickup cannot be in the past.' })
      return
    }
    if (
      customer.name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
      customer.phone.length < 10
    ) {
      res.status(400).json({ error: 'Add a valid name, email and 10-digit phone number.' })
      return
    }

    const listing = (await allListings()).find((item) => item.id === listingId)
    if (!listing) {
      res.status(404).json({ error: 'That listing could not be found.' })
      return
    }
    const quote = quoteFor(listing, start, end)
    if (!quote) {
      res.status(400).json({ error: 'That date range is not valid. Please choose dates within 60 days.' })
      return
    }

    const id = orderId()
    const mode = hasCashfreeKeys ? 'cashfree' : 'demo'
    let paymentSessionId = null
    let cashfreeOrderId = null

    if (mode === 'cashfree') {
      try {
        const payload = {
          order_amount: quote.total,
          order_currency: 'INR',
          order_id: id,
          customer_details: {
            customer_id: `cust_${customer.phone}`,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
          },
          order_meta: {
            return_url: `${appOrigin(req)}/checkout/return?order_id={order_id}`,
            notify_url: process.env.CASHFREE_WEBHOOK_URL || undefined,
          },
          order_note: `RentHood — ${listing.title} · ${quote.days} day(s)`,
          order_tags: { listingId: listing.id, bookingSource: 'web' },
        }
        const cfOrder = await cashfreeRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        paymentSessionId = cfOrder.payment_session_id
        cashfreeOrderId = cfOrder.order_id
      } catch (error) {
        console.error('Cashfree order creation failed:', error.message, error.details)
        res.status(502).json({
          error: 'Cashfree could not start this payment. Please try again in a moment.',
        })
        return
      }
    }

    const order = {
      orderId: id,
      cashfreeOrderId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.image,
      start,
      end,
      quote,
      customer,
      mode,
      environment: CASHFREE_ENV,
      paymentSessionId,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    }

    const db = await readDb()
    db.orders.unshift(order)
    await writeDb(db)

    res.status(201).json({
      mode,
      orderId: id,
      amount: quote.total,
      paymentSessionId: paymentSessionId || undefined,
      environment: CASHFREE_ENV,
      quote,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/confirm-order', async (req, res, next) => {
  try {
    const body = req.body || {}
    const id = cleanString(body.orderId, 100)
    const db = await readDb()
    const order = db.orders.find((item) => item.orderId === id)
    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }
    if (order.mode !== 'demo') {
      res.status(400).json({ error: 'Live orders must be confirmed by Cashfree.' })
      return
    }
    if (order.status === 'PAID') {
      const existing = db.bookings.find((booking) => booking.orderId === order.orderId)
      res.json({ booking: existing, order })
      return
    }
    order.status = 'PAID'
    order.paidAt = new Date().toISOString()
    const booking = makeBooking(order)
    db.bookings.unshift(booking)
    await writeDb(db)
    res.json({ booking, order })
  } catch (error) {
    next(error)
  }
})

app.get('/api/verify-order', async (req, res, next) => {
  try {
    const id = cleanString(req.query.orderId, 100)
    const db = await readDb()
    const order = db.orders.find((item) => item.orderId === id)
    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    if (order.status === 'PAID') {
      const existing = db.bookings.find((booking) => booking.orderId === order.orderId)
      res.json({ status: 'PAID', booking: existing || null })
      return
    }

    if (order.mode === 'demo') {
      res.json({ status: order.status, booking: null })
      return
    }

    try {
      const cfOrder = await cashfreeRequest(`/orders/${encodeURIComponent(order.cashfreeOrderId || order.orderId)}`)
      const status = cfOrder.order_status || 'ACTIVE'
      if (status === 'PAID') {
        order.status = 'PAID'
        order.paidAt = new Date().toISOString()
        const booking = makeBooking(order)
        db.bookings.unshift(booking)
        await writeDb(db)
        res.json({ status: 'PAID', booking })
        return
      }
      res.json({ status, booking: null })
    } catch (error) {
      console.error('Cashfree verification failed:', error.message)
      res.status(502).json({ error: 'Could not verify the payment with Cashfree.' })
    }
  } catch (error) {
    next(error)
  }
})

app.get('/api/bookings', async (_req, res, next) => {
  try {
    const db = await readDb()
    res.json({ bookings: db.bookings })
  } catch (error) {
    next(error)
  }
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something unexpected happened. Please try again.' })
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && req.accepts('html')) {
      res.sendFile(path.join(distDir, 'index.html'))
      return
    }
    next()
  })
}

app.listen(PORT, () => {
  console.log(`\n  RentHood API → http://localhost:${PORT}`)
  console.log(`  Cashfree: ${hasCashfreeKeys ? `${CASHFREE_ENV} keys loaded` : 'demo mode (no keys)'}`)
  if (!fs.existsSync(distDir)) console.log('  Frontend: run `npm run dev` for Vite HMR\n')
})
