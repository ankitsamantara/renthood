import {
  allowMethods,
  allListings,
  createListing,
  errorResponse,
  json,
  parseBody,
} from '../server/vercel/core.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return
  try {
    if (req.method === 'GET') {
      json(res, 200, { listings: await allListings() })
      return
    }
    const body = await parseBody(req)
    const listing = await createListing(body)
    json(res, 201, { listing })
  } catch (error) {
    errorResponse(res, error)
  }
}
