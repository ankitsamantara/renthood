import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  LoaderCircle,
  Lock,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import type { Booking } from '../types'
import { formatDateRange, formatINR } from '../lib'

type Status = 'loading' | 'paid' | 'failed' | 'pending' | 'error'

export function CheckoutReturn() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id') || params.get('orderId') || ''
  const [status, setStatus] = useState<Status>('loading')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orderId) {
      setStatus('error')
      setMessage('No order reference was found in the return link.')
      return
    }
    let cancelled = false
    fetch(`/api/verify-order?orderId=${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Could not verify this payment.')
        return data as { status: string; booking?: Booking }
      })
      .then((data) => {
        if (cancelled) return
        if (data.status === 'PAID') {
          setStatus('paid')
          setBooking(data.booking || null)
        } else if (data.status === 'ACTIVE' || data.status === 'CREATED') {
          setStatus('pending')
        } else {
          setStatus('failed')
        }
      })
      .catch((error: Error) => {
        if (cancelled) return
        setStatus('error')
        setMessage(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  return (
    <main id="main" className="page-shell return-page">
      <div className="container">
        <div className="return-card">
          {status === 'loading' && (
            <div className="processing-panel">
              <span className="processing-icon"><LoaderCircle size={30} className="spin" /></span>
              <span className="eyebrow">Checking with Cashfree</span>
              <h1>Confirming your payment…</h1>
              <p>This usually takes a few seconds. Please don't close this window.</p>
            </div>
          )}

          {status === 'paid' && (
            <>
              <span className="success-icon"><Check size={32} /></span>
              <span className="eyebrow">Payment successful</span>
              <h1>You're booked.</h1>
              <p>Cashfree confirmed your payment. Your pickup details are ready.</p>
              {booking && (
                <div className="success-receipt">
                  <div className="success-item">
                    <img src={booking.listingImage} alt="" />
                    <div>
                      <strong>{booking.listingTitle}</strong>
                      <span><CalendarDays size={13} /> {formatDateRange(booking.start, booking.end)}</span>
                    </div>
                    <span className="success-paid">Paid</span>
                  </div>
                  <div className="success-row"><span>Total paid</span><strong>{formatINR(booking.total)}</strong></div>
                  <div className="success-row"><span>Refundable deposit</span><strong>{formatINR(booking.deposit)}</strong></div>
                </div>
              )}
              <div className="return-actions">
                <Link to="/dashboard" className="button button-primary">View your bookings <ArrowRight size={16} /></Link>
                <Link to="/browse" className="button button-outline">Keep browsing</Link>
              </div>
              <p className="return-help"><MessageCircle size={14} /> Need help? Message us on WhatsApp.</p>
            </>
          )}

          {status === 'pending' && (
            <>
              <span className="processing-icon processing-pending"><LoaderCircle size={28} /></span>
              <span className="eyebrow">Payment pending</span>
              <h1>Cashfree hasn't confirmed it yet.</h1>
              <p>If money has left your account, it will be confirmed shortly. Don't pay again.</p>
              <div className="return-actions">
                <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
                  Check again
                </button>
                <Link to="/browse" className="button button-outline">Back to browse</Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <span className="processing-icon processing-error"><CircleAlert size={28} /></span>
              <span className="eyebrow">Payment not completed</span>
              <h1>That payment didn't go through.</h1>
              <p>No money has been taken. You can go back and try again with a different method.</p>
              <div className="return-actions">
                <Link to="/browse" className="button button-primary">Try another booking</Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="processing-icon processing-error"><CircleAlert size={28} /></span>
              <span className="eyebrow">Something's off</span>
              <h1>We couldn't verify that payment.</h1>
              <p>{message}</p>
              <div className="return-actions">
                <Link to="/dashboard" className="button button-primary">Go to your dashboard</Link>
                <Link to="/browse" className="button button-outline">Back to browse</Link>
              </div>
            </>
          )}

          <div className="return-trust">
            <span><Lock size={13} /> Secured by Cashfree</span>
            <span><ShieldCheck size={13} /> Deposits protected</span>
          </div>
        </div>
      </div>
    </main>
  )
}
