import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Sparkles, Download, Heart, Plus, Filter, CreditCard } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { toast } from 'sonner'
import { getUserCredits } from '../lib/credits'
import { createCheckoutSession } from '../lib/stripe'
import Credits from './Credits'

interface Headshot {
  id: string
  imageUrl: string
  style: string
  background: string
  isFavorite: boolean
  createdAt: string
}

export function Dashboard() {
  const [user, setUser] = useState(null)
  const [headshots, setHeadshots] = useState<Headshot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [userCredits, setUserCredits] = useState(0)

  const refreshCredits = useCallback(async (userId: string) => {
    try {
      const credits = await getUserCredits(userId)
      setUserCredits(credits)
    } catch (error) {
      console.error('Error loading user credits:', error)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      if (!state.isLoading && !state.user) {
        // Redirect to landing page if not authenticated
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      } else if (state.user) {
        // Load user credits
        await refreshCredits(state.user.id)
      }
    })
    return unsubscribe
  }, [refreshCredits])

  // Refresh credits when component mounts (useful when coming from success page)
  useEffect(() => {
    if (user) {
      refreshCredits(user.id)
    }
  }, [user, refreshCredits])

  const loadHeadshots = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await blink.db.headshots.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setHeadshots(data)
    } catch (error) {
      console.error('Failed to load headshots:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadHeadshots()
    }
  }, [user, loadHeadshots])



  const toggleFavorite = async (headshotId: string) => {
    const headshot = headshots.find(h => h.id === headshotId)
    if (!headshot) return

    const newFavoriteStatus = Number(headshot.isFavorite) > 0 ? false : true
    
    try {
      // Update in database
      await blink.db.headshots.update(headshotId, {
        isFavorite: newFavoriteStatus
      })

      // Update local state
      setHeadshots(prev => 
        prev.map(h => 
          h.id === headshotId 
            ? { ...h, isFavorite: newFavoriteStatus }
            : h
        )
      )
      
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      console.error('Failed to update favorite:', error)
      toast.error('Failed to update favorite status')
    }
  }

  const downloadHeadshot = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started!')
  }

  const goToGenerator = () => {
    window.history.pushState({}, '', '/generator')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const goToLanding = () => {
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const goToPricing = () => {
    window.history.pushState({}, '', '/pricing')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleBuyCredits = async (credits: number, amount: number) => {
    if (!user) {
      toast.error('Please sign in to purchase credits')
      return
    }
    
    try {
      const session = await createCheckoutSession(user.id, credits, amount, user.email)
      window.open(session.url, '_blank')
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to initiate purchase. Please try again.')
    }
  }

  const filteredHeadshots = headshots.filter(headshot => {
    if (filter === 'favorites') {
      return Number(headshot.isFavorite) > 0
    }
    if (filter === 'professional') {
      return headshot.style === 'professional'
    }
    if (filter === 'business-casual') {
      return headshot.style === 'business-casual'
    }
    if (filter === 'creative') {
      return headshot.style === 'creative'
    }
    return true // 'all'
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to continue</h2>
          <Button onClick={() => blink.auth.login()}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={goToLanding} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Headshot AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPricing}
              className="flex items-center gap-2 text-sm hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-600">{userCredits} credits</span>
            </Button>
            <Button onClick={goToGenerator} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-4">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Manage your AI-generated professional headshots
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Headshots</p>
                <p className="text-2xl font-bold text-gray-900">{headshots.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {headshots.filter(h => Number(h.isFavorite) > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Available</p>
                <p className="text-2xl font-bold text-gray-900">{userCredits}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            {userCredits < 6 && (
              <Button 
                onClick={goToPricing}
                size="sm" 
                className="mt-3 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Buy More Credits
              </Button>
            )}
          </Card>
        </div>

        {/* Filter and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter headshots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Headshots</SelectItem>
                <SelectItem value="favorites">Favorites Only</SelectItem>
                <SelectItem value="professional">Professional Style</SelectItem>
                <SelectItem value="business-casual">Business Casual</SelectItem>
                <SelectItem value="creative">Creative Style</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={goToGenerator} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Headshots
          </Button>
        </div>

        {/* Headshots Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredHeadshots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No headshots yet' : 'No headshots match your filter'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Generate your first professional headshots with AI'
                : 'Try adjusting your filter or generate new headshots'
              }
            </p>
            <Button onClick={goToGenerator} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Generate Headshots
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHeadshots.map((headshot) => (
              <Card key={headshot.id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={headshot.imageUrl}
                    alt="Generated headshot"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleFavorite(headshot.id)}
                    >
                      <Heart className={`w-4 h-4 ${Number(headshot.isFavorite) > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadHeadshot(headshot.imageUrl, `headshot-${headshot.id}.jpg`)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  {Number(headshot.isFavorite) > 0 && (
                    <div className="absolute top-2 right-2">
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {headshot.style.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {headshot.background}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(headshot.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}