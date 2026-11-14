import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  PackageCheck,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { CheckoutModal } from '../components/CheckoutModal'
import { ListingCard } from '../components/ListingCard'
import { useApp } from '../store'
import {
  categoryBySlug,
  cn,
  defaultDates,
  formatINR,
  inquiryWhatsappLink,
  isValidDateRange,
  quoteFor,
  toISODate,
} from '../lib'

const reviews = [
  {
    name: 'Shruti',
    initials: 'SG',
    date: '2 weeks ago',
    text: 'Exactly as described and spotless. The handover took two minutes and the owner was so helpful with a quick demo.',
  },
  {
    name: 'Neil',
    initials: 'NM',
    date: '1 month ago',
    text: 'Super easy pickup and return. Much better than buying something I would use once. Would borrow from here again.',
  },
]

function nextWeekend() {
  const date = new Date()
  const day = date.getDay()
  const daysUntilSaturday = (6 - day + 7) % 7 || 7
  const saturday = new Date(date)
  saturday.setDate(date.getDate() + daysUntilSaturday)
  const sunday = new Date(saturday)
  sunday.setDate(saturday.getDate() + 1)
  return { start: toISODate(saturday), end: toISODate(sunday) }
}

export function ListingDetail() {
  const { id } = useParams()
  const { getListing, listings, wishlist, toggleWishlist, notify } = useApp()
  const listing = id ? getListing(id) : undefined
  const [dates, setDates] = useState(defaultDates)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [today] = useState(() => toISODate(new Date()))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  const validDates = isValidDateRange(dates.start, dates.end)
  const quote = useMemo(
    () => (listing ? quoteFor(listing, dates.start, dates.end) : null),
    [listing, dates],
  )

  if (!listing) {
    return (
      <main className="page-shell not-found">
        <div className="container">
          <span className="eyebrow">404</span>
          <h1>That item isn't here anymore.</h1>
          <p>It may have been unlisted. There are plenty more nearby.</p>
          <Link to="/browse" className="button button-primary">Browse rentals</Link>
        </div>
      </main>
    )
  }

  const category = categoryBySlug[listing.category]
  const saved = wishlist.includes(listing.id)
  const similar = listings
    .filter((item) => item.category === listing.category && item.id !== listing.id)
    .slice(0, 3)

  function updateDate(field: 'start' | 'end', value: string) {
    setDates((current) => {
      if (field === 'start' && value > current.end) {
        return { start: value, end: value }
      }
      return { ...current, [field]: value }
    })
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify('Listing link copied to clipboard', 'info')
    } catch {
      notify('Copy this page link to share it', 'info')
    }
  }

  return (
    <main id="main" className="page-shell listing-page">
      <div className="container">
        <div className="detail-breadcrumb">
          <Link to="/browse" className="back-link"><ArrowLeft size={15} /> All rentals</Link>
          <span>/</span>
          <Link to={`/browse?category=${listing.category}`}>{category.name}</Link>
          <span>/</span>
          <span>{listing.title}</span>
        </div>

        <div className="detail-head">
          <div>
            <span className="eyebrow">{category.name}</span>
            <h1>{listing.title}</h1>
            <div className="detail-meta">
              <span className="rating-inline">
                <Star size={14} fill="currentColor" /> {listing.rating.toFixed(1)}
                <em>({listing.reviewCount} reviews)</em>
              </span>
              <span><MapPin size={14} /> {listing.location} · {listing.distanceKm > 0 ? `${listing.distanceKm} km away` : 'Your area'}</span>
              <span><BadgeCheck size={14} /> {listing.condition}</span>
            </div>
          </div>
          <div className="detail-head-actions">
            <button type="button" className="round-action" onClick={share} aria-label="Share listing">
              <Share2 size={17} />
            </button>
            <button
              type="button"
              className={cn('round-action', saved && 'is-saved')}
              onClick={() => toggleWishlist(listing.id)}
              aria-label={saved ? 'Remove from saved' : 'Save listing'}
              aria-pressed={saved}
            >
              <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <figure className="detail-image">
              <img src={listing.image} alt={listing.title} />
              {listing.badge && <figcaption>{listing.badge}</figcaption>}
              <span className="detail-image-note"><Sparkles size={13} /> Checked & cleaned before pickup</span>
            </figure>

            <div className="detail-highlights">
              <div><span>Condition</span><strong>{listing.condition}</strong></div>
              <div><span>Best for</span><strong>{listing.useCase}</strong></div>
              <div><span>Included</span><strong>{listing.includes}</strong></div>
              <div><span>Pickup</span><strong>{listing.location}</strong></div>
            </div>

            <section className="detail-section">
              <h2>About this item</h2>
              <p>{listing.description}</p>
              <div className="feature-chips">
                {listing.features.map((feature) => (
                  <span key={feature}><Check size={13} /> {feature}</span>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2>Pickup & handover</h2>
              <div className="handover-card">
                <span className="handover-icon"><PackageCheck size={22} /></span>
                <div>
                  <strong>{listing.handover}</strong>
                  <p>
                    {listing.owner.name} usually replies in {listing.owner.responseTime.replace('~', '')}.
                    You'll get the exact address and phone number once your booking is confirmed.
                  </p>
                </div>
              </div>
              <div className="detail-info-grid">
                <div><Clock3 size={16} /><span><strong>Flexible pickup</strong>Coordinate a time that works after booking.</span></div>
                <div><ShieldCheck size={16} /><span><strong>Deposit protected</strong>{formatINR(listing.deposit)} held and refunded after return.</span></div>
                <div><Info size={16} /><span><strong>Return window</strong>Return by the last day of your booking.</span></div>
              </div>
            </section>

            <section className="detail-section">
              <div className="section-head-row detail-review-head">
                <h2>Neighbour reviews</h2>
                <span className="rating-inline"><Star size={15} fill="currentColor" /> {listing.rating.toFixed(1)} · {listing.reviewCount} reviews</span>
              </div>
              <div className="review-summary">
                <div className="review-score">
                  <strong>{listing.rating.toFixed(1)}</strong>
                  <div>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span>from {listing.reviewCount} neighbours</span>
                </div>
                <div className="review-bars">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star}>
                      <span>{star}</span>
                      <div><i style={{ width: star === 5 ? '86%' : star === 4 ? '11%' : '3%' }} /></div>
                      <em>{star === 5 ? '86%' : star === 4 ? '11%' : '3%'}</em>
                    </div>
                  ))}
                </div>
              </div>
              <div className="review-list">
                {reviews.map((review) => (
                  <article key={review.name} className="review-card">
                    <span className="avatar avatar-small">{review.initials}</span>
                    <div>
                      <div className="review-card-head">
                        <strong>{review.name}</strong>
                        <span>{review.date}</span>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={11} fill="currentColor" />
                        ))}
                      </div>
                      <p>{review.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="owner-card">
              <span className="avatar avatar-large">{listing.owner.initials}</span>
              <div className="owner-card-main">
                <span>Hosted by</span>
                <h3>{listing.owner.name}</h3>
                <p>
                  {listing.owner.superhost ? 'Super host · ' : ''}
                  Hosting since {listing.owner.since} · Replies {listing.owner.responseTime}
                </p>
                <div className="owner-badges">
                  <span><BadgeCheck size={13} /> ID verified</span>
                  <span><Star size={13} /> {listing.rating.toFixed(1)} host rating</span>
                  <span><MessageCircle size={13} /> WhatsApp handover</span>
                </div>
              </div>
              <a
                href={inquiryWhatsappLink(listing, dates.start, dates.end)}
                target="_blank"
                rel="noreferrer"
                className="button button-ghost"
              >
                Say hello
              </a>
            </section>
          </div>

          <aside className="booking-column">
            <div className="booking-card">
              <div className="booking-price">
                <div>
                  <strong>{formatINR(listing.pricePerDay)}</strong>
                  <span>/ day</span>
                </div>
                <span className="rating-inline"><Star size={13} fill="currentColor" /> {listing.rating.toFixed(1)}</span>
              </div>
              <p className="booking-deposit">+ {formatINR(listing.deposit)} refundable deposit</p>

              <div className="date-fields">
                <label>
                  <span>Pickup</span>
                  <input
                    type="date"
                    min={today}
                    value={dates.start}
                    onChange={(event) => updateDate('start', event.target.value)}
                  />
                </label>
                <label>
                  <span>Return</span>
                  <input
                    type="date"
                    min={dates.start || today}
                    value={dates.end}
                    onChange={(event) => updateDate('end', event.target.value)}
                  />
                </label>
              </div>

              <div className="quick-dates">
                <button type="button" onClick={() => setDates(defaultDates())}>3 days</button>
                <button
                  type="button"
                  onClick={() => {
                    const weekend = nextWeekend()
                    setDates(weekend)
                  }}
                >
                  This weekend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const startDate = new Date()
                    startDate.setDate(startDate.getDate() + 2)
                    setDates({
                      start: toISODate(startDate),
                      end: toISODate(new Date(startDate.getTime() + 6 * 86_400_000)),
                    })
                  }}
                >
                  1 week
                </button>
              </div>

              {!validDates && (
                <p className="date-error"><Info size={14} /> Choose a return date on or after pickup.</p>
              )}

              {quote && validDates && (
                <div className="booking-quote">
                  <div>
                    <span>{formatINR(listing.pricePerDay)} × {quote.days} {quote.days === 1 ? 'day' : 'days'}</span>
                    <strong>{formatINR(quote.subtotal)}</strong>
                  </div>
                  <div><span>Service fee</span><strong>{formatINR(quote.serviceFee)}</strong></div>
                  <div><span>Refundable deposit</span><strong>{formatINR(quote.deposit)}</strong></div>
                  <div className="booking-total"><span>Total</span><strong>{formatINR(quote.total)}</strong></div>
                </div>
              )}

              <button
                type="button"
                className="button button-primary booking-cta"
                disabled={!validDates}
                onClick={() => setCheckoutOpen(true)}
              >
                Reserve & pay <ArrowRight size={17} />
              </button>

              <a
                href={inquiryWhatsappLink(listing, dates.start, dates.end)}
                target="_blank"
                rel="noreferrer"
                className="button button-whatsapp booking-whatsapp"
              >
                <MessageCircle size={17} /> Ask on WhatsApp
              </a>

              <p className="booking-note">
                <Lock size={13} /> Secure payment via Cashfree. You won't be charged until the next step.
              </p>
              <p className="booking-cancel">
                <CalendarDays size={13} /> Free cancellation up to 48 hours before pickup
              </p>
            </div>

            <div className="booking-trust">
              <span><ShieldCheck size={17} /></span>
              <div>
                <strong>Deposit protection, included</strong>
                <p>Your deposit is held by RentHood and returned after the host confirms the return.</p>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="detail-similar">
            <div className="section-head section-head-row">
              <div>
                <span className="eyebrow">Keep looking</span>
                <h2>More in {category.name}.</h2>
              </div>
              <Link to={`/browse?category=${listing.category}`} className="text-link">
                View all <ChevronRight size={15} />
              </Link>
            </div>
            <div className="listing-grid similar-grid">
              {similar.map((item) => <ListingCard key={item.id} listing={item} />)}
            </div>
          </section>
        )}
      </div>

      {checkoutOpen && (
        <CheckoutModal
          listing={listing}
          start={dates.start}
          end={dates.end}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </main>
  )
}
