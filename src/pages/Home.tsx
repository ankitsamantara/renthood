import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleCheck,
  HeartHandshake,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from 'lucide-react'
import { SearchBar } from '../components/SearchBar'
import { CategoryIcon } from '../components/CategoryIcon'
import { ListingCard } from '../components/ListingCard'
import { EarningsCalculator } from '../components/EarningsCalculator'
import { useApp } from '../store'
import { categories, formatINR } from '../lib'

const featuredIds = [
  'diy-dewalt-drill',
  'board-catan-family',
  'kids-wooden-train-set',
  'board-game-night-box',
  'kids-lego-creative-box',
  'board-chess-sheesham',
  'diy-hammer-drill-kit',
  'kids-ride-on-car',
]

export function Home() {
  const { listings } = useApp()
  const featured = featuredIds
    .map((id) => listings.find((listing) => listing.id === id))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))

  return (
    <>
      <main id="main">
        <section className="hero">
          <div className="hero-grain" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-pill fade-up">
                <span className="live-dot" />
                Bengaluru's neighbourhood rental library
              </div>
              <h1 className="fade-up delay-1">
                Good things,
                <br />
                <em>shared</em> nearby.
              </h1>
              <p className="hero-lede fade-up delay-2">
                Borrow toys, board games and DIY tools from people around the corner.
                Or earn from the things your home has outgrown — without buying
                another shelf.
              </p>
              <div className="hero-actions fade-up delay-3">
                <Link to="/browse" className="button button-primary button-lg">
                  Explore nearby <ArrowRight size={18} />
                </Link>
                <Link to="/list" className="button button-ghost button-lg">
                  <PlusBadge /> Earn from your things
                </Link>
              </div>
              <div className="hero-proof fade-up delay-4">
                <div className="avatar-stack" aria-hidden="true">
                  <span>MS</span>
                  <span>RK</span>
                  <span>FQ</span>
                  <span>ST</span>
                </div>
                <div>
                  <div className="hero-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={12} fill="currentColor" />
                    ))}
                    <strong>4.9</strong>
                  </div>
                  <p>1,200+ neighbourly rentals and counting</p>
                </div>
              </div>
            </div>

            <div className="hero-visual fade-up delay-2">
              <div className="hero-shape hero-shape-yellow" />
              <div className="hero-shape hero-shape-coral" />
              <svg className="hero-squiggle" viewBox="0 0 140 70" fill="none" aria-hidden="true">
                <path
                  d="M3 49C22 9 41 7 52 30c8 17-4 33-14 24-12-11 8-39 35-41 18-1 34 8 50 2"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              <figure className="hero-photo">
                <img
                  src="/images/hero.webp"
                  alt="A child playing with colourful toys at home"
                />
                <figcaption>
                  <MapPin size={13} /> Indiranagar · 0.8 km away
                </figcaption>
              </figure>

              <div className="hero-mini-card">
                <img src="/images/diy-drill.webp" alt="" />
                <div>
                  <span>DeWalt cordless drill</span>
                  <strong>{formatINR(299)} <em>/ day</em></strong>
                </div>
                <span className="hero-mini-arrow">
                  <ArrowUpRight size={16} />
                </span>
              </div>

              <div className="hero-sticker">
                <span>From your shelf</span>
                <strong>to your pocket</strong>
                <ArrowUpRight size={18} />
              </div>

              <div className="hero-float-pill">
                <BadgeCheck size={16} />
                Verified neighbours
              </div>
            </div>
          </div>

          <div className="container">
            <SearchBar />
          </div>

          <div className="container trust-strip">
            <span><ShieldCheck size={17} /> Deposit protected</span>
            <span><Lock size={17} /> Cashfree-secured payments</span>
            <span><HeartHandshake size={17} /> Local pickup, no shipping</span>
            <span><Check size={17} /> Every listing reviewed</span>
          </div>
        </section>

        <section className="section categories-section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Small by design</span>
                <h2>Three categories. Zero clutter.</h2>
              </div>
              <p>
                We're not trying to rent you everything. Just the things neighbours
                actually need — and the things gathering dust in your home.
              </p>
            </div>

            <div className="category-grid">
              {categories.map((category, index) => (
                <Link
                  key={category.slug}
                  to={`/browse?category=${category.slug}`}
                  className={`category-card category-${category.accent}`}
                >
                  <img src={category.image} alt="" loading="lazy" />
                  <div className="category-overlay" />
                  <div className="category-top">
                    <span className="category-number">0{index + 1}</span>
                    <span className="category-count">
                      <CategoryIcon icon={category.icon} size={14} />
                      {category.count} nearby
                    </span>
                  </div>
                  <div className="category-content">
                    <h3>{category.name}</h3>
                    <p>{category.tagline}</p>
                    <div className="category-foot">
                      <span>From {formatINR(category.startingAt)}/day</span>
                      <span className="category-arrow"><ArrowUpRight size={18} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section listings-section">
          <div className="container">
            <div className="section-head section-head-row">
              <div>
                <span className="eyebrow">Around the corner</span>
                <h2>Good finds, close to home.</h2>
              </div>
              <Link to="/browse" className="text-link">
                Browse all {listings.length} rentals <ArrowRight size={16} />
              </Link>
            </div>

            <div className="listing-grid home-listing-grid">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div className="listings-footnote">
              <span><Sparkles size={15} /> New things are added by neighbours every day.</span>
              <Link to="/list">Have something to list? <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        <section className="section how-section" id="how-it-works">
          <div className="container how-grid">
            <div className="how-copy">
              <span className="eyebrow">How it works</span>
              <h2>Renting, without the awkward bits.</h2>
              <p className="how-lede">
                No stranger DMs. No cash guesswork. Just a clear booking, a secure
                payment and a friendly handover nearby.
              </p>

              <div className="step-list">
                <div className="step-item">
                  <span className="step-number">01</span>
                  <div>
                    <h3>Find it two streets away</h3>
                    <p>Filter by category and neighbourhood. Every listing is checked by a real person.</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">02</span>
                  <div>
                    <h3>Book and pay in one go</h3>
                    <p>Rent and the refundable deposit are paid safely through Cashfree. Pickup details unlock instantly.</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">03</span>
                  <div>
                    <h3>Meet, borrow, return</h3>
                    <p>Sort the handover on WhatsApp. Return by the date and your deposit comes back.</p>
                  </div>
                </div>
              </div>

              <Link to="/browse" className="text-link">
                Find your first borrow <ArrowRight size={16} />
              </Link>
            </div>

            <div className="chat-composition">
              <div className="chat-blob" />
              <div className="chat-card">
                <div className="chat-header">
                  <div className="chat-avatar">FQ</div>
                  <div>
                    <strong>Farhan · DeWalt drill</strong>
                    <span><span className="online-dot" /> Usually replies in 5 min</span>
                  </div>
                  <MessageCircle size={19} />
                </div>
                <div className="chat-body">
                  <span className="chat-date">Today · Handover</span>
                  <div className="chat-bubble chat-bubble-system">
                    <span className="chat-check"><CircleCheck size={14} /></span>
                    <div>
                      <strong>Booking confirmed</strong>
                      <p>Fri 21 Nov · 10:00 am · ₹299 rent + ₹1,000 deposit</p>
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-them">
                    <p>All bits are in the case. I'm home after 6 — just ring the bell!</p>
                    <span>6:04 pm</span>
                  </div>
                  <div className="chat-bubble chat-bubble-me">
                    <p>Perfect, see you in 10. Thanks Farhan!</p>
                    <span>6:05 pm · Read</span>
                  </div>
                  <div className="chat-typing">
                    <span /><span /><span /> Farhan is typing
                  </div>
                </div>
                <div className="chat-input">
                  <span>Message on WhatsApp</span>
                  <button type="button" aria-label="Send message"><ArrowUpRight size={17} /></button>
                </div>
              </div>
              <div className="chat-badge chat-badge-top">
                <MessageCircle size={15} /> Handover sorted on WhatsApp
              </div>
              <div className="chat-badge chat-badge-bottom">
                <Lock size={15} /> Payment held safely until pickup
              </div>
            </div>
          </div>
        </section>

        <section className="section earn-section" id="earn">
          <div className="container earn-shell">
            <div className="earn-copy">
              <span className="eyebrow eyebrow-yellow">For hosts</span>
              <h2>Your shelf is an <em>income stream.</em></h2>
              <p>
                That drill you use twice a year? The board game everyone has already
                played? List it once, set your own dates, and let the neighbourhood
                make better use of it.
              </p>

              <ul className="earn-list">
                <li><CircleCheck size={18} /> Free to list — we only earn when you do.</li>
                <li><CircleCheck size={18} /> You set the price, dates and handover spot.</li>
                <li><CircleCheck size={18} /> Deposits are collected upfront and refunded after return.</li>
                <li><CircleCheck size={18} /> Payouts land in your bank via Cashfree.</li>
              </ul>

              <div className="earn-host-note">
                <span className="avatar">MS</span>
                <p>
                  “I've rented my daughter's train set four times already.
                  It paid for her next birthday gift.”
                  <strong>Meera, Indiranagar · Host since 2024</strong>
                </p>
              </div>
            </div>

            <EarningsCalculator />
          </div>
        </section>

        <section className="section safety-section" id="safety">
          <div className="container">
            <div className="section-head section-head-row">
              <div>
                <span className="eyebrow">Trust, built in</span>
                <h2>Every borrow, backed.</h2>
              </div>
              <p>Borrowing from a neighbour should feel as easy as borrowing a cup of sugar.</p>
            </div>

            <div className="trust-grid">
              <article className="trust-card">
                <span className="trust-icon trust-icon-green"><BadgeCheck size={23} /></span>
                <h3>Verified neighbours</h3>
                <p>Phone and ID checks, real reviews, and a community that shows up. No anonymous warehouses.</p>
                <span className="trust-foot">Every profile reviewed</span>
              </article>
              <article className="trust-card">
                <span className="trust-icon trust-icon-yellow"><ShieldCheck size={23} /></span>
                <h3>Deposits, protected</h3>
                <p>The refundable deposit is collected upfront, held securely, and returned after the item comes back.</p>
                <span className="trust-foot">Return window included</span>
              </article>
              <article className="trust-card">
                <span className="trust-icon trust-icon-coral"><Lock size={23} /></span>
                <h3>Payments by Cashfree</h3>
                <p>UPI, cards and netbanking. Payments are encrypted and handled by Cashfree — never by strangers.</p>
                <span className="trust-foot">PCI-DSS compliant</span>
              </article>
              <article className="trust-card">
                <span className="trust-icon trust-icon-mint"><MapPin size={23} /></span>
                <h3>Local, in person</h3>
                <p>Pick up nearby, meet your neighbour, check the item together. The way borrowing should be.</p>
                <span className="trust-foot">Bengaluru-first</span>
              </article>
            </div>
          </div>
        </section>

        <section className="section testimonials-section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Neighbourly notes</span>
                <h2>Loved by borrowers and hosts.</h2>
              </div>
            </div>
            <div className="testimonial-grid">
              <article className="testimonial testimonial-cream">
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill="currentColor" />
                  ))}
                </div>
                <blockquote>
                  “I needed a drill for exactly one bookshelf. Twenty minutes of use,
                  one lovely neighbour, zero new clutter.”
                </blockquote>
                <div className="testimonial-author">
                  <span className="avatar avatar-coral">AN</span>
                  <p><strong>Ananya N.</strong><span>Borrower · Indiranagar</span></p>
                </div>
              </article>
              <article className="testimonial testimonial-yellow">
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill="currentColor" />
                  ))}
                </div>
                <blockquote>
                  “Our Catan has been rented three weekends in a row. It's officially
                  the most social thing in our apartment.”
                </blockquote>
                <div className="testimonial-author">
                  <span className="avatar avatar-green">KM</span>
                  <p><strong>Kabir M.</strong><span>Host · Indiranagar</span></p>
                </div>
              </article>
              <article className="testimonial testimonial-mint">
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill="currentColor" />
                  ))}
                </div>
                <blockquote>
                  “Booked in two minutes, pickup details on WhatsApp, returned the
                  next morning. This is how renting should work.”
                </blockquote>
                <div className="testimonial-author">
                  <span className="avatar avatar-coral">RS</span>
                  <p><strong>Rhea S.</strong><span>Borrower · Koramangala</span></p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container faq-grid">
            <div>
              <span className="eyebrow">Good questions</span>
              <h2>The small print,<br />without the fine print.</h2>
              <p className="faq-lede">
                Everything you need to know before your first borrow or your first listing.
              </p>
              <a
                href="https://wa.me/919876543210?text=Hi%20RentHood!%20I%20have%20a%20question."
                className="text-link"
                target="_blank"
                rel="noreferrer"
              >
                Ask us on WhatsApp <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="faq-list">
              <details open>
                <summary>Why only three categories?</summary>
                <p>
                  Because quality beats quantity. Toys, board games and small DIY tools
                  are high-use, low-frequency things that are perfect to share. We
                  inspect every listing and keep the standard high.
                </p>
              </details>
              <details>
                <summary>How does the deposit work?</summary>
                <p>
                  You pay the refundable deposit along with your rent at checkout. It is
                  held securely and returned to you after the host confirms the item is
                  back in the same condition. Any issue is handled by our support team.
                </p>
              </details>
              <details>
                <summary>Can I list something via WhatsApp?</summary>
                <p>
                  Yes. Tap “List on WhatsApp” anywhere on the site and we'll start a
                  prefilled chat. Send a photo, your price and pickup area — our team
                  will help you get the listing live.
                </p>
              </details>
              <details>
                <summary>Is Cashfree live on this site?</summary>
                <p>
                  This build runs Cashfree in sandbox mode until production keys are
                  added. Payments are simulated in the checkout so you can test the
                  entire booking flow without being charged.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <div className="final-cta-card">
              <div className="final-cta-copy">
                <span className="eyebrow">Your neighbourhood is ready</span>
                <h2>Your next project is<br /><em>two streets away.</em></h2>
                <p>Borrow better. Buy less. Earn from what you already own.</p>
                <div className="final-cta-actions">
                  <Link to="/browse" className="button button-primary button-lg">
                    Start browsing <ArrowRight size={18} />
                  </Link>
                  <Link to="/list" className="button button-outline button-lg">
                    List an item <ArrowUpRight size={17} />
                  </Link>
                </div>
              </div>
              <div className="final-cta-art" aria-hidden="true">
                <div className="cta-price-tag">
                  <span>Rent from</span>
                  <strong>{formatINR(99)}<em>/day</em></strong>
                </div>
                <div className="cta-emoji cta-emoji-one">🧸</div>
                <div className="cta-emoji cta-emoji-two">🎲</div>
                <div className="cta-emoji cta-emoji-three">🔧</div>
                <div className="cta-orbit" />
                <div className="cta-trust"><ShieldCheck size={14} /> Secure by Cashfree</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function PlusBadge() {
  return (
    <span className="plus-badge">
      <Store size={15} />
    </span>
  )
}
