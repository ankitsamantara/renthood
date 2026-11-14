import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dbFile = process.env.RENTHOOD_DB_FILE
  ? path.resolve(process.env.RENTHOOD_DB_FILE)
  : path.join(__dirname, 'db.json')

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'renthood-listing-images'
const STATE_ID = process.env.SUPABASE_STATE_ID || 'main'
const STATE_TABLE = 'renthood_state'

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

export function persistenceInfo() {
  return {
    metadata: hasSupabase ? 'supabase-postgres' : 'local-json',
    images: hasSupabase ? `supabase-storage:${SUPABASE_BUCKET}` : 'embedded-data-urls',
  }
}

function defaultDb() {
  return { listings: [], orders: [], bookings: [] }
}

function normalize(value) {
  if (!value || typeof value !== 'object') return defaultDb()
  return {
    listings: Array.isArray(value.listings) ? value.listings : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
    bookings: Array.isArray(value.bookings) ? value.bookings : [],
  }
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  }
}

async function supabaseFetch(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const error = new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 300)}`)
    error.status = response.status
    throw error
  }
  return response
}

async function readSupabaseDb() {
  const response = await supabaseFetch(
    `/rest/v1/${STATE_TABLE}?id=eq.${encodeURIComponent(STATE_ID)}&select=data`,
    { headers: { Accept: 'application/json' } },
  )
  const rows = await response.json()
  if (!Array.isArray(rows) || rows.length === 0) return defaultDb()
  return normalize(rows[0]?.data)
}

async function writeSupabaseDb(db) {
  await supabaseFetch(`/rest/v1/${STATE_TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: STATE_ID,
      data: db,
      updated_at: new Date().toISOString(),
    }),
  })
}

let writeQueue = Promise.resolve()

export async function readDb() {
  if (hasSupabase) return readSupabaseDb()
  try {
    const raw = await fs.promises.readFile(dbFile, 'utf8')
    return normalize(JSON.parse(raw))
  } catch {
    return defaultDb()
  }
}

export function writeDb(db) {
  if (hasSupabase) {
    // Serialize writes within this process. For a bigger launch, use row-level
    // optimistic locking or normalized tables.
    writeQueue = writeQueue.catch(() => undefined).then(() => writeSupabaseDb(db))
    return writeQueue
  }

  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    await fs.promises.mkdir(path.dirname(dbFile), { recursive: true })
    const temp = `${dbFile}.${process.pid}.tmp`
    await fs.promises.writeFile(temp, JSON.stringify(db, null, 2))
    await fs.promises.rename(temp, dbFile)
  })
  return writeQueue
}

/**
 * Accepts an optimised data URL from the browser, uploads it to Supabase
 * Storage, and returns the public image URL. Sample catalogue paths and
 * external URLs are left untouched. Without Supabase, the data URL is stored
 * inline so local development still works.
 */
export async function persistListingImage(image, listingId) {
  if (!hasSupabase) return image
  if (typeof image !== 'string' || !image.startsWith('data:image/')) return image

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(image)
  if (!match) throw new Error('Unsupported image data')

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 6 * 1024 * 1024) {
    throw new Error('Image must be under 6 MB after optimisation')
  }

  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'bin'
  const objectPath = `listings/${listingId}/${crypto.randomUUID()}.${ext}`
  const response = await supabaseFetch(
    `/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': mime,
        'x-upsert': 'false',
        'cache-control': 'max-age=31536000',
      },
      body: buffer,
    },
  )
  await response.text().catch(() => '')
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`
}
