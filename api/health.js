import { allowMethods, errorResponse, getHealth, json } from '../server/vercel/core.mjs'

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return
  try {
    json(res, 200, await getHealth())
  } catch (error) {
    errorResponse(res, error)
  }
}
