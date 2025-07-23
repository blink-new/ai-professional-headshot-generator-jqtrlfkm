import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { GeneratorWizard } from './components/GeneratorWizard'
import { Dashboard } from './components/Dashboard'
import Pricing from './components/Pricing'
import Success from './components/Success'
import { Toaster } from 'sonner'
import { blink } from './blink/client'
import { createCheckoutSession } from './lib/stripe'
import { initializeUser } from './lib/credits'
import { toast } from 'sonner'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize user authentication and credits (but don't require auth for landing page)
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
      
      // Initialize user with 6 free credits when they first sign up
      if (state.user && !state.isLoading) {
        try {
          await initializeUser(state.user.id, state.user.email, state.user.displayName)
        } catch (error) {
          console.error('Error initializing user:', error)
        }
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    // Simple routing based on URL path
    const path = window.location.pathname
    if (path === '/generator') {
      setCurrentPage('generator')
    } else if (path === '/dashboard') {
      setCurrentPage('dashboard')
    } else if (path === '/pricing') {
      setCurrentPage('pricing')
    } else if (path.startsWith('/success')) {
      setCurrentPage('success')
    } else {
      setCurrentPage('landing')
    }

    // Listen for navigation events
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/generator') {
        setCurrentPage('generator')
      } else if (path === '/dashboard') {
        setCurrentPage('dashboard')
      } else if (path === '/pricing') {
        setCurrentPage('pricing')
      } else if (path.startsWith('/success')) {
        setCurrentPage('success')
      } else {
        setCurrentPage('landing')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Update URL when page changes
  useEffect(() => {
    if (currentPage === 'generator' && window.location.pathname !== '/generator') {
      window.history.pushState({}, '', '/generator')
    } else if (currentPage === 'dashboard' && window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard')
    } else if (currentPage === 'pricing' && window.location.pathname !== '/pricing') {
      window.history.pushState({}, '', '/pricing')
    } else if (currentPage === 'landing' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
  }, [currentPage])

  // Handle credit purchase
  const handlePurchase = async (credits: number, amount: number) => {
    if (!user) {
      toast.error('Please sign in to purchase credits')
      return
    }

    setIsLoading(true)
    try {
      const { url } = await createCheckoutSession(user.id, credits, amount, user.email)
      
      // Open Stripe checkout in new tab
      window.open(url, '_blank')
      
      toast.success('Redirecting to secure checkout...')
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to create checkout session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auth guard for protected pages
  const requireAuth = (component: React.ReactNode) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    if (!user) {
      // Redirect to landing page and trigger login
      blink.auth.login()
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to sign in...</p>
          </div>
        </div>
      )
    }
    
    return component
  }

  return (
    <>
      {currentPage === 'generator' && requireAuth(<GeneratorWizard />)}
      {currentPage === 'dashboard' && requireAuth(<Dashboard />)}
      {currentPage === 'pricing' && <Pricing onPurchase={handlePurchase} isLoading={isLoading} />}
      {currentPage === 'success' && <Success />}
      {currentPage === 'landing' && <LandingPage />}
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App