import { blink } from '../blink/client'

export interface User {
  id: string
  email: string
  display_name?: string
  credits: number
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  user_id: string
  stripe_payment_intent_id?: string
  credits_purchased: number
  amount_paid: number
  status: string
  created_at: string
}

// Initialize user with 6 free credits when they first sign up
export async function initializeUser(userId: string, email: string, displayName?: string): Promise<User> {
  try {
    // Check if user already exists
    const existingUsers = await blink.db.users.list({
      where: { id: userId },
      limit: 1
    })

    if (existingUsers.length > 0) {
      return existingUsers[0] as User
    }

    // Create new user with 6 free credits
    const newUser = await blink.db.users.create({
      id: userId,
      email,
      display_name: displayName,
      credits: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return newUser as User
  } catch (error) {
    console.error('Error initializing user:', error)
    throw error
  }
}

// Get user's current credit balance
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const users = await blink.db.users.list({
      where: { id: userId },
      limit: 1
    })

    if (users.length === 0) {
      throw new Error('User not found')
    }

    return Number(users[0].credits) || 0
  } catch (error) {
    console.error('Error getting user credits:', error)
    return 0
  }
}

// Consume credits for AI generation
export async function consumeCredits(userId: string, creditsToConsume: number): Promise<boolean> {
  try {
    const currentCredits = await getUserCredits(userId)
    
    if (currentCredits < creditsToConsume) {
      throw new Error('Insufficient credits')
    }

    const newCredits = currentCredits - creditsToConsume
    
    await blink.db.users.update(userId, {
      credits: newCredits,
      updated_at: new Date().toISOString()
    })

    return true
  } catch (error) {
    console.error('Error consuming credits:', error)
    throw error
  }
}

// Add credits to user account (after successful purchase)
export async function addCredits(userId: string, creditsToAdd: number): Promise<number> {
  try {
    const currentCredits = await getUserCredits(userId)
    const newCredits = currentCredits + creditsToAdd
    
    await blink.db.users.update(userId, {
      credits: newCredits,
      updated_at: new Date().toISOString()
    })

    return newCredits
  } catch (error) {
    console.error('Error adding credits:', error)
    throw error
  }
}

// Create purchase record
export async function createPurchase(
  userId: string, 
  creditsToAdd: number, 
  amountPaid: number,
  stripePaymentIntentId?: string
): Promise<Purchase> {
  try {
    const purchase = await blink.db.purchases.create({
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      stripe_payment_intent_id: stripePaymentIntentId,
      credits_purchased: creditsToAdd,
      amount_paid: amountPaid * 100, // Convert to cents
      status: 'pending',
      created_at: new Date().toISOString()
    })

    return purchase as Purchase
  } catch (error) {
    console.error('Error creating purchase:', error)
    throw error
  }
}

// Update purchase status
export async function updatePurchaseStatus(purchaseId: string, status: string): Promise<void> {
  try {
    await blink.db.purchases.update(purchaseId, {
      status
    })
  } catch (error) {
    console.error('Error updating purchase status:', error)
    throw error
  }
}

// Get user's purchase history
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const purchases = await blink.db.purchases.list({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    })

    return purchases as Purchase[]
  } catch (error) {
    console.error('Error getting user purchases:', error)
    return []
  }
}