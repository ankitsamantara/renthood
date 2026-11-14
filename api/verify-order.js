import { allowMethods, errorResponse, json, queryValue, verifyOrder } from '../server/vercel/core.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return
  try {
    const result = await verifyOrder(queryValue(req, 'orderId'))
    json(res, 200, result)
  } catch (error) {
    errorResponse(res, error)
  }
}
