import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Search, Sparkles } from 'lucide-react'
import { categories } from '../lib'
import { CategoryIcon } from './CategoryIcon'

const areas = ['All Bengaluru', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Domlur', 'Jayanagar']

export function SearchBar() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [area, setArea] = useState(() => {
    const saved = localStorage.getItem('renthood:area')
    return saved && saved !== 'Bengaluru' ? saved : 'All Bengaluru'
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (area !== 'All Bengaluru') params.set('location', area)
    navigate(`/browse${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="search-wrap">
      <form className="search-card" onSubmit={submit}>
        <div className="search-field search-field-category">
          <label htmlFor="search-category">What do you need?</label>
          <div className="search-control">
            <Sparkles size={18} />
            <select
              id="search-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Anything nearby</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-divider" />

        <div className="search-field">
          <label htmlFor="search-area">Pickup near</label>
          <div className="search-control">
            <MapPin size={18} />
            <select id="search-area" value={area} onChange={(event) => setArea(event.target.value)}>
              {areas.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="search-submit" aria-label="Search listings">
          <Search size={20} />
          <span>Find it nearby</span>
        </button>
      </form>

      <div className="search-suggestions">
        <span>Popular right now</span>
        {categories.map((item) => (
          <button
            type="button"
            key={item.slug}
            onClick={() => navigate(`/browse?category=${item.slug}`)}
          >
            <CategoryIcon icon={item.icon} size={14} />
            {item.shortName}
            <ArrowRight size={12} />
          </button>
        ))}
      </div>
    </div>
  )
}
