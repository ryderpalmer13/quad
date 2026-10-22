import Stripe from 'stripe'

let client = null

// Created on first use so the build does not need the secret key.
export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    client = new Stripe(key)
  }
  return client
}
