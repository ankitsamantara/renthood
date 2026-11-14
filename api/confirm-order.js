import {
  allowMethods,
  confirmDemoOrder,
  errorResponse,
  json,
  parseBody,
} from '../server/vercel/core.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return
  try {
    const body = await parseBody(req)
    const result = await confirmDemoOrder(body.orderId)
    json(res, 200, { booking: result.result, status: 'PAID' })
  } catch (error) {
    errorResponse(res, error)
  }
}
