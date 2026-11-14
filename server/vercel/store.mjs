import { BlobPreconditionFailedError, get, put } from '@vercel/blob'

const STATE_PATH = process.env.RENTHOOD_STATE_PATH || 'renthood/state.json'
const BLOB_ACCESS = process.env.RENTHOOD_BLOB_ACCESS === 'public' ? 'public' : 'private'
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const MAX_WRITE_ATTEMPTS = 5

// A process-local fallback keeps local unit tests and first deploys usable before
// a Blob store is connected. The cloud deployment connects Blob for shared state.
const memory = (globalThis.__renthoodMemoryState ??= {
  listings: [],
  orders: [],
  bookings: [],
  updatedAt: null,
})

function emptyState() {
  return { listings: [], orders: [], bookings: [], updatedAt: null }
}

function normalize(value) {
  if (!value || typeof value !== 'object') return emptyState()
  return {
    listings: Array.isArray(value.listings) ? value.listings : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
    bookings: Array.isArray(value.bookings) ? value.bookings : [],
    updatedAt: value.updatedAt || null,
  }
}

export function persistenceMode() {
  return TOKEN ? 'vercel-blob' : 'memory'
}

export async function readState() {
  if (!TOKEN) {
    return { state: structuredClone(memory), etag: null, mode: 'memory' }
  }

  const result = await get(STATE_PATH, {
    access: BLOB_ACCESS,
    token: TOKEN,
    useCache: false,
  })

  if (!result) {
    return { state: emptyState(), etag: null, mode: 'vercel-blob' }
  }

  const raw = await new Response(result.stream).text()
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = emptyState()
  }

  return {
    state: normalize(parsed),
    etag: result.blob.etag || null,
    mode: 'vercel-blob',
  }
}

async function writeState(state, etag) {
  const next = { ...state, updatedAt: new Date().toISOString() }

  if (!TOKEN) {
    Object.assign(memory, next)
    return next
  }

  const options = {
    access: BLOB_ACCESS,
    token: TOKEN,
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    allowOverwrite: Boolean(etag),
    ...(etag ? { ifMatch: etag } : {}),
  }

  await put(STATE_PATH, JSON.stringify(next, null, 2), options)
  return next
}

/**
 * Read-modify-write with Blob ETag optimistic concurrency.
 * The mutator receives a mutable draft and may throw to abort the operation.
 */
export async function updateState(mutator) {
  let lastError

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { state, etag, mode } = await readState()
    const draft = structuredClone(state)
    const result = await mutator(draft)
    try {
      const saved = await writeState(draft, etag)
      return { state: saved, result, mode }
    } catch (error) {
      lastError = error
      const isConflict =
        error instanceof BlobPreconditionFailedError ||
        error?.name === 'BlobPreconditionFailedError' ||
        error?.status === 409 ||
        /precondition|conflict|already exists/i.test(String(error?.message || ''))
      if (!isConflict) throw error
    }
  }

  throw lastError || new Error('Could not update marketplace state')
}

export async function setStateForTests(next) {
  const normalized = normalize(next)
  Object.assign(memory, normalized)
  return normalized
}

export async function resetStateForTests() {
  Object.assign(memory, emptyState())
}

export { BlobPreconditionFailedError }
