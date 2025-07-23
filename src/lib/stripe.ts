import { blink } from '../blink/client'

export interface CheckoutSession {
  url: string
  sessionId: string
}

// Create Stripe checkout session for credit purchase
export async function createCheckoutSession(
  userId: string,
  credits: number,
  amount: number,
  userEmail: string
): Promise<CheckoutSession> {
  try {
    // Create checkout session using Stripe API
    const response = await blink.data.fetch({
      url: 'https://api.stripe.com/v1/checkout/sessions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{STRIPE_SECRET_KEY}}',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `${credits} AI Headshot Credits`,
        'line_items[0][price_data][product_data][description]': `Generate ${credits} professional AI headshots`,
        'line_items[0][price_data][unit_amount]': (amount * 100).toString(), // Convert to cents
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&redirect=dashboard`,
        'cancel_url': `${window.location.origin}/pricing`,
        'customer_email': userEmail,
        'metadata[user_id]': userId,
        'metadata[credits]': credits.toString(),
        'metadata[amount]': amount.toString(),
        'metadata[package_name]': `${credits} Credits Package`,
        'metadata[user_email]': userEmail,
        'allow_promotion_codes': 'true'
      }).toString()
    })

    if (response.status !== 200) {
      throw new Error('Failed to create checkout session')
    }

    const session = response.body
    
    return {
      url: session.url,
      sessionId: session.id
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw new Error('Failed to create checkout session. Please try again.')
  }
}

// Verify payment and add credits
export async function verifyPaymentAndAddCredits(sessionId: string): Promise<boolean> {
  try {
    // Retrieve checkout session from Stripe
    const response = await blink.data.fetch({
      url: `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer {{STRIPE_SECRET_KEY}}'
      }
    })

    if (response.status !== 200) {
      throw new Error('Failed to retrieve checkout session')
    }

    const session = response.body

    if (session.payment_status === 'paid') {
      const userId = session.metadata.user_id
      const credits = parseInt(session.metadata.credits)
      const amount = parseFloat(session.metadata.amount)

      // Add credits to user account
      const { addCredits, createPurchase, updatePurchaseStatus } = await import('./credits')
      
      // Create purchase record
      const purchase = await createPurchase(
        userId,
        credits,
        amount,
        session.payment_intent
      )

      // Add credits to user
      await addCredits(userId, credits)

      // Update purchase status
      await updatePurchaseStatus(purchase.id, 'completed')

      return true
    }

    return false
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}