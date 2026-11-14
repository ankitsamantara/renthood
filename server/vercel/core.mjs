import crypto from 'node:crypto'
import { categories, seedListings } from './data.mjs'
import { persistenceMode, readState, updateState } from './store.mjs'

const CASHFREE_ENV = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
const CASHFREE_BASE =
  CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01'
const hasCashfreeKeys = Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY)
const categorySlugs = new Set(categories.map((category) => category.slug))

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

export function errorResponse(res, error) {
  if (error instanceof HttpError) {
    json(res, error.status, { error: error.message })
    return
  }
  console.error(error)
  json(res, 500, { error: 'Something unexpected happened. Please try again.' })
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true
  res.setHeader('Allow', methods.join(', '))
  json(res, 405, { error: `Method ${req.method} is not allowed.` })
  return false
}

export async function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}')
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON.')
  }
}

export function queryValue(req, key) {
  if (req.query && typeof req.query[key] === 'string') return req.query[key]
  const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`)
  return url.searchParams.get(key) || ''
}

export function requestOrigin(req) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, '')
  const proto = req.headers?.['x-forwarded-proto'] || 'https'
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host
  return host ? `${proto}://${host}` : ''
}

function cleanString(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function toMoney(value) {
  return Math.round(value)
}

function isDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  )
}

export function quoteFor(listing, start, end) {
  if (!isDate(start) || !isDate(end)) return null
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  if (endMs < startMs) return null
  const days = Math.round((endMs - startMs) / 86_400_000) + 1
  if (days > 60) return null
  const subtotal = listing.pricePerDay * days
  const serviceFee = Math.max(19, toMoney(subtotal * 0.06))
  return {
    days,
    subtotal,
    serviceFee,
    deposit: listing.deposit,
    total: subtotal + serviceFee + listing.deposit,
  }
}

export async function allListings() {
  const { state } = await readState()
  return [...seedListings, ...state.listings]
}

export async function createListing(body) {
  const category = cleanString(body.category, 40)
  if (!categorySlugs.has(category)) {
    throw new HttpError(400, 'Choose one of the three supported categories.')
  }
  const title = cleanString(body.title, 80)
  const description = cleanString(body.description, 1000)
  const pricePerDay = Number(body.pricePerDay)
  const deposit = Number(body.deposit)
  if (title.length < 4) throw new HttpError(400, 'Give the listing a title of at least 4 characters.')
  if (description.length < 10) {
    throw new HttpError(400, 'Add a description of at least 10 characters.')
  }
  if (!Number.isFinite(pricePerDay) || pricePerDay < 49 || pricePerDay > 5000) {
    throw new HttpError(400, 'Daily price must be between ₹49 and ₹5,000.')
  }
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 20000) {
    throw new HttpError(400, 'Deposit must be between ₹0 and ₹20,000.')
  }

  const ownerName = cleanString(body.owner?.name, 60) || 'RentHood host'
  const fallbackImage = categories.find((item) => item.slug === category)?.image
  const listing = {
    id: `user_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title,
    subtitle: cleanString(body.subtitle, 80) || 'Listed by a neighbour',
    category,
    pricePerDay,
    deposit,
    image: cleanString(body.image, 1_500_000) || fallbackImage,
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

  await updateState((state) => {
    state.listings.unshift(listing)
  })

  return listing
}

function maskEmail(email) {
  const [name, domain] = String(email).split('@')
  if (!domain) return 'hidden'
  return `${name.slice(0, 1)}***@${domain}`
}

function publicCustomer(customer) {
  return {
    name: customer.name,
    email: maskEmail(customer.email),
    phone: `••••${customer.phone.slice(-4)}`,
  }
}

function validateCustomer(value) {
  const customer = {
    name: cleanString(value?.name, 80),
    email: cleanString(value?.email, 120),
    phone: cleanString(value?.phone, 20).replace(/\D/g, ''),
  }
  if (
    customer.name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
    customer.phone.length < 10
  ) {
    throw new HttpError(400, 'Add a valid name, email and 10-digit phone number.')
  }
  return customer
}

function validateDates(start, end) {
  if (!isDate(start) || !isDate(end)) {
    throw new HttpError(400, 'Choose a valid pickup and return date.')
  }
  const today = new Date().toISOString().slice(0, 10)
  if (start < today) throw new HttpError(400, 'Pickup cannot be in the past.')
  if (end < start) throw new HttpError(400, 'Return date must be on or after pickup.')
}

function newOrderId() {
  return `rh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function newBookingId() {
  return `booking_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
}

async function cashfreeRequest(endpoint, options = {}) {
  const response = await fetch(`${CASHFREE_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.message || data?.error_description || `Cashfree returned ${response.status}`
    const error = new Error(message)
    error.details = data
    throw error
  }
  return data
}

function makeBooking(order) {
  return {
    id: newBookingId(),
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

export async function createOrder(body, req) {
  const start = cleanString(body.start, 10)
  const end = cleanString(body.end, 10)
  validateDates(start, end)
  const customer = validateCustomer(body.customer)
  const listingId = cleanString(body.listingId, 100)
  const listing = (await allListings()).find((item) => item.id === listingId)
  if (!listing) throw new HttpError(404, 'That listing could not be found.')
  const quote = quoteFor(listing, start, end)
  if (!quote) throw new HttpError(400, 'That date range is not valid. Please choose dates within 60 days.')

  const orderId = newOrderId()
  const mode = hasCashfreeKeys ? 'cashfree' : 'demo'
  let paymentSessionId = null
  let cashfreeOrderId = null

  if (mode === 'cashfree') {
    try {
      const origin = requestOrigin(req)
      const payload = {
        order_amount: quote.total,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: `cust_${customer.phone}`,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
        },
        order_meta: {
          return_url: `${origin}/checkout/return?order_id={order_id}`,
          ...(process.env.CASHFREE_WEBHOOK_URL
            ? { notify_url: process.env.CASHFREE_WEBHOOK_URL }
            : {}),
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
      throw new HttpError(502, 'Cashfree could not start this payment. Please try again in a moment.')
    }
  }

  const order = {
    orderId,
    cashfreeOrderId,
    listingId: listing.id,
    listingTitle: listing.title,
    listingImage: listing.image,
    start,
    end,
    quote,
    customer: publicCustomer(customer),
    mode,
    environment: CASHFREE_ENV,
    paymentSessionId,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
  }

  await updateState((state) => {
    state.orders.unshift(order)
  })

  return {
    mode,
    orderId,
    amount: quote.total,
    paymentSessionId: paymentSessionId || undefined,
    environment: CASHFREE_ENV,
    quote,
  }
}

export async function confirmDemoOrder(orderId) {
  const id = cleanString(orderId, 100)
  if (!id) throw new HttpError(400, 'Order reference is required.')

  return updateState((state) => {
    const order = state.orders.find((item) => item.orderId === id)
    if (!order) throw new HttpError(404, 'Order not found.')
    if (order.mode !== 'demo') throw new HttpError(400, 'Live orders must be confirmed by Cashfree.')
    if (order.status === 'PAID') {
      return state.bookings.find((booking) => booking.orderId === order.orderId) || null
    }
    order.status = 'PAID'
    order.paidAt = new Date().toISOString()
    const booking = makeBooking(order)
    state.bookings.unshift(booking)
    return booking
  })
}

export async function verifyOrder(orderId) {
  const id = cleanString(orderId, 100)
  if (!id) throw new HttpError(400, 'Order reference is required.')
  const { state } = await readState()
  const order = state.orders.find((item) => item.orderId === id)
  if (!order) throw new HttpError(404, 'Order not found.')

  if (order.status === 'PAID') {
    const booking = state.bookings.find((item) => item.orderId === id)
    return { status: 'PAID', booking: booking || null }
  }
  if (order.mode === 'demo') return { status: order.status, booking: null }

  const cfOrder = await cashfreeRequest(
    `/orders/${encodeURIComponent(order.cashfreeOrderId || order.orderId)}`,
  )
  const status = cfOrder.order_status || 'ACTIVE'
  if (status !== 'PAID') return { status, booking: null }

  const result = await updateState((draft) => {
    const current = draft.orders.find((item) => item.orderId === id)
    if (!current) throw new HttpError(404, 'Order not found.')
    if (current.status === 'PAID') {
      return draft.bookings.find((booking) => booking.orderId === id) || null
    }
    current.status = 'PAID'
    current.paidAt = new Date().toISOString()
    const booking = makeBooking(current)
    draft.bookings.unshift(booking)
    return booking
  })
  return { status: 'PAID', booking: result.result || null }
}

export async function getConfig() {
  return {
    cashfreeConfigured: hasCashfreeKeys,
    cashfreeEnvironment: CASHFREE_ENV,
    mode: hasCashfreeKeys ? 'cashfree' : 'demo',
    persistence: persistenceMode(),
    whatsappNumber: process.env.VITE_WHATSAPP_NUMBER || '919148738996',
    listingCategories: categories.map((category) => category.slug),
  }
}

export async function getHealth() {
  return {
    ok: true,
    service: 'renthood-api',
    runtime: 'vercel',
    cashfree: CASHFREE_ENV,
    persistence: persistenceMode(),
  }
}

export { categories, seedListings, hasCashfreeKeys }
