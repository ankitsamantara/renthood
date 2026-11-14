import { Link } from 'react-router-dom'

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="13" fill="currentColor" />
      <path
        d="M12.5 28.5V18.4c0-3.5 2.8-6.4 6.3-6.4 3.1 0 5.7 2.2 6.2 5.2"
        stroke="#F7F2E5"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="27.8" cy="13.5" r="3.3" fill="#F2C24E" />
    </svg>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="RentHood home">
      <LogoMark />
      <span className="brand-word">
        renthood<span className="brand-dot">.</span>
      </span>
    </Link>
  )
}
