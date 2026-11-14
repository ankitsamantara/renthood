import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { useApp } from '../store'

const neighbourhoods = ['All Bengaluru', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Domlur', 'Jayanagar']

export function Header() {
  const { wishlist, currentUser } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [area, setArea] = useState(() => localStorage.getItem('renthood:area') || 'Bengaluru')
  const locationRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const route = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    setLocationOpen(false)
  }, [route.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  useEffect(() => {
    function closeLocation(event: MouseEvent) {
      if (!locationRef.current?.contains(event.target as Node)) setLocationOpen(false)
    }
    document.addEventListener('mousedown', closeLocation)
    return () => document.removeEventListener('mousedown', closeLocation)
  }, [])

  function chooseArea(nextArea: string) {
    const label = nextArea === 'All Bengaluru' ? 'Bengaluru' : nextArea
    setArea(label)
    localStorage.setItem('renthood:area', label)
    setLocationOpen(false)
    navigate(`/browse?location=${encodeURIComponent(label)}`)
  }

  return (
    <>
      <div className="announcement">
        <div className="container announcement-inner">
          <p>
            <Sparkles size={14} />
            <span>Founding host offer: zero listing fees for the first 50 hosts.</span>
          </p>
          <Link to="/list">
            Claim your spot <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Logo />

          <nav className="desktop-nav" aria-label="Primary navigation">
            <NavLink to="/browse">Browse</NavLink>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#earn">Earn from your things</Link>
          </nav>

          <div className="header-actions">
            <div className="location-wrap" ref={locationRef}>
              <button
                type="button"
                className="location-button"
                aria-expanded={locationOpen}
                onClick={() => setLocationOpen((open) => !open)}
              >
                <MapPin size={15} />
                <span>{area}</span>
                <ChevronDown size={13} />
              </button>
              {locationOpen && (
                <div className="location-popover">
                  <p className="popover-label">Where are you looking?</p>
                  {neighbourhoods.map((place) => (
                    <button
                      type="button"
                      key={place}
                      className={place === 'All Bengaluru' ? 'active' : ''}
                      onClick={() => chooseArea(place)}
                    >
                      {place}
                    </button>
                  ))}
                  <span className="popover-note">More neighbourhoods coming soon.</span>
                </div>
              )}
            </div>

            <Link to="/browse" className="icon-button header-search" aria-label="Search items">
              <Search size={19} />
            </Link>

            <Link to="/dashboard?tab=saved" className="icon-button saved-button" aria-label="Saved items">
              <Heart size={19} />
              {wishlist.length > 0 && <span className="icon-count">{wishlist.length}</span>}
            </Link>

            <Link to="/list" className="button button-primary header-list-button">
              <Plus size={17} />
              List an item
            </Link>

            <Link to="/dashboard" className="avatar avatar-header" aria-label="Your account">
              {currentUser.initials}
            </Link>

            <button
              type="button"
              className="icon-button mobile-menu-button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-inner">
            <p className="mobile-drawer-label">Explore RentHood</p>
            <NavLink to="/" end>
              Home <ArrowUpRight size={18} />
            </NavLink>
            <NavLink to="/browse">
              Browse everything <ArrowUpRight size={18} />
            </NavLink>
            <NavLink to="/list">
              List an item <ArrowUpRight size={18} />
            </NavLink>
            <NavLink to="/dashboard">
              Your dashboard <ArrowUpRight size={18} />
            </NavLink>
            <div className="mobile-drawer-location">
              <MapPin size={17} />
              <div>
                <span>Current area</span>
                <strong>{area}</strong>
              </div>
              <button type="button" onClick={() => chooseArea('All Bengaluru')}>
                Change
              </button>
            </div>
            <Link to="/list" className="button button-primary mobile-drawer-cta">
              <Plus size={18} /> List something you own
            </Link>
            <p className="mobile-drawer-foot">Toys · Board games · DIY tools</p>
          </div>
        </div>
      )}
    </>
  )
}
