import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ai-professional-headshot-generator-jqtrlfkm',
  authRequired: false
});

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response('Missing Stripe signature', { status: 400 });
    }

    // Import Stripe with webhook verification
    const Stripe = (await import('npm:stripe')).default;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Received Stripe event:', event.type, 'ID:', event.id);

    // Handle different Stripe events
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object as any);
      
      case 'payment_intent.succeeded':
        return await handlePaymentSucceeded(event.data.object as any);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentFailed(event.data.object as any);
      
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event.data.object as any);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ received: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
});

// Handle successful checkout session completion
async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout session:', session.id);
  console.log('Customer email:', session.customer_details?.email);
  console.log('Amount paid:', session.amount_total);

  // Extract credit package info from metadata
  const credits = parseInt(session.metadata?.credits || '0');
  const packageName = session.metadata?.package_name || 'Unknown';
  const userEmail = session.customer_details?.email;

  if (!credits || !userEmail) {
    console.error('Missing credits or user email in session metadata');
    return new Response('Missing required session data', { status: 400 });
  }

  try {
    // Find user by email - try exact match first, then case-insensitive
    let users = await blink.db.users.list({
      where: { email: userEmail },
      limit: 1
    });

    // If no exact match, try case-insensitive search
    if (users.length === 0) {
      console.log('Exact email match failed, trying case-insensitive search...');
      const allUsers = await blink.db.users.list();
      users = allUsers.filter(u => u.email.toLowerCase() === userEmail.toLowerCase());
    }

    if (users.length === 0) {
      console.error('User not found with email:', userEmail);
      console.log('Available users:', await blink.db.users.list());
      return new Response('User not found', { status: 404 });
    }

    const user = users[0];
    console.log('Found user:', user.id, 'with email:', user.email);

    // Get current user credits
    const currentCredits = Number(user.credits) || 0;
    const newCredits = currentCredits + credits;

    // Update user credits
    await blink.db.users.update(user.id, {
      credits: newCredits
    });

    console.log(`Updated user ${user.id} credits: ${currentCredits} -> ${newCredits}`);

    // Record the purchase (using correct database field names)
    await blink.db.purchases.create({
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      stripe_payment_intent_id: session.payment_intent || session.id,
      credits_purchased: credits,
      amount_paid: session.amount_total,
      status: 'completed',
      created_at: Date.now()
    });

    console.log(`✅ Purchase completed for user ${user.id}: ${credits} credits for $${session.amount_total / 100}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Credits added successfully',
      userId: user.id,
      creditsAdded: credits,
      newBalance: newCredits
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (dbError) {
    console.error('Database error:', dbError);
    return new Response('Database error', { status: 500 });
  }
}

// Handle successful payment intent
async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  console.log('Amount:', paymentIntent.amount, paymentIntent.currency);
  
  // Log for monitoring purposes
  console.log(`✅ Payment successful: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
  
  return new Response(JSON.stringify({ 
    received: true, 
    message: 'Payment success logged' 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Handle failed payment intent
async function handlePaymentFailed(paymentIntent: any) {
  console.error('Payment failed:', paymentIntent.id);
  console.error('Failure reason:', paymentIntent.last_payment_error?.message);
  
  // Could implement retry logic or customer notification here
  console.log(`❌ Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`);
  
  return new Response(JSON.stringify({ 
    received: true, 
    message: 'Payment failure logged' 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Handle successful invoice payment (for subscriptions if added later)
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Invoice payment succeeded:', invoice.id);
  console.log('Customer:', invoice.customer);
  console.log('Amount:', invoice.amount_paid);
  
  // Future: Handle subscription renewals here
  console.log(`✅ Invoice paid: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);
  
  return new Response(JSON.stringify({ 
    received: true, 
    message: 'Invoice payment logged' 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}