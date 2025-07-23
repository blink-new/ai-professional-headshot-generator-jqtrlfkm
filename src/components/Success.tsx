import React, { useEffect, useState, useCallback } from 'react'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { verifyPaymentAndAddCredits } from '../lib/stripe'
import { getUserCredits } from '../lib/credits'
import { blink } from '../blink/client'
import { toast } from 'sonner'

export default function Success() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [credits, setCredits] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Get current user
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const navigateTo = (page: string) => {
    window.location.href = page
  }

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      setIsVerifying(true)
      
      // Verify payment and add credits
      const success = await verifyPaymentAndAddCredits(sessionId)
      
      if (success && user) {
        // Get updated credit balance
        const updatedCredits = await getUserCredits(user.id)
        setCredits(updatedCredits)
        setIsSuccess(true)
        toast.success('Payment successful! Credits added to your account.')
        
        // Auto-redirect to dashboard after 3 seconds with countdown
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              navigateTo('/dashboard')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error('Payment verification failed. Please contact support.')
        setIsSuccess(false)
        // Stay on success page to show error, don't redirect
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast.error('Payment verification failed. Please contact support.')
      setIsSuccess(false)
      // Stay on success page to show error, don't redirect
    } finally {
      setIsVerifying(false)
    }
  }, [user])

  useEffect(() => {
    // Get session_id and redirect from URL search params
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    const redirectTo = urlParams.get('redirect') || 'dashboard'
    
    if (!sessionId) {
      navigateTo('/pricing')
      return
    }

    if (user) {
      verifyPayment(sessionId)
    }
  }, [user, verifyPayment])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your purchase...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isSuccess && !isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <span className="text-4xl text-white">⚠️</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
                Payment Verification Failed
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                We couldn't verify your payment. Please contact our support team for assistance.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigateTo('/pricing')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Try Again
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={() => navigateTo('/dashboard')}
                variant="outline"
                className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-6 text-lg font-semibold"
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Need help? Contact our support team at support@headshotai.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-4">
              Your credits have been added to your account. You're ready to create amazing professional headshots!
            </p>
            {countdown > 0 && (
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}
          </div>

          {/* Credits Display */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8 border border-orange-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Your Credit Balance
              </h2>
            </div>
            <div className="text-6xl font-display font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              {credits}
            </div>
            <p className="text-gray-600">
              Credits available for AI headshot generation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigateTo('/dashboard')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              onClick={() => navigateTo('/generator')}
              variant="outline"
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-6 text-lg font-semibold"
            >
              Start Generating
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Need help? Contact our support team at support@headshotai.com
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span>🔒 Secure Payment</span>
              <span>⚡ Instant Access</span>
              <span>🎯 Commercial Rights</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}