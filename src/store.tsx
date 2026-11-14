import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import seedData from '../shared/listings.json'
import type { Booking, Listing, ListingDraft } from './types'
import { newId } from './lib'
import {
  fetchSharedListings,
  saveSharedBooking,
  saveSharedListing,
  sharedStoreEnabled,
} from './mvpStore'

const seedListings = seedData as unknown as Listing[]
const LISTINGS_KEY = 'renthood:user-listings'
const WISHLIST_KEY = 'renthood:wishlist'
const BOOKINGS_KEY = 'renthood:bookings'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or unavailable in private mode. The session still works.
  }
}

interface Toast {
  id: number
  message: string
  tone: 'success' | 'info'
}

interface AppContextValue {
  listings: Listing[]
  wishlist: string[]
  bookings: Booking[]
  currentUser: { name: string; email: string; phone: string; initials: string }
  toast: Toast | null
  notify: (message: string, tone?: Toast['tone']) => void
  dismissToast: () => void
  toggleWishlist: (id: string) => void
  addListing: (draft: ListingDraft) => Promise<Listing>
  addBooking: (booking: Booking) => void
  getListing: (id: string) => Listing | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

const currentUser = {
  name: 'Aarav Mehta',
  email: 'aarav.mehta@example.com',
  phone: '98765 43210',
  initials: 'AM',
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [customListings, setCustomListings] = useState<Listing[]>(() =>
    readStorage<Listing[]>(LISTINGS_KEY, []),
  )
  const [remoteListings, setRemoteListings] = useState<Listing[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() =>
    readStorage<string[]>(WISHLIST_KEY, []),
  )
  const [bookings, setBookings] = useState<Booking[]>(() =>
    readStorage<Booking[]>(BOOKINGS_KEY, []),
  )
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadListings() {
      try {
        const response = await fetch('/api/listings')
        if (!response.ok) throw new Error('API unavailable')
        const data = (await response.json()) as { listings?: Listing[] }
        if (cancelled || !Array.isArray(data.listings)) return
        setRemoteListings(data.listings.filter((listing) => listing.isUserListing))
      } catch {
        // On the static beta host there is no API. Use the shared test store when
        // configured; otherwise the seeded catalogue + local storage still works.
        if (!sharedStoreEnabled) return
        const shared = await fetchSharedListings()
        if (!cancelled) setRemoteListings(shared)
      }
    }

    loadListings()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => writeStorage(LISTINGS_KEY, customListings), [customListings])
  useEffect(() => writeStorage(WISHLIST_KEY, wishlist), [wishlist])
  useEffect(() => writeStorage(BOOKINGS_KEY, bookings), [bookings])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      setToast({ id: Date.now(), message, tone })
      toastTimer.current = window.setTimeout(() => setToast(null), 3600)
    },
    [],
  )

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  const listings = useMemo(() => {
    const map = new Map<string, Listing>()
    for (const listing of seedListings) map.set(listing.id, listing)
    for (const listing of remoteListings) map.set(listing.id, listing)
    for (const listing of customListings) map.set(listing.id, listing)
    return [...map.values()]
  }, [customListings, remoteListings])

  const toggleWishlist = useCallback(
    (id: string) => {
      setWishlist((current) => {
        const saved = current.includes(id)
        notify(saved ? 'Removed from your saved items' : 'Saved for later', 'info')
        return saved ? current.filter((item) => item !== id) : [...current, id]
      })
    },
    [notify],
  )

  const addListing = useCallback(async (draft: ListingDraft) => {
    const localListing: Listing = {
      id: newId('user'),
      title: draft.title,
      subtitle: 'Listed by you',
      category: draft.category,
      pricePerDay: draft.pricePerDay,
      deposit: draft.deposit,
      image: draft.image || '/images/category-kids.webp',
      location: draft.location,
      distanceKm: 0,
      rating: 5,
      reviewCount: 0,
      owner: {
        name: currentUser.name,
        initials: currentUser.initials,
        since: '2026',
        responseTime: '~5 min',
        superhost: false,
      },
      condition: draft.condition,
      useCase: 'New listing',
      includes: 'See description',
      description: draft.description,
      features: ['New listing', 'Locally owned', 'Handover nearby'],
      handover: `Pickup from ${draft.location}. Coordinate on WhatsApp after the booking.`,
      badge: 'New listing',
      availableToday: draft.availableToday ?? true,
      isUserListing: true,
    }

    setCustomListings((current) => [localListing, ...current])

    let apiResponded = false
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, owner: currentUser }),
      })
      const contentType = response.headers.get('content-type') || ''
      // On a static-only host, /api/* often returns index.html. Treat that as
      // an unavailable API and fall through to local/shared storage.
      if (!contentType.includes('application/json')) throw new Error('API unavailable')
      apiResponded = true
      const data = (await response.json()) as { listing?: Listing; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not save the listing')
      if (data.listing) {
        setCustomListings((current) =>
          current.map((item) =>
            item.id === localListing.id ? { ...data.listing!, isUserListing: true } : item,
          ),
        )
        return { ...data.listing, isUserListing: true }
      }
    } catch (error) {
      if (apiResponded) {
        // The API is reachable but rejected the listing or image. Surface it so
        // the host does not believe a failed image upload was published.
        setCustomListings((current) => current.filter((item) => item.id !== localListing.id))
        throw error
      }
      // The static beta host has no server API; publish to the shared test store
      // when one is configured so other testers can see the listing.
      if (sharedStoreEnabled) {
        const shared = await saveSharedListing(localListing)
        if (shared) {
          setRemoteListings((current) => [shared, ...current.filter((item) => item.id !== shared.id)])
          return shared
        }
      }
    }

    return localListing
  }, [])

  const addBooking = useCallback((booking: Booking) => {
    setBookings((current) => [booking, ...current.filter((item) => item.id !== booking.id)])
    if (sharedStoreEnabled) {
      saveSharedBooking(booking).catch(() => undefined)
    }
  }, [])

  const getListing = useCallback(
    (id: string) => listings.find((listing) => listing.id === id),
    [listings],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      listings,
      wishlist,
      bookings,
      currentUser,
      toast,
      notify,
      dismissToast,
      toggleWishlist,
      addListing,
      addBooking,
      getListing,
    }),
    [
      listings,
      wishlist,
      bookings,
      toast,
      notify,
      dismissToast,
      toggleWishlist,
      addListing,
      addBooking,
      getListing,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
