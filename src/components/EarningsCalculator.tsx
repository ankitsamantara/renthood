import { useState } from 'react'
import { ArrowUpRight, Info, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories, categoryBySlug, formatINR } from '../lib'
import { CategoryIcon } from './CategoryIcon'
import type { CategorySlug } from '../types'

const suggestedPrices: Record<CategorySlug, number> = {
  'kids-toys': 249,
  'board-games': 149,
  'diy-tools': 299,
}

export function EarningsCalculator() {
  const [category, setCategory] = useState<CategorySlug>('diy-tools')
  const [days, setDays] = useState(8)
  const [price, setPrice] = useState(299)
  const estimate = Math.round(price * days * 0.9)

  function pickCategory(next: CategorySlug) {
    setCategory(next)
    setPrice(suggestedPrices[next])
  }

  return (
    <div className="calculator">
      <div className="calculator-head">
        <span className="eyebrow eyebrow-light">Earnings calculator</span>
        <span className="calculator-live">
          <span /> Live estimate
        </span>
      </div>

      <h3>What could your shelf earn?</h3>

      <div className="calculator-category-tabs">
        {categories.map((item) => (
          <button
            type="button"
            key={item.slug}
            className={category === item.slug ? 'active' : ''}
            onClick={() => pickCategory(item.slug)}
          >
            <CategoryIcon icon={item.icon} size={15} />
            {item.shortName}
          </button>
        ))}
      </div>

      <div className="calculator-control">
        <div className="calculator-label">
          <span>Days rented per month</span>
          <strong>{days} days</strong>
        </div>
        <div className="range-wrap">
          <button
            type="button"
            aria-label="Decrease rental days"
            onClick={() => setDays((value) => Math.max(1, value - 1))}
          >
            <Minus size={13} />
          </button>
          <input
            type="range"
            min="1"
            max="20"
            value={days}
            aria-label="Days rented per month"
            onChange={(event) => setDays(Number(event.target.value))}
          />
          <button
            type="button"
            aria-label="Increase rental days"
            onClick={() => setDays((value) => Math.min(20, value + 1))}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="calculator-control">
        <div className="calculator-label">
          <span>Your daily price</span>
          <strong>{formatINR(price)}</strong>
        </div>
        <div className="range-wrap">
          <button
            type="button"
            aria-label="Decrease daily price"
            onClick={() => setPrice((value) => Math.max(49, value - 10))}
          >
            <Minus size={13} />
          </button>
          <input
            type="range"
            min="49"
            max="499"
            step="10"
            value={price}
            aria-label="Daily rental price"
            onChange={(event) => setPrice(Number(event.target.value))}
          />
          <button
            type="button"
            aria-label="Increase daily price"
            onClick={() => setPrice((value) => Math.min(499, value + 10))}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="calculator-result">
        <div>
          <span>You could earn</span>
          <strong>{formatINR(estimate)}<em>/mo</em></strong>
        </div>
        <span className="calculator-note">
          after 10% fee
          <small>{formatINR(price)} × {days} days</small>
        </span>
      </div>

      <Link to={`/list?category=${category}`} className="button button-yellow calculator-cta">
        List a {categoryBySlug[category].shortName.toLowerCase()} item
        <ArrowUpRight size={17} />
      </Link>

      <p className="calculator-disclaimer">
        <Info size={13} /> An estimate, not a promise. You choose when your item is available.
      </p>
    </div>
  )
}
