import { allowMethods, errorResponse, json } from '../server/vercel/core.mjs'
import { readState } from '../server/vercel/store.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return
  try {
    const { state } = await readState()
    json(res, 200, { bookings: state.bookings })
  } catch (error) {
    errorResponse(res, error)
  }
}
