import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Heart, Home, LayoutDashboard, Plus } from 'lucide-react'
import { useApp } from '../store'
import { whatsappLink } from '../lib'

export function MobileNav() {
  const { wishlist } = useApp()

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <NavLink to="/" end aria-label="Home">
        <Home size={21} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/browse" aria-label="Browse">
        <Compass size={21} />
        <span>Browse</span>
      </NavLink>
      <NavLink to="/list" className="mobile-nav-list" aria-label="List an item">
        <span className="mobile-nav-plus">
          <Plus size={22} />
        </span>
        <span>List</span>
      </NavLink>
      <NavLink to="/dashboard?tab=saved" aria-label="Saved">
        <span className="mobile-nav-icon-wrap">
          <Heart size={21} />
          {wishlist.length > 0 && <i>{wishlist.length}</i>}
        </span>
        <span>Saved</span>
      </NavLink>
      <NavLink to="/dashboard" aria-label="Dashboard">
        <LayoutDashboard size={21} />
        <span>Account</span>
      </NavLink>
    </nav>
  )
}

export function WhatsAppFab() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/item/') || pathname === '/list') return null

  return (
    <a
      href={whatsappLink("Hi RentHood! I'd like to list an item. Here are a few details about what I own:")}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-fab"
      aria-label="List an item with WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.04 3.2c-7.06 0-12.8 5.72-12.8 12.77 0 2.25.6 4.44 1.73 6.38L3.2 28.8l6.64-1.74a12.8 12.8 0 0 0 6.19 1.58h.01c7.06 0 12.8-5.73 12.8-12.78 0-3.41-1.33-6.62-3.75-9.03a12.69 12.69 0 0 0-9.05-3.63Zm0 23.36h-.01a10.63 10.63 0 0 1-5.41-1.48l-.39-.23-4.02 1.05 1.08-3.92-.25-.4a10.58 10.58 0 0 1-1.63-5.66c0-5.87 4.78-10.64 10.64-10.64 2.84 0 5.51 1.11 7.51 3.12a10.56 10.56 0 0 1 3.11 7.53c0 5.87-4.78 10.63-10.63 10.63Zm5.84-7.96c-.32-.16-1.9-.94-2.19-1.04-.3-.11-.51-.16-.72.16-.21.32-.83 1.04-1.01 1.26-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.63-.52-.55-.72-.56h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.68s1.15 3.11 1.31 3.32c.16.21 2.27 3.47 5.5 4.86.77.33 1.37.53 1.84.68.77.25 1.48.21 2.04.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z"
        />
      </svg>
      <span className="whatsapp-fab-label">List on WhatsApp</span>
    </a>
  )
}
