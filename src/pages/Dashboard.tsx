import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Heart,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { useApp } from '../store'
import {
  addDays,
  bookingWhatsappLink,
  formatDate,
  formatDateRange,
  formatINR,
  toISODate,
} from '../lib'

type Tab = 'overview' | 'listings' | 'bookings' | 'payouts' | 'saved'

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', icon: ListChecks },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'saved', label: 'Saved', icon: Heart },
]

function offset(days: number) {
  return toISODate(addDays(new Date(), days))
}

const activity = [
  {
    id: 'act-1',
    title: 'DeWalt cordless drill',
    image: '/images/diy-drill.webp',
    renter: 'Ananya N.',
    initials: 'AN',
    start: offset(1),
    end: offset(4),
    status: 'Pickup tomorrow',
    amount: 1196,
  },
  {
    id: 'act-2',
    title: 'Catan — family edition',
    image: '/images/board-catan.webp',
    renter: 'Rhea S.',
    initials: 'RS',
    start: offset(6),
    end: offset(8),
    status: 'Confirmed',
    amount: 645,
  },
  {
    id: 'act-3',
    title: 'Vintage ride-on car',
    image: '/images/kids-car.webp',
    renter: 'Karan V.',
    initials: 'KV',
    start: offset(-9),
    end: offset(-6),
    status: 'Returned',
    amount: 1047,
  },
  {
    id: 'act-4',
    title: 'Home DIY tool kit',
    image: '/images/diy-tools.webp',
    renter: 'Maya D.',
    initials: 'MD',
    start: offset(-16),
    end: offset(-14),
    status: 'Returned',
    amount: 447,
  },
]

const months = [
  { label: 'Jun', value: 2600 },
  { label: 'Jul', value: 4100 },
  { label: 'Aug', value: 3500 },
  { label: 'Sep', value: 5200 },
  { label: 'Oct', value: 4800 },
  { label: 'Nov', value: 7240 },
]

export function Dashboard() {
  const { currentUser, listings, bookings, wishlist, notify } = useApp()
  const [params, setParams] = useSearchParams()
  const initialTab = params.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(
    initialTab && tabs.some((item) => item.id === initialTab) ? initialTab : 'overview',
  )
  const [payoutRequested, setPayoutRequested] = useState(false)

  const myListings = listings.filter((listing) => listing.isUserListing)
  const savedListings = listings.filter((listing) => wishlist.includes(listing.id))
  const upcoming = [...activity].filter((item) => item.status !== 'Returned')
  const currentBookingRows = bookings.map((booking) => ({
    id: booking.id,
    title: booking.listingTitle,
    image: booking.listingImage,
    renter: booking.customer.name,
    initials: booking.customer.name.split(' ').map((part) => part[0]).slice(0, 2).join(''),
    start: booking.start,
    end: booking.end,
    status: 'Confirmed',
    amount: booking.total,
  }))
  const allActivity = [...currentBookingRows, ...activity]

  function chooseTab(nextTab: Tab) {
    setTab(nextTab)
    const next = new URLSearchParams(params)
    if (nextTab === 'overview') next.delete('tab')
    else next.set('tab', nextTab)
    setParams(next, { replace: true })
  }

  function requestPayout() {
    setPayoutRequested(true)
    notify('Payout requested — ₹2,340 is on its way in 1–2 business days.')
  }

  return (
    <main id="main" className="page-shell dashboard-page">
      <div className="container">
        <div className="dashboard-head">
          <div>
            <span className="eyebrow">Your RentHood</span>
            <h1>Good to see you, {currentUser.name.split(' ')[0]}.</h1>
            <p>Here's what your shelf has been up to.</p>
          </div>
          <Link to="/list" className="button button-primary">
            <Plus size={17} /> List something new
          </Link>
        </div>

        <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
          {tabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.id}
                className={tab === item.id ? 'active' : ''}
                onClick={() => chooseTab(item.id)}
                role="tab"
                aria-selected={tab === item.id}
              >
                <Icon size={16} />
                {item.label}
                {item.id === 'saved' && wishlist.length > 0 && <span>{wishlist.length}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="dashboard-content">
            <div className="stat-grid">
              <article className="stat-card stat-card-dark">
                <span className="stat-icon"><IndianRupee size={18} /></span>
                <span className="stat-label">Earned this month</span>
                <strong>{formatINR(7240)}</strong>
                <span className="stat-trend up"><TrendingUp size={13} /> 24% vs October</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon stat-icon-yellow"><Package size={18} /></span>
                <span className="stat-label">Active listings</span>
                <strong>3</strong>
                <span className="stat-trend"><span className="live-dot" /> All visible nearby</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon stat-icon-coral"><CalendarDays size={18} /></span>
                <span className="stat-label">Upcoming rentals</span>
                <strong>{upcoming.length}</strong>
                <span className="stat-trend">Next pickup tomorrow</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon stat-icon-mint"><Star size={18} /></span>
                <span className="stat-label">Host rating</span>
                <strong>4.9</strong>
                <span className="stat-trend"><Star size={12} fill="currentColor" /> 38 reviews</span>
              </article>
            </div>

            <div className="dashboard-two-col">
              <section className="panel earnings-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">Earnings</span>
                    <h3>Last 6 months</h3>
                  </div>
                  <span className="panel-total">{formatINR(27440)} <em>all time</em></span>
                </div>
                <div className="chart">
                  <div className="chart-y">
                    <span>₹8k</span><span>₹6k</span><span>₹4k</span><span>₹2k</span><span>₹0</span>
                  </div>
                  <div className="chart-bars">
                    {months.map((month) => (
                      <div className="chart-bar-wrap" key={month.label}>
                        <div className="chart-bar-track">
                          <div
                            className={`chart-bar ${month.label === 'Nov' ? 'active' : ''}`}
                            style={{ height: `${(month.value / 8000) * 100}%` }}
                          >
                            <span>{formatINR(month.value)}</span>
                          </div>
                        </div>
                        <em>{month.label}</em>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-foot">
                  <span><TrendingUp size={14} /> Your best month yet</span>
                  <button type="button" onClick={() => chooseTab('payouts')}>View payouts <ArrowRight size={13} /></button>
                </div>
              </section>

              <section className="panel next-pickup-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">Next pickup</span>
                    <h3>Tomorrow, 10:00 am</h3>
                  </div>
                  <span className="status-pill status-confirmed">Confirmed</span>
                </div>
                <div className="pickup-feature">
                  <img src="/images/diy-drill.webp" alt="" />
                  <div>
                    <h4>DeWalt cordless drill</h4>
                    <p><CalendarDays size={13} /> {formatDateRange(offset(1), offset(4))}</p>
                    <p><MapPin size={13} /> Indiranagar pickup</p>
                  </div>
                </div>
                <div className="pickup-person">
                  <span className="avatar avatar-small">AN</span>
                  <div>
                    <span>Renting from you</span>
                    <strong>Ananya N.</strong>
                  </div>
                  <a
                    href={bookingWhatsappLink(
                      listings.find((listing) => listing.id === 'diy-dewalt-drill') ?? listings[0],
                      offset(1),
                      offset(4),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-ghost button-small"
                  >
                    <MessageCircle size={15} /> Chat
                  </a>
                </div>
                <div className="pickup-note">
                  <CheckCircle2 size={15} /> Deposit of ₹1,000 is held securely
                </div>
              </section>
            </div>

            <div className="dashboard-two-col dashboard-two-col-wide">
              <section className="panel activity-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">Recent activity</span>
                    <h3>Your rentals</h3>
                  </div>
                  <button type="button" className="text-link" onClick={() => chooseTab('bookings')}>
                    View all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="activity-list">
                  {allActivity.slice(0, 4).map((item) => (
                    <div className="activity-row" key={item.id}>
                      <img src={item.image} alt="" />
                      <div className="activity-main">
                        <strong>{item.title}</strong>
                        <span>{item.renter} · {formatDateRange(item.start, item.end)}</span>
                      </div>
                      <span className={`status-pill ${item.status === 'Returned' ? 'status-returned' : item.status === 'Pickup tomorrow' ? 'status-tomorrow' : 'status-confirmed'}`}>
                        {item.status}
                      </span>
                      <strong className="activity-amount">{formatINR(item.amount)}</strong>
                      <ChevronRight size={16} className="activity-chevron" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel tip-panel">
                <span className="tip-spark"><Sparkles size={20} /></span>
                <span className="eyebrow">Earn a little more</span>
                <h3>Open up next weekend.</h3>
                <p>
                  Saturdays are your busiest day. Listings with weekend availability
                  get booked 2.4× more often.
                </p>
                <Link to="/list" className="text-link">Update availability <ArrowRight size={14} /></Link>
                <div className="tip-illustration" aria-hidden="true">
                  <span>SAT</span><span>SUN</span>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <div className="dashboard-content">
            <div className="tab-head">
              <div>
                <h2>Your listings</h2>
                <p>{myListings.length > 0 ? `${myListings.length} live on RentHood` : 'Nothing live yet — your shelf is waiting.'}</p>
              </div>
              <Link to="/list" className="button button-primary"><Plus size={16} /> New listing</Link>
            </div>

            {myListings.length > 0 ? (
              <div className="listing-grid dashboard-listing-grid">
                {myListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <div className="dashboard-empty">
                <span><Package size={28} /></span>
                <h3>Your first listing could pay for itself this weekend.</h3>
                <p>Pick a category, add one photo and set your price. It takes about three minutes.</p>
                <Link to="/list" className="button button-primary">List your first item <ArrowRight size={16} /></Link>
              </div>
            )}

            <div className="listings-tip-row">
              <span><Sparkles size={16} /> Hosts with 2+ photos get 31% more bookings.</span>
              <Link to="/list">List another item <ArrowUpRight size={13} /></Link>
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="dashboard-content">
            <div className="tab-head">
              <div>
                <h2>Bookings</h2>
                <p>Incoming rentals, past and upcoming.</p>
              </div>
              <span className="tab-head-note"><ShieldCheckIcon /> Deposits protected</span>
            </div>

            <section className="panel bookings-panel">
              <div className="activity-list activity-list-large">
                {allActivity.map((item) => (
                  <div className="booking-row" key={item.id}>
                    <img src={item.image} alt="" />
                    <div className="booking-main">
                      <div>
                        <strong>{item.title}</strong>
                        <span className={`status-pill ${item.status === 'Returned' ? 'status-returned' : item.status === 'Pickup tomorrow' ? 'status-tomorrow' : 'status-confirmed'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p><CalendarDays size={13} /> {formatDate(item.start)} → {formatDate(item.end)}</p>
                      <p><span className="avatar avatar-tiny">{item.initials}</span> {item.renter}</p>
                    </div>
                    <div className="booking-amount">
                      <span>{item.status === 'Returned' ? 'Earned' : 'Booking total'}</span>
                      <strong>{formatINR(item.amount)}</strong>
                    </div>
                    <button type="button" className="round-action" aria-label="Booking details"><ChevronRight size={17} /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="dashboard-content">
            <div className="tab-head">
              <div>
                <h2>Payouts</h2>
                <p>Your earnings, minus the 10% success fee.</p>
              </div>
              <span className="tab-head-note"><BadgeCheck size={15} /> Verified account</span>
            </div>

            <div className="payout-grid">
              <section className="payout-balance">
                <span className="eyebrow eyebrow-light">Available to pay out</span>
                <strong>{formatINR(payoutRequested ? 0 : 2340)}</strong>
                <p>Includes rent from completed bookings. Deposits are never part of payouts.</p>
                <button
                  type="button"
                  className="button button-yellow"
                  disabled={payoutRequested}
                  onClick={requestPayout}
                >
                  {payoutRequested ? <><CheckCircle2 size={16} /> Payout requested</> : <><Banknote size={16} /> Request payout</>}
                </button>
                <span className="payout-method"><CreditCard size={14} /> HDFC Bank ···· 4821</span>
              </section>

              <section className="panel payout-history">
                <div className="panel-head">
                  <div><span className="eyebrow">History</span><h3>Recent payouts</h3></div>
                  <span className="panel-total">{formatINR(21940)} <em>this year</em></span>
                </div>
                <div className="payout-list">
                  <div><span><strong>Payout to HDFC ···· 4821</strong><small>1 Nov 2026 · UTR 8849201</small></span><strong>₹4,160</strong><em className="status-pill status-returned">Paid</em></div>
                  <div><span><strong>Payout to HDFC ···· 4821</strong><small>1 Oct 2026 · UTR 7720144</small></span><strong>₹3,870</strong><em className="status-pill status-returned">Paid</em></div>
                  <div><span><strong>Payout to HDFC ···· 4821</strong><small>1 Sep 2026 · UTR 6610288</small></span><strong>₹5,240</strong><em className="status-pill status-returned">Paid</em></div>
                </div>
              </section>
            </div>

            <div className="payout-note">
              <ShieldCheckIcon />
              <p>
                <strong>How payouts work.</strong> Once a borrower returns your item and the
                deposit is released, your rent (minus the 10% fee) is available to withdraw.
                Payouts reach your bank in 1–2 business days via Cashfree.
              </p>
            </div>
          </div>
        )}

        {tab === 'saved' && (
          <div className="dashboard-content">
            <div className="tab-head">
              <div>
                <h2>Saved for later</h2>
                <p>{savedListings.length} {savedListings.length === 1 ? 'item' : 'items'} on your shortlist.</p>
              </div>
              <Link to="/browse" className="button button-outline">Browse more <ArrowRight size={15} /></Link>
            </div>

            {savedListings.length > 0 ? (
              <div className="listing-grid dashboard-listing-grid">
                {savedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <div className="dashboard-empty">
                <span><Heart size={28} /></span>
                <h3>Nothing saved yet.</h3>
                <p>Tap the heart on any listing to keep it here for later.</p>
                <Link to="/browse" className="button button-primary">Find something good <ArrowRight size={16} /></Link>
              </div>
            )}
          </div>
        )}

        <div className="dashboard-settings">
          <span><Settings size={15} /> Demo account · {currentUser.email}</span>
          <span>Member since 2024</span>
        </div>
      </div>
    </main>
  )
}

function ShieldCheckIcon() {
  return <BadgeCheck size={15} />
}
