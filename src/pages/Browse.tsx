import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Compass,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { CategoryIcon } from '../components/CategoryIcon'
import { useApp } from '../store'
import { categories, categoryBySlug, formatINR } from '../lib'
import type { CategorySlug } from '../types'

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating'

export function Browse() {
  const { listings } = useApp()
  const [params, setParams] = useSearchParams()
  const categoryParam = params.get('category') as CategorySlug | null
  const locationParam = params.get('location') ?? ''
  const initialQuery = params.get('q') ?? ''

  const [selectedCategory, setSelectedCategory] = useState<'all' | CategorySlug>(
    categoryParam && categoryBySlug[categoryParam] ? categoryParam : 'all',
  )
  const [selectedArea, setSelectedArea] = useState(locationParam)
  const [query, setQuery] = useState(initialQuery)
  const [maxPrice, setMaxPrice] = useState(400)
  const [maxDistance, setMaxDistance] = useState(0)
  const [availableToday, setAvailableToday] = useState(false)
  const [sort, setSort] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const areas = useMemo(
    () => [...new Set(listings.map((listing) => listing.location))].sort(),
    [listings],
  )

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    const result = listings.filter((listing) => {
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) return false
      if (selectedArea && listing.location !== selectedArea) return false
      if (listing.pricePerDay > maxPrice) return false
      if (maxDistance > 0 && listing.distanceKm > maxDistance) return false
      if (availableToday && !listing.availableToday) return false
      if (search) {
        const haystack = `${listing.title} ${listing.subtitle} ${listing.location} ${categoryBySlug[listing.category].name}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    return [...result].sort((a, b) => {
      if (sort === 'price-low') return a.pricePerDay - b.pricePerDay
      if (sort === 'price-high') return b.pricePerDay - a.pricePerDay
      if (sort === 'rating') return b.rating - a.rating
      return Number(b.availableToday) - Number(a.availableToday) || b.rating - a.rating
    })
  }, [listings, selectedCategory, selectedArea, maxPrice, maxDistance, availableToday, query, sort])

  const activeFilterCount =
    Number(selectedArea !== '') +
    Number(maxPrice < 400) +
    Number(maxDistance > 0) +
    Number(availableToday)

  function chooseCategory(category: 'all' | CategorySlug) {
    setSelectedCategory(category)
    const next = new URLSearchParams(params)
    if (category === 'all') next.delete('category')
    else next.set('category', category)
    setParams(next, { replace: true })
  }

  function resetFilters() {
    setSelectedCategory('all')
    setSelectedArea('')
    setQuery('')
    setMaxPrice(400)
    setMaxDistance(0)
    setAvailableToday(false)
    setSort('recommended')
    setParams({}, { replace: true })
  }

  const activeCategory = selectedCategory === 'all' ? null : categoryBySlug[selectedCategory]

  return (
    <main id="main" className="page-shell browse-page">
      <div className="container">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} /> Back home
        </Link>

        <div className="browse-head">
          <div>
            <span className="eyebrow">The local library</span>
            <h1>{activeCategory ? activeCategory.name : 'Things worth borrowing.'}</h1>
            <p>
              {activeCategory
                ? activeCategory.description
                : 'Only three categories, all quality-checked. Pick one up from a neighbour, use it well, bring it back.'}
            </p>
          </div>
          <div className="browse-head-mark">
            <Compass size={28} />
            <span>{listings.length} rentals<br />nearby</span>
          </div>
        </div>

        <div className="category-tabs" role="tablist" aria-label="Filter by category">
          <button
            type="button"
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => chooseCategory('all')}
            role="tab"
            aria-selected={selectedCategory === 'all'}
          >
            <Sparkles size={15} /> All finds
            <span>{listings.length}</span>
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.slug}
              className={selectedCategory === category.slug ? 'active' : ''}
              onClick={() => chooseCategory(category.slug)}
              role="tab"
              aria-selected={selectedCategory === category.slug}
            >
              <CategoryIcon icon={category.icon} size={15} /> {category.name}
              <span>{listings.filter((listing) => listing.category === category.slug).length}</span>
            </button>
          ))}
        </div>

        <div className="browse-toolbar">
          <label className="search-input">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search toys, games, drills…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </label>

          <button
            type="button"
            className="filter-toggle"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} /> Filters
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>

          <label className="sort-select">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        <div className="browse-layout">
          <aside className={filtersOpen ? 'filters-panel is-open' : 'filters-panel'}>
            <div className="filters-mobile-head">
              <strong>Filters</strong>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>

            <div className="filter-block">
              <div className="filter-title">
                <span>Category</span>
                <button type="button" onClick={resetFilters}>Reset</button>
              </div>
              <div className="filter-radio-list">
                <button
                  type="button"
                  className={selectedCategory === 'all' ? 'active' : ''}
                  onClick={() => chooseCategory('all')}
                >
                  <span>All categories</span>
                  <em>{listings.length}</em>
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.slug}
                    className={selectedCategory === category.slug ? 'active' : ''}
                    onClick={() => chooseCategory(category.slug)}
                  >
                    <span><CategoryIcon icon={category.icon} size={15} /> {category.name}</span>
                    <em>{listings.filter((listing) => listing.category === category.slug).length}</em>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="filter-title">
                <span>Pickup area</span>
              </div>
              <div className="filter-area-list">
                <button
                  type="button"
                  className={selectedArea === '' ? 'active' : ''}
                  onClick={() => setSelectedArea('')}
                >
                  Anywhere in Bengaluru
                </button>
                {areas.map((area) => (
                  <button
                    type="button"
                    key={area}
                    className={selectedArea === area ? 'active' : ''}
                    onClick={() => setSelectedArea(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="filter-title">
                <span>Max price / day</span>
                <strong>{formatINR(maxPrice)}</strong>
              </div>
              <input
                type="range"
                min="99"
                max="400"
                step="10"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="filter-range"
                aria-label="Maximum price per day"
              />
              <div className="range-labels"><span>₹99</span><span>₹400+</span></div>
            </div>

            <div className="filter-block">
              <div className="filter-title">
                <span>Distance</span>
                <strong>{maxDistance === 0 ? 'Any' : `${maxDistance} km`}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={maxDistance}
                onChange={(event) => setMaxDistance(Number(event.target.value))}
                className="filter-range"
                aria-label="Maximum distance"
              />
              <div className="range-labels"><span>Any</span><span>5 km</span></div>
            </div>

            <label className="filter-check">
              <input
                type="checkbox"
                checked={availableToday}
                onChange={(event) => setAvailableToday(event.target.checked)}
              />
              <span className="fake-check"><Check size={12} /></span>
              Available today
            </label>

            <button type="button" className="button button-primary filters-apply" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} rentals
            </button>
            <button type="button" className="filter-clear" onClick={resetFilters}>
              <RotateCcw size={13} /> Clear all filters
            </button>
          </aside>

          {filtersOpen && <div className="filters-backdrop" onClick={() => setFiltersOpen(false)} />}

          <div className="browse-results">
            <div className="results-meta">
              <p><strong>{filtered.length}</strong> {filtered.length === 1 ? 'find' : 'finds'} nearby</p>
              {selectedArea && (
                <button type="button" className="active-pill" onClick={() => setSelectedArea('')}>
                  {selectedArea} <X size={12} />
                </button>
              )}
              {activeFilterCount > 0 && (
                <button type="button" className="clear-inline" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {filtered.length > 0 ? (
              <div className="listing-grid browse-grid">
                {filtered.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span><Search size={26} /></span>
                <h2>No neighbours match that yet.</h2>
                <p>
                  Try widening your price range or distance — or ask us on WhatsApp
                  and we'll help you find it.
                </p>
                <button type="button" className="button button-primary" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            )}

            <div className="browse-note">
              <Sparkles size={17} />
              <p>
                <strong>We're deliberately small.</strong> Only three categories make it
                easier to keep quality high and handovers simple.
              </p>
              <Link to="/list">List your item</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
