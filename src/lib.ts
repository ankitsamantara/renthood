import type { Category, CategorySlug, Listing, Quote } from './types'
import categoriesData from '../shared/categories.json'

export const categories = categoriesData as Category[]

export const categoryBySlug = Object.fromEntries(
  categories.map((category) => [category.slug, category]),
) as Record<CategorySlug, Category>

export const DEMO_WHATSAPP_NUMBER = (
  import.meta.env.VITE_WHATSAPP_NUMBER || '919148738996'
).replace(/\D/g, '')

export const PLATFORM_FEE_RATE = 0.06
export const HOST_COMMISSION_RATE = 0.1

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function defaultDates() {
  const start = addDays(new Date(), 2)
  return {
    start: toISODate(start),
    end: toISODate(addDays(start, 2)),
  }
}

export function daysBetween(start: string, end: string) {
  const startDate = parseISODate(start)
  const endDate = parseISODate(end)
  return Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1,
  )
}

export function isValidDateRange(start: string, end: string) {
  if (!start || !end) return false
  const startDate = parseISODate(start)
  const endDate = parseISODate(end)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return startDate >= today && endDate >= startDate
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return parseISODate(value).toLocaleDateString(
    'en-IN',
    options ?? { day: 'numeric', month: 'short' },
  )
}

export function formatDateRange(start: string, end: string) {
  const startDate = parseISODate(start)
  const endDate = parseISODate(end)
  const sameMonth = startDate.getMonth() === endDate.getMonth()
  const startLabel = startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: sameMonth ? undefined : 'short',
  })
  const endLabel = endDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  return `${startLabel} – ${endLabel}`
}

export function quoteFor(listing: Listing, start: string, end: string): Quote {
  const days = daysBetween(start, end)
  const subtotal = listing.pricePerDay * days
  const serviceFee = Math.max(19, Math.round(subtotal * PLATFORM_FEE_RATE))
  const deposit = listing.deposit
  const total = subtotal + serviceFee + deposit
  const ownerEarnings = subtotal - Math.round(subtotal * HOST_COMMISSION_RATE)
  return { days, subtotal, serviceFee, deposit, total, ownerEarnings }
}

export function whatsappLink(message: string) {
  return `https://wa.me/${DEMO_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function listingWhatsappLink(listing: Listing) {
  const category = categoryBySlug[listing.category]?.name ?? listing.category
  return whatsappLink(
    `Hi RentHood! I'd like to list my item on the marketplace.\n\nItem: ${listing.title}\nCategory: ${category}\nRent: ${formatINR(listing.pricePerDay)}/day\nDeposit: ${formatINR(listing.deposit)}\nPickup area: ${listing.location}\n\nCan you help me get it live?`,
  )
}

export function inquiryWhatsappLink(listing: Listing, start: string, end: string) {
  return whatsappLink(
    `Hi RentHood! I have a question about "${listing.title}" (${formatINR(listing.pricePerDay)}/day) in ${listing.location}.\n\nDates: ${formatDateRange(start, end)}\n\nIs it available?`,
  )
}

export function bookingWhatsappLink(listing: Listing, start: string, end: string) {
  return whatsappLink(
    `Hi ${listing.owner.name}! I just booked "${listing.title}" on RentHood.\n\nDates: ${formatDateRange(start, end)}\nPickup: ${listing.location}\n\nCan we sort out the handover?`,
  )
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function optimizeImage(file: File, maxWidth = 1200) {
  const dataUrl = await fileToDataUrl(file)
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Could not read that image'))
    image.src = dataUrl
  })
  const ratio = Math.min(1, maxWidth / image.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * ratio)
  canvas.height = Math.round(image.height * ratio)
  const context = canvas.getContext('2d')
  if (!context) return dataUrl
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function shortOrderId(id: string) {
  const compact = id.replace(/^rh_/, '').replace(/^local-/, '')
  return `#${compact.slice(-8).toUpperCase()}`
}
