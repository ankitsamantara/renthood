import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Check,
  CircleCheck,
  ImagePlus,
  Info,
  LoaderCircle,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { CategoryIcon } from '../components/CategoryIcon'
import { ListingCard } from '../components/ListingCard'
import { useApp } from '../store'
import {
  categories,
  categoryBySlug,
  formatINR,
  listingWhatsappLink,
  optimizeImage,
  whatsappLink,
} from '../lib'
import type { CategorySlug, Listing, ListingDraft } from '../types'

const conditions = ['Like new', 'Excellent', 'Very good', 'Good', 'Gently used']
const areas = ['Indiranagar', 'Koramangala', 'HSR Layout', 'Domlur', 'Jayanagar', 'Ulsoor', 'Whitefield']

const samplePhotos: Record<CategorySlug, string[]> = {
  'kids-toys': ['/images/kids-train.webp', '/images/kids-lego.webp', '/images/kids-car.webp', '/images/kids-play.webp'],
  'board-games': ['/images/board-catan.webp', '/images/board-chess.webp', '/images/board-night.webp'],
  'diy-tools': ['/images/diy-drill.webp', '/images/diy-hammerdrill.webp', '/images/diy-hammer.webp', '/images/diy-tools.webp'],
}

const suggestedPrices: Record<CategorySlug, { price: number; deposit: number }> = {
  'kids-toys': { price: 199, deposit: 600 },
  'board-games': { price: 129, deposit: 400 },
  'diy-tools': { price: 249, deposit: 800 },
}

export function ListItem() {
  const { addListing, currentUser, notify } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialCategory = params.get('category') as CategorySlug | null
  const validInitialCategory =
    initialCategory && categoryBySlug[initialCategory] ? initialCategory : null

  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<CategorySlug | null>(validInitialCategory)
  const [title, setTitle] = useState('')
  const [condition, setCondition] = useState('Very good')
  const [area, setArea] = useState('Indiranagar')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(
    validInitialCategory ? suggestedPrices[validInitialCategory].price : 199,
  )
  const [deposit, setDeposit] = useState(
    validInitialCategory ? suggestedPrices[validInitialCategory].deposit : 600,
  )
  const [availability, setAvailability] = useState(true)
  const [terms, setTerms] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState<Listing | null>(null)
  const [uploadedName, setUploadedName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedCategory = category ? categoryBySlug[category] : null
  const fallbackImage = selectedCategory?.image ?? '/images/category-kids.webp'
  const previewImage = image || fallbackImage
  const estimatedEarnings = Math.round(price * 8 * 0.9)

  const previewListing = useMemo<Listing>(
    () => ({
      id: 'preview',
      title: title || (selectedCategory ? `Your ${selectedCategory.shortName.toLowerCase()} listing` : 'Your item'),
      subtitle: 'Your listing preview',
      category: category ?? 'kids-toys',
      pricePerDay: price,
      deposit,
      image: previewImage,
      location: area,
      distanceKm: 0,
      rating: 5,
      reviewCount: 0,
      owner: {
        name: currentUser.name,
        initials: currentUser.initials,
        since: '2026',
        responseTime: '~5 min',
        superhost: false,
      },
      condition,
      useCase: 'Your item',
      includes: 'You decide',
      description: description || 'Your description will appear here.',
      features: ['Locally owned', 'Handover nearby', 'Flexible dates'],
      handover: `Pickup from ${area}.`,
      badge: 'New listing',
      availableToday: availability,
      isUserListing: true,
    }),
    [title, category, price, deposit, previewImage, area, currentUser, condition, description, selectedCategory, availability],
  )

  const canContinue =
    step === 1
      ? Boolean(category)
      : step === 2
        ? title.trim().length >= 4 && description.trim().length >= 20
        : terms && price > 0

  const whatsappMessage = [
    'Hi RentHood! I want to list an item.',
    '',
    `Item: ${title || 'Not decided yet'}`,
    `Category: ${selectedCategory?.name ?? 'Not selected'}`,
    `Price: ${formatINR(price)}/day`,
    `Deposit: ${formatINR(deposit)}`,
    `Pickup: ${area}`,
    description ? `Description: ${description}` : '',
    '',
    'Can you help me get it live?',
  ]
    .filter(Boolean)
    .join('\n')

  function chooseCategory(next: CategorySlug) {
    setCategory(next)
    setPrice(suggestedPrices[next].price)
    setDeposit(suggestedPrices[next].deposit)
    setError('')
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('That image is over 8 MB. Try a smaller one.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const optimized = await optimizeImage(file)
      setImage(optimized)
      setUploadedName(file.name)
    } catch {
      setError('We could not read that image. Try another one.')
    } finally {
      setUploading(false)
    }
  }

  async function publish() {
    if (!category || !terms) return
    setPublishing(true)
    setError('')
    try {
      const draft: ListingDraft = {
        title: title.trim(),
        category,
        pricePerDay: price,
        deposit,
        location: area,
        condition,
        description: description.trim(),
        image: previewImage,
        availableToday: availability,
      }
      const listing = await addListing(draft)
      setPublished(listing)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      notify('Your listing is live! Time to earn from it.')
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong while publishing. Please try again.',
      )
    } finally {
      setPublishing(false)
    }
  }

  if (published) {
    return (
      <main id="main" className="page-shell list-success-page">
        <div className="container">
          <div className="publish-success">
            <div className="publish-confetti" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => <i key={index} />)}
            </div>
            <span className="success-icon"><Check size={30} /></span>
            <span className="eyebrow">You're live</span>
            <h1>Your listing is<br /><em>ready to earn.</em></h1>
            <p>
              “{published.title}” is now visible to neighbours in {published.location}.
              We'll ping you on WhatsApp when someone books.
            </p>
            <div className="publish-success-card">
              <img src={published.image} alt="" />
              <div>
                <span className="eyebrow">{categoryBySlug[published.category].name}</span>
                <h3>{published.title}</h3>
                <p>{formatINR(published.pricePerDay)} / day · {formatINR(published.deposit)} deposit</p>
              </div>
              <span className="live-pill"><span /> Live</span>
            </div>
            <div className="publish-success-actions">
              <Link to={`/item/${published.id}`} className="button button-primary">
                View your listing <ArrowUpRight size={17} />
              </Link>
              <Link to="/dashboard" className="button button-outline">Go to dashboard</Link>
              <a
                href={listingWhatsappLink(published)}
                target="_blank"
                rel="noreferrer"
                className="button button-whatsapp"
              >
                <MessageCircle size={17} /> Share on WhatsApp
              </a>
            </div>
            <div className="publish-success-tips">
              <strong>Three things that help it get booked</strong>
              <span><CircleCheck size={15} /> Reply to enquiries within an hour</span>
              <span><CircleCheck size={15} /> Keep your weekend availability open</span>
              <span><CircleCheck size={15} /> A clear pickup note builds trust</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className="page-shell list-page">
      <div className="container">
        <Link to="/" className="back-link"><ArrowLeft size={15} /> Back home</Link>

        <div className="list-head">
          <div>
            <span className="eyebrow">Become a host</span>
            <h1>List it. <em>Earn from it.</em></h1>
            <p>
              Your shelf has more value than you think. List in about 3 minutes —
              we'll handle the payments, deposits and the awkward bits.
            </p>
          </div>
          <div className="list-head-note">
            <span className="list-head-note-icon"><BadgeCheck size={18} /></span>
            <div>
              <strong>Free to list</strong>
              <span>10% only when you earn</span>
            </div>
          </div>
        </div>

        <div className="list-layout">
          <div className="list-form-card">
            <div className="stepper">
              {[1, 2, 3].map((item) => (
                <div key={item} className={step >= item ? 'stepper-item active' : 'stepper-item'}>
                  <span>{step > item ? <Check size={14} /> : item}</span>
                  <div>
                    <strong>{item === 1 ? 'Category' : item === 2 ? 'Details' : 'Price & publish'}</strong>
                    <small>{item === 1 ? 'What are you listing?' : item === 2 ? 'Tell neighbours about it' : 'Set your terms'}</small>
                  </div>
                  {item < 3 && <i />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="form-step">
                <div className="form-step-head">
                  <span className="step-kicker">Step 1 of 3</span>
                  <h2>What are you listing?</h2>
                  <p>We keep RentHood to three categories so every listing gets the attention it deserves.</p>
                </div>

                <div className="category-choice-grid">
                  {categories.map((item) => (
                    <button
                      type="button"
                      key={item.slug}
                      className={category === item.slug ? 'category-choice active' : 'category-choice'}
                      onClick={() => chooseCategory(item.slug)}
                    >
                      <span className={`category-choice-icon category-choice-${item.accent}`}>
                        <CategoryIcon icon={item.icon} size={25} />
                      </span>
                      <strong>{item.name}</strong>
                      <p>{item.tagline}</p>
                      <span className="category-choice-meta">
                        From {formatINR(item.startingAt)}/day
                      </span>
                      <span className="choice-check"><Check size={13} /></span>
                    </button>
                  ))}
                </div>

                <div className="form-note">
                  <Info size={16} />
                  <p><strong>Why only three?</strong> Toys, games and small tools are easy to hand over, simple to check and genuinely useful to share. Fewer categories, better rentals.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="form-step-head">
                  <span className="step-kicker">Step 2 of 3</span>
                  <h2>Tell neighbours about it.</h2>
                  <p>A clear description and one good photo are all it takes.</p>
                </div>

                <div className="form-grid">
                  <label className="field field-full">
                    <span>Listing title</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={category === 'diy-tools' ? 'e.g. Bosch cordless drill + bits' : category === 'board-games' ? 'e.g. Catan family edition' : 'e.g. Wooden train set'}
                      maxLength={70}
                    />
                    <em>{title.length}/70</em>
                  </label>
                  <label className="field">
                    <span>Condition</span>
                    <select value={condition} onChange={(event) => setCondition(event.target.value)}>
                      {conditions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Pickup area</span>
                    <select value={area} onChange={(event) => setArea(event.target.value)}>
                      {areas.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>Description</span>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What's included, how it's been looked after, and anything a borrower should know."
                      maxLength={500}
                    />
                    <em>{description.length}/500</em>
                  </label>
                </div>

                <div className="photo-upload-block">
                  <div className="photo-upload-head">
                    <div>
                      <span>Photo</span>
                      <small>One clear, well-lit photo helps most.</small>
                    </div>
                    {image && (
                      <button type="button" className="remove-photo" onClick={() => { setImage(''); setUploadedName('') }}>
                        <X size={13} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="photo-upload-row">
                    <div className="photo-preview">
                      <img src={previewImage} alt="Listing preview" />
                      {!image && <span>Sample photo</span>}
                    </div>
                    <div className="photo-controls">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        hidden
                      />
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <><LoaderCircle size={16} className="spin" /> Optimising…</> : <><Upload size={16} /> Upload a photo</>}
                      </button>
                      <span className="photo-hint">
                        {uploadedName ? <><Camera size={13} /> {uploadedName}</> : 'JPG or PNG, up to 8 MB. Cropped to fit.'}
                      </span>
                    </div>
                  </div>

                  {category && (
                    <div className="sample-photos">
                      <span>Or use a sample photo</span>
                      <div>
                        {samplePhotos[category].map((photo) => (
                          <button
                            type="button"
                            key={photo}
                            className={image === photo ? 'active' : ''}
                            onClick={() => { setImage(photo); setUploadedName('') }}
                          >
                            <img src={photo} alt="" />
                            {image === photo && <span><Check size={12} /></span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <div className="form-step-head">
                  <span className="step-kicker">Step 3 of 3</span>
                  <h2>Set your price.</h2>
                  <p>You can change this any time. Not sure? Start a little lower to get your first reviews.</p>
                </div>

                <div className="price-setter">
                  <div className="price-setter-display">
                    <span>Your daily rent</span>
                    <strong>{formatINR(price)}<em>/day</em></strong>
                  </div>
                  <input
                    type="range"
                    min="49"
                    max="499"
                    step="10"
                    value={price}
                    onChange={(event) => setPrice(Number(event.target.value))}
                    aria-label="Daily rent"
                  />
                  <div className="range-labels"><span>₹49</span><span>₹499</span></div>
                  <div className="price-presets">
                    {[99, 149, 199, 249, 299, 349].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className={price === preset ? 'active' : ''}
                        onClick={() => setPrice(preset)}
                      >
                        {formatINR(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Refundable deposit</span>
                    <select value={deposit} onChange={(event) => setDeposit(Number(event.target.value))}>
                      {[0, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500].map((value) => (
                        <option key={value} value={value}>{value === 0 ? 'No deposit' : formatINR(value)}</option>
                      ))}
                    </select>
                    <small>A higher deposit is common for power tools.</small>
                  </label>
                  <div className="earn-preview">
                    <span>Estimated monthly earnings</span>
                    <strong>{formatINR(estimatedEarnings)}</strong>
                    <small>If rented 8 days a month, after 10% fee</small>
                  </div>
                </div>

                <label className="availability-toggle">
                  <div>
                    <strong>Available from today</strong>
                    <small>Neighbours can book pickup dates right away.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(event) => setAvailability(event.target.checked)}
                  />
                  <span className="toggle-switch"><i /></span>
                </label>

                <label className="agreement publish-agreement">
                  <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                  <span className="fake-check"><Check size={12} /></span>
                  <span>
                    I own this item, it's in the condition described, and I agree to the
                    host terms and the 10% success fee.
                  </span>
                </label>

                <div className="publish-actions">
                  <button
                    type="button"
                    className="button button-primary button-lg"
                    onClick={publish}
                    disabled={!canContinue || publishing}
                  >
                    {publishing ? <><LoaderCircle size={18} className="spin" /> Publishing…</> : <>Publish listing <ArrowUpRight size={18} /></>}
                  </button>
                  <a
                    href={whatsappLink(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-whatsapp button-lg"
                  >
                    <MessageCircle size={18} /> List via WhatsApp
                  </a>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <p className="publish-fineprint">
                  <ShieldCheck size={13} /> Free to publish. We collect payment, deposit and payout for you.
                </p>
              </div>
            )}

            <div className="form-nav">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => (step === 1 ? navigate('/') : setStep((value) => value - 1))}
              >
                <ArrowLeft size={16} /> {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 && (
                <button
                  type="button"
                  className="button button-primary"
                  disabled={!canContinue}
                  onClick={() => setStep((value) => value + 1)}
                >
                  Continue <ArrowRight size={17} />
                </button>
              )}
            </div>
          </div>

          <aside className="list-side">
            <div className="preview-panel">
              <div className="preview-panel-head">
                <span><Sparkles size={14} /> Live preview</span>
                <em>How neighbours will see it</em>
              </div>
              <ListingCard listing={previewListing} compact />
            </div>

            <div className="list-help-card">
              <span className="list-help-icon"><MessageCircle size={20} /></span>
              <h3>Rather just chat?</h3>
              <p>
                Send us a photo and a price on WhatsApp. We'll help you write the
                listing and get it online.
              </p>
              <a
                href={whatsappLink(whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                List via WhatsApp <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="list-trust">
              <span><ShieldCheck size={16} /> Verified borrowers</span>
              <span><Lock size={16} /> Cashfree payments</span>
              <span><ImagePlus size={16} /> Free photo help</span>
            </div>

            <div className="host-tip">
              <span className="eyebrow eyebrow-light">Host tip</span>
              <p>“A photo against a plain wall gets twice the clicks. It takes 10 seconds.”</p>
              <span>— The RentHood team</span>
            </div>
          </aside>
        </div>

        <div className="list-bottom-note">
          <div>
            <span className="eyebrow">What happens next</span>
            <h2>From shelf to booked, simply.</h2>
          </div>
          <div className="next-steps">
            <div><span>01</span><p><strong>We review it</strong>Most listings go live within an hour.</p></div>
            <div><span>02</span><p><strong>Neighbours book</strong>You get a WhatsApp message for every request.</p></div>
            <div><span>03</span><p><strong>You get paid</strong>Payouts land in your bank after handover.</p></div>
          </div>
        </div>
      </div>
    </main>
  )
}
