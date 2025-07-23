import React, { useState } from 'react'
import { Check, CreditCard, Sparkles, ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { toast } from 'sonner'

interface PricingProps {
  onPurchase: (credits: number, amount: number) => void
  isLoading?: boolean
}

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

export default function Pricing({ onPurchase, isLoading }: PricingProps) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

  const handlePurchase = (planIndex: number) => {
    const plan = pricingPlans[planIndex]
    setSelectedPlan(planIndex)
    
    try {
      onPurchase(plan.credits, plan.price)
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to initiate purchase. Please try again.')
      setSelectedPlan(null)
    }
  }

  const navigateTo = (page: string) => {
    window.history.pushState({}, '', page)
    window.location.reload()
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigateTo('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <Button
              onClick={goBack}
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Center: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-display font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-display font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Headshot AI
              </span>
            </div>

            {/* Right: Navigation Links */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigateTo('/')}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
              <Button
                onClick={() => navigateTo('/dashboard')}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <span>Headshot AI</span>
            <span>/</span>
            <span className="text-orange-600 font-medium">Pricing</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"> Credit Pack</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
            Generate professional AI headshots with our credit system. Each photo costs 1 credit. 
            Choose the pack that fits your needs and start creating stunning professional images.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            New users get 6 free credits to try the service!
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-2 border-orange-500 shadow-xl scale-105' 
                  : 'border border-gray-200 hover:border-orange-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 text-sm font-semibold">
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
                  onClick={() => handlePurchase(index)}
                  disabled={isLoading && selectedPlan === index}
                  className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {isLoading && selectedPlan === index ? (
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
    </div>
  )
}