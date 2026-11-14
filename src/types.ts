export type CategorySlug = 'kids-toys' | 'board-games' | 'diy-tools'

export interface Owner {
  name: string
  initials: string
  since: string
  responseTime: string
  superhost: boolean
}

export interface Listing {
  id: string
  title: string
  subtitle: string
  category: CategorySlug
  pricePerDay: number
  deposit: number
  image: string
  location: string
  distanceKm: number
  rating: number
  reviewCount: number
  owner: Owner
  condition: string
  useCase: string
  includes: string
  description: string
  features: string[]
  handover: string
  badge: string
  availableToday: boolean
  isUserListing?: boolean
}

export interface Category {
  slug: CategorySlug
  name: string
  shortName: string
  tagline: string
  description: string
  image: string
  startingAt: number
  count: number
  accent: 'butter' | 'coral' | 'mint'
  icon: 'toy' | 'dice' | 'hammer'
}

export interface Customer {
  name: string
  email: string
  phone: string
}

export interface Quote {
  days: number
  subtotal: number
  serviceFee: number
  deposit: number
  total: number
  ownerEarnings: number
}

export interface Booking {
  id: string
  orderId: string
  listingId: string
  listingTitle: string
  listingImage: string
  start: string
  end: string
  days: number
  subtotal: number
  serviceFee: number
  deposit: number
  total: number
  customer: Customer
  createdAt: string
  status: 'confirmed' | 'completed'
  mode: 'demo' | 'cashfree'
}

export interface ListingDraft {
  title: string
  category: CategorySlug
  pricePerDay: number
  deposit: number
  location: string
  condition: string
  description: string
  image: string
  availableToday?: boolean
}

export interface OrderResponse {
  mode: 'demo' | 'cashfree'
  orderId: string
  amount: number
  paymentSessionId?: string
  environment?: 'sandbox' | 'production'
  quote: Quote
}
