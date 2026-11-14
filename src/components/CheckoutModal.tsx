import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  LoaderCircle,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import type { Booking, Listing, OrderResponse } from '../types'
import {
  bookingWhatsappLink,
  formatDate,
  formatDateRange,
  formatINR,
  newId,
  quoteFor,
  shortOrderId,
  toISODate,
} from '../lib'
import { useApp } from '../store'

interface CashfreeCheckout {
  checkout(options: { paymentSessionId: string; redirectTarget: '_self' | '_blank' }): Promise<void>
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => CashfreeCheckout
  }
}

function loadCashfreeSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.Cashfree) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-cashfree-sdk]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Cashfree SDK failed to load')), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.dataset.cashfreeSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cashfree SDK failed to load'))
    document.head.appendChild(script)
  })
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function makeIcsFile(listing: Listing, start: string, end: string) {
  const stamp = (value: string) => value.replaceAll('-', '')
  const endDate = new Date(`${end}T23:59:00`)
  endDate.setDate(endDate.getDate() + 1)
  const endStamp = toISODate(endDate).replaceAll('-', '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RentHood//Rental booking//EN',
    'BEGIN:VEVENT',
    `UID:${listing.id}-${start}@renthood.in`,
    `DTSTAMP:${stamp(toISODate(new Date()))}T090000Z`,
    `DTSTART;VALUE=DATE:${stamp(start)}`,
    `DTEND;VALUE=DATE:${endStamp}`,
    `SUMMARY:RentHood pickup — ${listing.title}`,
    `LOCATION:${listing.location}, Bengaluru`,
    `DESCRIPTION:Pickup from ${listing.owner.name}. ${listing.handover}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

interface CheckoutModalProps {
  listing: Listing
  start: string
  end: string
  onClose: () => void
}

export function CheckoutModal({ listing, start, end, onClose }: CheckoutModalProps) {
  const { currentUser, addBooking } = useApp()
  const quote = useMemo(() => quoteFor(listing, start, end), [listing, start, end])
  const [stage, setStage] = useState<'details' | 'payment' | 'processing' | 'success' | 'error'>(
    'details',
  )
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [phone, setPhone] = useState(currentUser.phone.replace(/\s/g, ''))
  const [agreed, setAgreed] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [offlineDemo, setOfflineDemo] = useState(false)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi')

  const formValid =
    name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.replace(/\D/g, '').length >= 10 &&
    agreed

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !paying && !submitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, paying, submitting])

  async function launchCashfree(data: OrderResponse) {
    setStage('processing')
    try {
      await loadCashfreeSdk()
      if (!window.Cashfree) throw new Error('Cashfree checkout is unavailable')
      const cashfree = window.Cashfree({ mode: data.environment ?? 'sandbox' })
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId ?? '',
        redirectTarget: '_self',
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. You can retry, or use the sandbox demo below.`
          : 'Cashfree checkout could not be started.',
      )
      setStage('error')
    }
  }

  async function createOrder(event: FormEvent) {
    event.preventDefault()
    if (!formValid || submitting) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          start,
          end,
          customer: { name: name.trim(), email: email.trim(), phone: phone.replace(/\D/g, '') },
        }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Could not start the payment')
      }
      const data = (await response.json()) as OrderResponse
      setOrder(data)
      if (data.mode === 'cashfree') {
        await launchCashfree(data)
      } else {
        setStage('payment')
      }
    } catch {
      // The static demo remains fully usable when the API server is not running.
      const localOrder: OrderResponse = {
        mode: 'demo',
        orderId: newId('local'),
        amount: quote.total,
        quote,
      }
      setOrder(localOrder)
      setOfflineDemo(true)
      setStage('payment')
    } finally {
      setSubmitting(false)
    }
  }

  async function payDemo() {
    if (paying) return
    setPaying(true)
    setError('')
    await wait(1400)

    const newBooking: Booking = {
      id: newId('booking'),
      orderId: order?.orderId ?? newId('demo'),
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.image,
      start,
      end,
      days: quote.days,
      subtotal: quote.subtotal,
      serviceFee: quote.serviceFee,
      deposit: quote.deposit,
      total: quote.total,
      customer: { name: name.trim(), email: email.trim(), phone: phone.replace(/\D/g, '') },
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      mode: 'demo',
    }

    if (order && !order.orderId.startsWith('local-')) {
      fetch('/api/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId }),
      }).catch(() => undefined)
    }

    addBooking(newBooking)
    setBooking(newBooking)
    setPaying(false)
    setStage('success')
  }

  function retry() {
    setError('')
    setStage('details')
  }

  const content = (
    <div className="checkout-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !paying && !submitting) onClose()
    }}>
      <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button
          type="button"
          className="checkout-close"
          onClick={onClose}
          disabled={paying || submitting}
          aria-label="Close checkout"
        >
          <X size={20} />
        </button>

        {stage === 'success' && booking ? (
          <SuccessPanel
            listing={listing}
            booking={booking}
            start={start}
            end={end}
            onClose={onClose}
          />
        ) : (
          <div className="checkout-grid">
            <div className="checkout-main">
              <div className="checkout-brandbar">
                <span className="checkout-secure"><Lock size={13} /> Secure checkout</span>
                <span className="checkout-powered">Payments by <strong>cashfree</strong></span>
              </div>

              {stage === 'details' && (
                <>
                  <h2 id="checkout-title">Review your rental</h2>
                  <p className="checkout-lede">
                    You're booking with a real neighbour. Pickup details unlock after payment.
                  </p>

                  <div className="checkout-item">
                    <img src={listing.image} alt="" />
                    <div>
                      <span>{listing.condition} · {listing.location}</span>
                      <h3>{listing.title}</h3>
                      <p><CalendarDays size={14} /> {formatDateRange(start, end)} · {quote.days} {quote.days === 1 ? 'day' : 'days'}</p>
                    </div>
                  </div>

                  <form onSubmit={createOrder} className="checkout-form">
                    <h3 className="form-section-title">Your details</h3>
                    <div className="form-grid">
                      <label className="field">
                        <span>Full name</span>
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          autoComplete="name"
                          placeholder="Your name"
                        />
                      </label>
                      <label className="field">
                        <span>Phone number</span>
                        <div className="phone-field">
                          <span>+91</span>
                          <input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value.replace(/[^\d\s]/g, ''))}
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="98765 43210"
                          />
                        </div>
                      </label>
                      <label className="field field-full">
                        <span>Email for the receipt</span>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          autoComplete="email"
                          placeholder="you@example.com"
                        />
                      </label>
                    </div>

                    {error && <p className="form-error" role="alert">{error}</p>}

                    <label className="agreement">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(event) => setAgreed(event.target.checked)}
                      />
                      <span className="fake-check"><Check size={12} /></span>
                      <span>
                        I'll return the item by <strong>{formatDate(end, { day: 'numeric', month: 'short' })}</strong> and
                        accept the rental and deposit terms.
                      </span>
                    </label>

                    <div className="checkout-policy">
                      <span><ShieldCheck size={15} /> Deposit refunded after return</span>
                      <span><MessageCircle size={15} /> Handover support on WhatsApp</span>
                    </div>

                    <button
                      type="submit"
                      className="button button-primary checkout-pay-button"
                      disabled={!formValid || submitting}
                    >
                      {submitting ? (
                        <><LoaderCircle size={18} className="spin" /> Starting secure payment…</>
                      ) : (
                        <><Lock size={17} /> Continue to pay {formatINR(quote.total)}</>
                      )}
                    </button>
                    <p className="checkout-demo-note">
                      <Sparkles size={13} />
                      {offlineDemo
                        ? 'Running in offline demo mode — no payment will be taken.'
                        : 'Demo environment — Cashfree sandbox will not charge real money.'}
                    </p>
                  </form>
                </>
              )}

              {stage === 'payment' && (
                <div className="payment-panel">
                  <button type="button" className="back-link payment-back" onClick={() => setStage('details')}>
                    <ArrowLeft size={15} /> Back to details
                  </button>
                  <div className="payment-head">
                    <span className="cashfree-wordmark">cashfree<span>payments</span></span>
                    <span className="sandbox-pill">Sandbox</span>
                  </div>
                  <h2 id="checkout-title">Choose how to pay</h2>
                  <p className="checkout-lede">
                    Paying <strong>{formatINR(order?.amount ?? quote.total)}</strong> for{' '}
                    {listing.title}. This is a demo checkout — no money is charged.
                  </p>

                  <div className="payment-methods">
                    <button
                      type="button"
                      className={paymentMethod === 'upi' ? 'active' : ''}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <Smartphone size={18} /> UPI
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === 'card' ? 'active' : ''}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard size={18} /> Cards
                    </button>
                  </div>

                  {paymentMethod === 'upi' ? (
                    <div className="upi-apps">
                      <p className="payment-small-label">Pay with any UPI app</p>
                      <div className="upi-app-grid">
                        <button type="button"><i className="upi-icon upi-phonepe">P</i> PhonePe</button>
                        <button type="button"><i className="upi-icon upi-gpay">G</i> Google Pay</button>
                        <button type="button"><i className="upi-icon upi-paytm">P</i> Paytm</button>
                      </div>
                      <div className="upi-input">
                        <span>yourname@upi</span>
                        <button type="button">Verify</button>
                      </div>
                    </div>
                  ) : (
                    <div className="card-preview">
                      <span className="card-chip" />
                      <span className="card-number">•••• •••• •••• 4242</span>
                      <div><span>DEMO CARD</span><span>12/30</span></div>
                    </div>
                  )}

                  <div className="payment-order-meta">
                    <span>Order <strong>{shortOrderId(order?.orderId ?? '')}</strong></span>
                    <span>{formatDateRange(start, end)}</span>
                  </div>

                  <button
                    type="button"
                    className="button button-primary checkout-pay-button"
                    onClick={payDemo}
                    disabled={paying}
                  >
                    {paying ? (
                      <><LoaderCircle size={18} className="spin" /> Processing payment…</>
                    ) : (
                      <><Lock size={17} /> Pay {formatINR(order?.amount ?? quote.total)}</>
                    )}
                  </button>
                  <p className="checkout-demo-note">
                    <ShieldCheck size={13} /> Demo gateway · no card details are collected or stored
                  </p>
                </div>
              )}

              {stage === 'processing' && (
                <div className="processing-panel">
                  <span className="processing-icon"><LoaderCircle size={30} className="spin" /></span>
                  <h2 id="checkout-title">Opening Cashfree…</h2>
                  <p>Hold tight while we connect you to the secure payment window.</p>
                  <button type="button" className="text-link" onClick={() => setStage('details')}>
                    Cancel and go back
                  </button>
                </div>
              )}

              {stage === 'error' && (
                <div className="processing-panel">
                  <span className="processing-icon processing-error"><X size={26} /></span>
                  <h2 id="checkout-title">Payment couldn't start</h2>
                  <p>{error}</p>
                  <div className="processing-actions">
                    <button type="button" className="button button-primary" onClick={retry}>
                      Try again
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => {
                        setOrder({
                          mode: 'demo',
                          orderId: newId('local'),
                          amount: quote.total,
                          quote,
                        })
                        setOfflineDemo(true)
                        setStage('payment')
                      }}
                    >
                      Use demo checkout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="checkout-summary">
              <h3>Price details</h3>
              <div className="summary-row">
                <span>{formatINR(listing.pricePerDay)} × {quote.days} {quote.days === 1 ? 'day' : 'days'}</span>
                <strong>{formatINR(quote.subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Service fee</span>
                <strong>{formatINR(quote.serviceFee)}</strong>
              </div>
              <div className="summary-row summary-row-deposit">
                <span>
                  Refundable deposit
                  <small>Returned after the item is back</small>
                </span>
                <strong>{formatINR(quote.deposit)}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Due now</span>
                <strong>{formatINR(quote.total)}</strong>
              </div>
              <p className="summary-refund">
                <ShieldCheck size={14} /> {formatINR(quote.deposit)} comes back to you.
              </p>

              <div className="summary-host">
                <span className="avatar avatar-small">{listing.owner.initials}</span>
                <div>
                  <span>Hosted by</span>
                  <strong>{listing.owner.name}</strong>
                  {listing.owner.superhost && <em><BadgeCheck size={11} /> Super host</em>}
                </div>
              </div>

              <div className="summary-handover">
                <span><CalendarDays size={14} /> Pickup</span>
                <p>{listing.location} · details after payment</p>
              </div>

              <div className="payment-logos">
                <span>UPI</span>
                <span>VISA</span>
                <span>Mastercard</span>
                <span>RuPay</span>
              </div>
              <p className="summary-secure"><Lock size={12} /> 256-bit encrypted · PCI-DSS compliant</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

function SuccessPanel({
  listing,
  booking,
  start,
  end,
  onClose,
}: {
  listing: Listing
  booking: Booking
  start: string
  end: string
  onClose: () => void
}) {
  return (
    <div className="success-panel">
      <div className="success-burst" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <i key={index} />
        ))}
      </div>
      <span className="success-icon"><Check size={32} /></span>
      <span className="eyebrow">Booking confirmed</span>
      <h2 id="checkout-title">You're booked.<br /><em>Nice choice.</em></h2>
      <p className="success-copy">
        We've sent the receipt to your email. {listing.owner.name.split(' ')[0]} has
        been notified and pickup details are below.
      </p>

      <div className="success-receipt">
        <div className="success-item">
          <img src={listing.image} alt="" />
          <div>
            <strong>{listing.title}</strong>
            <span>{formatDateRange(start, end)} · {booking.days} {booking.days === 1 ? 'day' : 'days'}</span>
          </div>
          <span className="success-paid">Paid</span>
        </div>
        <div className="success-row"><span>Paid today</span><strong>{formatINR(booking.total)}</strong></div>
        <div className="success-row"><span>Refundable deposit</span><strong>{formatINR(booking.deposit)}</strong></div>
        <div className="success-row"><span>Order ID</span><strong className="mono">{booking.orderId.slice(-12).toUpperCase()}</strong></div>
      </div>

      <div className="pickup-card">
        <span className="pickup-icon"><BadgeCheck size={20} /></span>
        <div>
          <span>Pickup from</span>
          <strong>{listing.owner.name}</strong>
          <p>{listing.handover}</p>
          <small><Phone size={12} /> Number shared on WhatsApp after confirmation</small>
        </div>
      </div>

      <div className="success-actions">
        <a
          href={bookingWhatsappLink(listing, start, end)}
          target="_blank"
          rel="noreferrer"
          className="button button-whatsapp"
        >
          <MessageCircle size={17} /> Message host on WhatsApp
        </a>
        <a
          className="button button-outline"
          href={makeIcsFile(listing, start, end)}
          download="renthood-pickup.ics"
        >
          <Download size={16} /> Add to calendar
        </a>
      </div>

      <div className="success-links">
        <Link to="/dashboard" onClick={onClose}>View your bookings <ChevronRight size={14} /></Link>
        <button type="button" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
