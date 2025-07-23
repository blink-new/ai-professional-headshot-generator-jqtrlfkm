import { useState, useEffect } from 'react'
import { Star, ArrowRight, Upload, Palette, Sparkles, Download, Check, CreditCard } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { blink } from '../blink/client'
import { createCheckoutSession } from '../lib/stripe'
import { toast } from 'sonner'

const pricingPlans = [
  {
    name: 'Starter Pack',
    credits: 40,
    price: 35,
    pricePerCredit: 0.875,
    popular: false,
    features: [
      '40 AI-generated headshots',
      'Professional quality',
      'Multiple styles & backgrounds',
      'High-resolution downloads',
      'Commercial usage rights'
    ]
  },
  {
    name: 'Popular Pack',
    credits: 60,
    price: 45,
    pricePerCredit: 0.75,
    popular: true,
    features: [
      '60 AI-generated headshots',
      'Professional quality',
      'Multiple styles & backgrounds',
      'High-resolution downloads',
      'Commercial usage rights',
      'Priority generation'
    ]
  },
  {
    name: 'Pro Pack',
    credits: 100,
    price: 75,
    pricePerCredit: 0.75,
    popular: false,
    features: [
      '100 AI-generated headshots',
      'Professional quality',
      'Multiple styles & backgrounds',
      'High-resolution downloads',
      'Commercial usage rights',
      'Priority generation',
      'Extended support'
    ]
  }
]

export function LandingPage() {
  const [user, setUser] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      // Don't show loading state on landing page - it should be immediately accessible
    })
    return unsubscribe
  }, [])

  const handleSignUp = () => {
    blink.auth.login()
  }

  const handleGoToDashboard = () => {
    // Navigate to dashboard
    window.history.pushState({}, '', '/dashboard')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePurchase = async (credits: number, amount: number) => {
    if (!user) {
      toast.info('Please sign in to purchase credits')
      blink.auth.login()
      return
    }

    setPurchaseLoading(true)
    try {
      const session = await createCheckoutSession(user.id, credits, amount, user.email)
      window.open(session.url, '_blank')
      toast.success('Redirecting to secure checkout...')
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to initiate purchase. Please try again.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Headshot AI</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={scrollToPricing}
              className="text-gray-600 hover:text-primary transition-colors font-medium"
            >
              Pricing
            </button>
            
            {user ? (
              <Button onClick={handleGoToDashboard} className="bg-primary hover:bg-primary/90">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={handleSignUp} className="bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50">
            ✨ AI-Powered Professional Headshots
          </Badge>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold text-gray-900 mb-8 leading-tight">
            Get professional headshots
            <br />
            <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">in minutes, not days</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Upload your photos and get 100+ professional headshots generated by AI. 
            Perfect for LinkedIn, resumes, and professional profiles.
          </p>
          
          <Button 
            onClick={user ? handleGoToDashboard : handleSignUp}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-xl"
          >
            Create your headshots now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          {/* Social Proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">4.9/5 on Google Reviews</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-green-500 text-green-500" />
                ))}
              </div>
              <span className="text-sm text-gray-600">4.8/5 on Trustpilot</span>
            </div>
          </div>
        </div>
      </section>

      {/* Headshot Gallery - Infinite Rolling Carousel */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-16">
            Professional headshots generated by AI
          </h2>
          
          <div className="relative overflow-hidden">
            {/* Gradient overlays for smooth edges */}
            <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-gray-50 to-transparent z-10"></div>
            
            {/* Infinite scrolling container */}
            <div className="flex animate-scroll">
              {/* First set of images */}
              {[
                "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1680540692052-79fde1108370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1738750908048-14200459c3c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw4fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1712174766230-cb7304feaafe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMHx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1589668944320-409833e5ba10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMXx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1599132880549-bffe2907f808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxM3x8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNHx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1590496552566-41aca09db352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNXx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1740153204804-200310378f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNnx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1752118465028-4a135f89e474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxN3x8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
              ].map((imageUrl, i) => (
                <div key={`first-${i}`} className="flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden shadow-lg mx-2 hover:scale-105 transition-transform duration-300">
                  <img
                    src={imageUrl}
                    alt={`Professional headshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              
              {/* Duplicate set for seamless infinite scroll */}
              {[
                "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1680540692052-79fde1108370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1738750908048-14200459c3c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw4fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1712174766230-cb7304feaafe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMHx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1589668944320-409833e5ba10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMXx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1599132880549-bffe2907f808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxM3x8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNHx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1590496552566-41aca09db352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNXx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1740153204804-200310378f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxNnx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400",
                "https://images.unsplash.com/photo-1752118465028-4a135f89e474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxN3x8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
              ].map((imageUrl, i) => (
                <div key={`second-${i}`} className="flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden shadow-lg mx-2 hover:scale-105 transition-transform duration-300">
                  <img
                    src={imageUrl}
                    alt={`Professional headshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500 mb-8">Trusted by professionals at</p>
          <div className="flex flex-wrap justify-center items-center space-x-8 space-y-4">
            {['Google', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Spotify'].map((company) => (
              <div key={company} className="text-2xl font-bold text-gray-300">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-20">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload photos</h3>
              <p className="text-gray-600">Upload 5-10 photos of yourself from different angles</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose style</h3>
              <p className="text-gray-600">Select your preferred style and background</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI generates</h3>
              <p className="text-gray-600">Our AI creates 100+ professional headshots</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-gray-600">Download your favorite headshots in high resolution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-16">
            What our customers say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Marketing Manager",
                content: "Amazing quality! Got my headshots in just 30 minutes. Perfect for my LinkedIn profile.",
                rating: 5,
                avatar: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400"
              },
              {
                name: "Michael Chen",
                role: "Software Engineer",
                content: "So much better than traditional photography. The AI captured exactly what I wanted.",
                rating: 5,
                avatar: "https://images.unsplash.com/photo-1589668944320-409833e5ba10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMXx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
              },
              {
                name: "Emily Davis",
                role: "Consultant",
                content: "Professional results at a fraction of the cost. Highly recommend!",
                rating: 5,
                avatar: "https://images.unsplash.com/photo-1712174766230-cb7304feaafe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxMHx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-16 lg:py-24 bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent"> Credit Pack</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Generate professional AI headshots with our credit system. Each photo costs 1 credit. 
              Choose the pack that fits your needs and start creating stunning professional images.
            </p>
            
            <div className="mt-8 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Start with 6 free credits when you sign up!
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-xl scale-105' 
                    : 'border border-gray-200 hover:border-orange-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-orange-600 text-white px-4 py-1 text-sm font-semibold">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-display font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-display font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      for {plan.credits} photos
                    </span>
                  </div>
                  <CardDescription className="text-gray-600">
                    ${plan.pricePerCredit.toFixed(2)} per photo
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handlePurchase(plan.credits, plan.price)}
                    disabled={purchaseLoading}
                    className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white shadow-lg hover:shadow-xl'
                        : 'bg-white border-2 border-primary text-primary hover:bg-orange-50'
                    }`}
                  >
                    {purchaseLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Get {plan.credits} Credits
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-6">Trusted by thousands of professionals</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-sm font-semibold">🔒 Secure Payment</div>
              <div className="text-sm font-semibold">💳 Stripe Protected</div>
              <div className="text-sm font-semibold">⚡ Instant Access</div>
              <div className="text-sm font-semibold">🎯 Commercial Rights</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 mb-8">
            Ready to get your professional headshots?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of professionals who trust our AI for their headshots
          </p>
          <Button 
            onClick={user ? handleGoToDashboard : handleSignUp}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-xl"
          >
            Get started now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-4 py-8">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Headshot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}