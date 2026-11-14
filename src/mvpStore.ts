import type { Booking, Listing } from './types'

const BASE = String(import.meta.env.VITE_MVP_STORE_URL || '').replace(/\/$/, '')
const CATEGORY_SLUGS = new Set(['kids-toys', 'board-games', 'diy-tools'])

export const sharedStoreEnabled = Boolean(BASE)

async function request<T>(path: string, init?: RequestInit, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    if (!response.ok) throw new Error(`Shared store returned ${response.status}`)
    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

function normalizeListing(value: unknown): Listing | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<Listing>
  if (!item.id || !item.title || !item.category || !CATEGORY_SLUGS.has(item.category)) return null
  if (typeof item.image !== 'string' || !item.image) return null
  return {
    ...item,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || 'Listed by a neighbour',
    category: item.category,
    pricePerDay: Number(item.pricePerDay) || 149,
    deposit: Number(item.deposit) || 0,
    image: item.image,
    location: item.location || 'Bengaluru',
    distanceKm: Number(item.distanceKm) || 0,
    rating: Number(item.rating) || 5,
    reviewCount: Number(item.reviewCount) || 0,
    owner: item.owner || {
      name: 'RentHood tester',
      initials: 'RT',
      since: '2026',
      responseTime: '~10 min',
      superhost: false,
    },
    condition: item.condition || 'Good',
    useCase: item.useCase || 'New listing',
    includes: item.includes || 'See description',
    description: item.description || '',
    features: Array.isArray(item.features) ? item.features : [],
    handover: item.handover || `Pickup from ${item.location || 'Bengaluru'}.`,
    badge: item.badge || 'Beta listing',
    availableToday: item.availableToday !== false,
    isUserListing: true,
  } as Listing
}

export async function fetchSharedListings(): Promise<Listing[]> {
  if (!BASE) return []
  try {
    const data = await request<unknown>('/listings')
    if (!Array.isArray(data)) return []
    return data.map(normalizeListing).filter((item): item is Listing => Boolean(item))
  } catch {
    return []
  }
}

export async function saveSharedListing(listing: Listing): Promise<Listing | null> {
  if (!BASE) return null
  try {
    const saved = await request<Record<string, unknown>>('/listings', {
      method: 'POST',
      body: JSON.stringify(listing),
    })
    return normalizeListing({ ...listing, ...saved, id: listing.id })
  } catch {
    return null
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return 'hidden'
  return `${name.slice(0, 1)}***@${domain}`
}

export async function saveSharedBooking(booking: Booking): Promise<void> {
  if (!BASE) return
  const payload = {
    id: booking.id,
    orderId: booking.orderId,
    listingId: booking.listingId,
    listingTitle: booking.listingTitle,
    start: booking.start,
    end: booking.end,
    days: booking.days,
    total: booking.total,
    status: booking.status,
    createdAt: booking.createdAt,
    customer: {
      name: booking.customer.name,
      email: maskEmail(booking.customer.email),
      phone: `••••${booking.customer.phone.slice(-4)}`,
    },
  }
  try {
    await request('/bookings', { method: 'POST', body: JSON.stringify(payload) })
  } catch {
    // The booking is still stored locally; shared test data is best-effort.
  }
}

export async function fetchSharedBookings(): Promise<Array<Record<string, unknown>>> {
  if (!BASE) return []
  try {
    const data = await request<unknown>('/bookings')
    return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []
  } catch {
    return []
  }
}
