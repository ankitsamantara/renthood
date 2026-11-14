import { allowMethods, createOrder, errorResponse, json, parseBody } from '../server/vercel/core.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return
  try {
    const body = await parseBody(req)
    const order = await createOrder(body, req)
    json(res, 201, order)
  } catch (error) {
    errorResponse(res, error)
  }
}
