import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import { Logo } from './Logo'
import { DEMO_WHATSAPP_NUMBER, whatsappLink } from '../lib'

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo light />
            <p>
              A neighbourhood rental marketplace for the things that don't need to be
              owned forever. Built in Bengaluru, for Bengaluru.
            </p>
            <a
              className="footer-whatsapp"
              href={whatsappLink('Hi RentHood! I have a question about the marketplace.')}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} />
              Chat with us on WhatsApp
            </a>
          </div>

          <div className="footer-column">
            <h3>Borrow</h3>
            <Link to="/browse?category=kids-toys">Kids toys</Link>
            <Link to="/browse?category=board-games">Board games</Link>
            <Link to="/browse?category=diy-tools">DIY & tools</Link>
            <Link to="/browse">All listings</Link>
          </div>

          <div className="footer-column">
            <h3>Earn</h3>
            <Link to="/list">List an item</Link>
            <Link to="/#earn">Earnings calculator</Link>
            <Link to="/dashboard">Host dashboard</Link>
            <Link to="/#how-it-works">How handovers work</Link>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <a href="#safety">Trust & safety</a>
            <a href="#faq">FAQs</a>
            <a href="mailto:hello@renthood.in">hello@renthood.in</a>
            <a href={`tel:+${DEMO_WHATSAPP_NUMBER}`}>+{DEMO_WHATSAPP_NUMBER}</a>
          </div>
        </div>

        <div className="footer-note">
          <span>
            <ShieldCheck size={15} /> Payments secured by Cashfree · Demo environment
          </span>
          <span>
            <MapPin size={15} /> Bengaluru, Karnataka
          </span>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} RentHood. Made for sharing.</p>
          <div>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#refunds">Refunds</a>
            <Link to="/list">
              List on RentHood <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
