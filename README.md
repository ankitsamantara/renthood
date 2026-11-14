# RentHood

**Good things, shared nearby.** A neighbourhood rental marketplace for Bengaluru
with three deliberately curated categories: **Kids Toys**, **Board Games** and
**Low-value DIY & Tools** (hammers, drills and small repair kits).

People can list things they already own, earn from them, and borrow from
neighbours. Bookings, refundable deposits and host payouts are designed around
**Cashfree Payments**, and every handover can be coordinated through a
prefilled **WhatsApp** message.

![RentHood homepage](docs/renthood-home.jpg)

## What works in this build

- **Curated marketplace** — browse, search and filter 10 seeded listings across
  the three supported categories.
- **Product pages** — availability dates, live price breakdown, deposit,
  owner profile, reviews, pickup notes and a WhatsApp enquiry link.
- **Cashfree checkout** — server-created orders with a Cashfree sandbox demo
  fallback when API keys are not configured. Demo payments complete the full
  booking flow without charging money.
- **List & earn flow** — 3-step listing wizard with category restriction,
  description, photo upload (optimised in-browser), price/deposit, earnings
  estimate, live card preview and WhatsApp listing handoff.
- **Host dashboard** — earnings chart, next pickup, recent rentals, listings,
  bookings, payouts and saved items.
- **WhatsApp links** — prefilled messages for listing an item, asking a host a
  question, or coordinating a confirmed pickup. No WhatsApp Business API account
  is required for these links.
- **PWA** — web app manifest, app icons, service worker and offline app-shell
  caching.
- **Responsive UI** — custom mobile navigation, filter bottom sheet, sticky
  booking card on desktop and a full-width booking-first layout on mobile.
- **Local API persistence** — listings, demo orders and bookings are saved to
  `server/db.json`. Wishlist, bookings and newly listed items also persist in
  the browser.

Demo account: **Aarav Mehta** (`aarav.mehta@example.com`). No authentication is
implemented — this is a front-end/product prototype, not a production identity
system.

---

### Preview

| Desktop listing | Mobile checkout |
| --- | --- |
| ![RentHood desktop listing](docs/renthood-listing.jpg) | ![RentHood mobile checkout](docs/renthood-checkout.jpg) |

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

- Web app: <http://localhost:5173>
- API: <http://localhost:8787>
- Health check: <http://localhost:8787/api/health>

`npm run dev` starts Vite and the Express API together. Vite proxies `/api` to
port `8787`.

### Production build

```bash
npm run build
npm start
```

`npm start` serves the API and the built `dist/` folder on
<http://localhost:8787>. Set `PORT` and `PUBLIC_APP_URL` for your deployment.

---

## Cashfree setup

Cashfree keys are **server-side only** and must never be exposed through Vite
(`VITE_*`) variables.

1. Create a merchant account at
   [Cashfree Payments](https://www.cashfree.com/payment-gateway-india/).
2. Create API keys in the Cashfree dashboard.
3. Add them to `.env`:

```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox
PUBLIC_APP_URL=http://localhost:5173
```

4. Restart the API. The checkout now creates a real Cashfree order through
   `POST /api/create-order` and opens the Cashfree JS SDK v3 checkout.
5. After payment, Cashfree returns to `/checkout/return?order_id=...`. The app
   calls `GET /api/verify-order`, verifies the order server-side and confirms the
   booking.

Without keys the server returns `mode: "demo"` and the UI runs a clearly labelled
sandbox payment sheet. **No money is charged in demo mode.**

Relevant server routes:

| Route | Purpose |
| --- | --- |
| `GET /api/listings` | Seeded + locally created listings |
| `POST /api/listings` | Validate and persist a new listing |
| `POST /api/create-order` | Price a rental and create a Cashfree / demo order |
| `POST /api/confirm-order` | Confirm a demo order (blocked for live orders) |
| `GET /api/verify-order?orderId=` | Verify a live Cashfree payment and create the booking |
| `GET /api/bookings` | Stored bookings |
| `GET /api/config` | Cashfree mode + WhatsApp number |

For production, add a **Cashfree webhook** endpoint and verify the signature
before marking an order as paid. Do not rely only on the browser return URL.
Also move deposit handling to a Cashfree-verified payout/refund workflow.

---

## WhatsApp setup

Set your support/host number in `.env` (international format, digits only):

```env
VITE_WHATSAPP_NUMBER=919876543210
```

The number is used to build `wa.me` links from:

- the floating “List on WhatsApp” button
- the listing wizard
- product enquiry buttons
- the booking confirmation screen
- the footer help link

The current implementation opens a chat with a prefilled message. For
automated WhatsApp notifications (booking created, return reminder, payout
sent), connect the WhatsApp Cloud API or a provider such as Twilio/Gupshup.

---

## Project structure

```text
shared/
  categories.json        # The only three categories
  listings.json          # Seed catalogue + host demo content
server/
  index.mjs              # Express API, Cashfree orders, verification, persistence
  db.json                # Generated at runtime (gitignored)
src/
  components/            # Header, cards, checkout modal, calculator, navigation
  pages/                 # Home, Browse, ListingDetail, ListItem, Dashboard,
                         # CheckoutReturn, NotFound
  store.tsx              # Listing, wishlist, booking and toast state
  lib.ts                 # Pricing, dates, image optimisation, WhatsApp helpers
  index.css              # Design system + responsive layout
public/
  images/                # Optimised local WebP photography
  manifest.webmanifest
  sw.js
  icon-192.png / icon-512.png
```

---

## Product rules

- Only **three categories** can be listed or borrowed: Kids Toys, Board Games,
  and DIY & Tools. The API and UI both enforce this.
- Daily rent + a refundable deposit is charged at checkout.
- RentHood's renter service fee is 6% (minimum ₹19); the host success fee is 10%.
- The deposit is refundable after the item is returned. In production this
  should be backed by a proper escrow/refund workflow.

## Before going live

This prototype intentionally ships without:

- Authentication, phone OTP and KYC verification
- A production database (SQLite/Postgres) and object storage for photos
- Cashfree webhook signature verification, refunds and payout KYC
- Real-time availability calendars / double-booking prevention
- Dispute resolution, damage cover and insurance
- Admin moderation queue for new listings

Those are the next engineering milestones; the UI and API boundaries are in
place to add them without redesigning the experience.
