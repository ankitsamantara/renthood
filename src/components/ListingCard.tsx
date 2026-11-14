import { Link } from 'react-router-dom'
import { Heart, MapPin, Star } from 'lucide-react'
import type { Listing } from '../types'
import { categoryBySlug, cn, formatINR } from '../lib'
import { useApp } from '../store'

export function ListingCard({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const { wishlist, toggleWishlist } = useApp()
  const saved = wishlist.includes(listing.id)
  const category = categoryBySlug[listing.category]

  return (
    <article className={cn('listing-card', compact && 'listing-card-compact')}>
      <div className="listing-card-media">
        <Link to={`/item/${listing.id}`} aria-label={`View ${listing.title}`}>
          <img src={listing.image} alt={listing.title} loading="lazy" />
        </Link>
        <div className="listing-card-badges">
          {listing.badge && !listing.isUserListing && <span className="listing-badge">{listing.badge}</span>}
          {listing.isUserListing && <span className="listing-badge listing-badge-own">Your listing</span>}
        </div>
        <button
          type="button"
          className={cn('heart-button', saved && 'is-saved')}
          aria-label={saved ? `Remove ${listing.title} from saved items` : `Save ${listing.title}`}
          aria-pressed={saved}
          onClick={() => toggleWishlist(listing.id)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <span className="listing-distance">
          <MapPin size={12} /> {listing.distanceKm > 0 ? `${listing.distanceKm} km` : listing.location}
        </span>
      </div>

      <div className="listing-card-body">
        <div className="listing-card-eyebrow">
          <span>{category.name}</span>
          <span className="rating-inline">
            <Star size={12} fill="currentColor" /> {listing.rating.toFixed(1)}
            <em>({listing.reviewCount})</em>
          </span>
        </div>
        <Link to={`/item/${listing.id}`} className="listing-title-link">
          <h3>{listing.title}</h3>
        </Link>
        <p className="listing-subtitle">{listing.subtitle}</p>

        <div className="listing-card-footer">
          <div className="price">
            <strong>{formatINR(listing.pricePerDay)}</strong>
            <span>/ day</span>
          </div>
          <div className="owner-mini">
            <span className="avatar avatar-small">{listing.owner.initials}</span>
            <span>{listing.owner.name.split(' ')[0]}</span>
          </div>
        </div>
        {listing.availableToday && <span className="available-dot">Available today</span>}
      </div>
    </article>
  )
}
