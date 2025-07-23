import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Upload, Check, Sparkles, Download, Heart, CreditCard } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import { toast } from 'sonner'
import { getUserCredits, consumeCredits } from '../lib/credits'
import { createCheckoutSession } from '../lib/stripe'
import Credits from './Credits'

interface GeneratedHeadshot {
  id: string
  url: string
  style: string
  background: string
  createdAt: string
  isFavorite: boolean
}

export function GeneratorWizard() {
  const [user, setUser] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedBackground, setSelectedBackground] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedHeadshots, setGeneratedHeadshots] = useState<GeneratedHeadshot[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      if (!state.isLoading && !state.user) {
        // Redirect to landing page if not authenticated
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      } else if (state.user) {
        // Load user credits
        try {
          const credits = await getUserCredits(state.user.id)
          setUserCredits(credits)
        } catch (error) {
          console.error('Error loading user credits:', error)
        }
      }
    })
    return unsubscribe
  }, [])

  const styles = [
    { id: 'professional', name: 'Professional', description: 'Classic business attire' },
    { id: 'business-casual', name: 'Business Casual', description: 'Smart casual look' },
    { id: 'creative', name: 'Creative', description: 'Modern and artistic' }
  ]

  const backgrounds = [
    { id: 'office', name: 'Office', description: 'Professional office setting' },
    { id: 'studio', name: 'Studio', description: 'Clean studio background' },
    { id: 'outdoor', name: 'Outdoor', description: 'Natural outdoor setting' },
    { id: 'gradient', name: 'Gradient', description: 'Modern gradient background' }
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).filter(file => {
        // Validate file type and size
        const isValidType = file.type.startsWith('image/')
        const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB max
        return isValidType && isValidSize
      })
      
      if (files.length > 0) {
        setUploadedFiles(prev => {
          const newFiles = [...prev, ...files]
          const finalFiles = newFiles.slice(0, 10) // Max 10 files
          if (newFiles.length > 10) {
            toast.warning('Maximum 10 files allowed. Some files were not added.')
          } else {
            toast.success(`${files.length} file(s) uploaded successfully`)
          }
          return finalFiles
        })
      } else {
        toast.error('Please upload valid image files (max 10MB each)')
      }
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input triggered', e.target.files)
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => {
        // Validate file type and size
        const isValidType = file.type.startsWith('image/')
        const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB max
        
        console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size}, Valid: ${isValidType && isValidSize}`)
        
        return isValidType && isValidSize
      })
      
      console.log(`Valid files: ${files.length}`)
      
      if (files.length > 0) {
        setUploadedFiles(prev => {
          const newFiles = [...prev, ...files]
          const finalFiles = newFiles.slice(0, 10) // Max 10 files
          if (newFiles.length > 10) {
            toast.warning('Maximum 10 files allowed. Some files were not added.')
          } else {
            toast.success(`${files.length} file(s) uploaded successfully`)
          }
          return finalFiles
        })
      } else {
        toast.error('Please upload valid image files (max 10MB each)')
      }
    } else {
      console.log('No files selected')
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const generateHeadshots = async () => {
    if (!user || uploadedFiles.length === 0 || !selectedStyle || !selectedBackground) return

    // Check if user has enough credits (6 credits needed for 6 headshots)
    const creditsNeeded = 6
    if (userCredits < creditsNeeded) {
      toast.error(`Insufficient credits! You need ${creditsNeeded} credits but only have ${userCredits}.`)
      // Redirect to pricing page
      window.history.pushState({}, '', '/pricing')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setCurrentStep(4) // Move to loading screen immediately

    try {
      // Consume credits before generation
      await consumeCredits(user.id, creditsNeeded)
      setUserCredits(prev => prev - creditsNeeded)
      toast.success(`${creditsNeeded} credits consumed for generation`)
      // Initial setup
      setGenerationProgress(5)
      await new Promise(resolve => setTimeout(resolve, 800)) // Small delay for UX
      
      // Upload reference images to storage
      setGenerationProgress(10)
      const uploadedUrls = []
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const { publicUrl } = await blink.storage.upload(
          file,
          `reference-images/${user.id}/${Date.now()}-${i}.${fileExtension}`,
          { upsert: true }
        )
        uploadedUrls.push(publicUrl)
        setGenerationProgress(10 + ((i + 1) / uploadedFiles.length * 20))
      }

      // Analyzing photos phase
      setGenerationProgress(35)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate headshots using AI
      setGenerationProgress(40)
      const stylePrompts = {
        'professional': 'professional business attire, formal suit, corporate headshot',
        'business-casual': 'business casual attire, smart casual clothing, professional but relaxed',
        'creative': 'creative professional style, modern artistic look, contemporary fashion'
      }
      
      const backgroundPrompts = {
        'office': 'professional office background, corporate environment',
        'studio': 'clean studio background, neutral backdrop, professional lighting',
        'outdoor': 'natural outdoor background, soft natural lighting',
        'gradient': 'modern gradient background, contemporary studio setting'
      }
      
      const prompt = `Professional headshot portrait, ${stylePrompts[selectedStyle]}, ${backgroundPrompts[selectedBackground]}, high quality photography, professional lighting, sharp focus, 8k resolution, studio quality`
      
      // AI Generation phase - this is the longest part
      setGenerationProgress(45)
      
      const { data } = await blink.ai.modifyImage({
        images: uploadedUrls.slice(0, 3), // Use max 3 reference images for better performance
        prompt,
        quality: 'high',
        n: 6, // Generate 6 headshots
        size: '1024x1024'
      })

      // Processing results
      setGenerationProgress(80)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Save generation data to database
      const timestamp = Date.now()
      const headshotRecords = data.map((image, index) => ({
        id: `headshot_${timestamp}_${index}`,
        url: image.url,
        style: selectedStyle,
        background: selectedBackground,
        createdAt: new Date().toISOString(),
        isFavorite: false
      }))

      setGenerationProgress(90)

      // Store in database with better error handling
      for (const headshot of headshotRecords) {
        try {
          await blink.db.headshots.create({
            id: headshot.id,
            userId: user.id,
            imageUrl: headshot.url,
            style: headshot.style,
            background: headshot.background,
            isFavorite: headshot.isFavorite,
            creditsUsed: creditsNeeded,
            createdAt: new Date()
          })
        } catch (dbError) {
          console.error('Failed to save headshot to database:', dbError)
          // Continue with other headshots even if one fails
        }
      }

      setGeneratedHeadshots(headshotRecords)
      setGenerationProgress(100)
      
      // Show completion for a moment before revealing results
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsGenerating(false)
      toast.success('🎉 Your professional headshots are ready!')
      
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate headshots. Please try again.')
      setIsGenerating(false)
      setGenerationProgress(0)
      setCurrentStep(3) // Go back to previous step on error
    }
  }

  const toggleFavorite = async (headshotId: string) => {
    const headshot = generatedHeadshots.find(h => h.id === headshotId)
    if (!headshot) return

    const newFavoriteStatus = !headshot.isFavorite
    
    // Update in database
    await blink.db.headshots.update(headshotId, {
      isFavorite: newFavoriteStatus
    })

    // Update local state
    setGeneratedHeadshots(prev => 
      prev.map(h => 
        h.id === headshotId 
          ? { ...h, isFavorite: newFavoriteStatus }
          : h
      )
    )

    toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites')
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

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Headshot AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Step {currentStep} of 4
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPricing}
              className="flex items-center gap-2 text-sm hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-600">{userCredits} credits</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Upload Photos */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">Upload your photos</h1>
              <p className="text-xl text-gray-600 font-light">Upload 5-10 photos of yourself from different angles for best results</p>
            </div>

            <Card className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop your photos here
                </h3>
                <p className="text-gray-600 mb-4">or</p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    type="button"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Button clicked')
                      const input = document.getElementById('file-upload') as HTMLInputElement
                      console.log('Input element found:', !!input)
                      if (input) {
                        console.log('Triggering input click')
                        input.click()
                      }
                    }}
                  >
                    Choose files
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="sr-only"
                />
                <p className="text-sm text-gray-500 mt-4">
                  Supports JPG, PNG, HEIC. Max 10 photos.
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Uploaded photos ({uploadedFiles.length}/10)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={nextStep}
                disabled={uploadedFiles.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Style */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">Choose your style</h1>
              <p className="text-xl text-gray-600 font-light">Select the style that best fits your professional needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {styles.map((style) => (
                <Card
                  key={style.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedStyle === style.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden">
                    <img
                      src={
                        style.id === 'professional' 
                          ? "https://images.unsplash.com/photo-1680540692052-79fde1108370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400"
                          : style.id === 'business-casual'
                          ? "https://images.unsplash.com/photo-1599132880549-bffe2907f808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxM3x8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDB8MXx8fDE3NTMyNTAzNjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
                          : "https://images.unsplash.com/photo-1545804571-2cac41b26118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw5fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400"
                      }
                      alt={`${style.name} style example`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{style.name}</h3>
                  <p className="text-gray-600 text-sm">{style.description}</p>
                  {selectedStyle === style.id && (
                    <div className="mt-3">
                      <Badge className="bg-primary text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button 
                onClick={nextStep}
                disabled={!selectedStyle}
                className="bg-primary hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Choose Background */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">Choose your background</h1>
              <p className="text-xl text-gray-600 font-light">Select the background setting for your headshots</p>
            </div>

            {/* Credits Display */}
            <div className="max-w-md mx-auto">
              <Credits credits={userCredits} onBuyCredits={goToPricing} />
            </div>

            {/* Low Credits Warning */}
            {userCredits < 6 && (
              <div className="max-w-md mx-auto">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-orange-800 font-medium mb-3">
                    You need 6 credits to generate headshots, but you only have {userCredits}.
                  </p>
                  <Button 
                    onClick={goToPricing}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy More Credits
                  </Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {backgrounds.map((background) => (
                <Card
                  key={background.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedBackground === background.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedBackground(background.id)}
                >
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden">
                    <img
                      src={
                        background.id === 'office' 
                          ? "https://images.unsplash.com/photo-1683770997177-0603bd44d070?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBiYWNrZ3JvdW5kJTIwcHJvZmVzc2lvbmFsfGVufDB8MHx8fDE3NTMyNTA0NTF8MA&ixlib=rb-4.1.0&q=80&w=400"
                          : background.id === 'studio'
                          ? "https://images.unsplash.com/photo-1752134593973-ac72a80ba7c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxzdHVkaW8lMjBiYWNrZ3JvdW5kJTIwbmV1dHJhbHxlbnwwfDB8fHwxNzUzMjUwNDU3fDA&ixlib=rb-4.1.0&q=80&w=400"
                          : background.id === 'outdoor'
                          ? "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MHwxfHx8MTc1MzI1MDM2Nnww&ixlib=rb-4.1.0&q=80&w=400"
                          : "https://images.unsplash.com/photo-1673526759317-be71a1243e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxncmFkaWVudCUyMGJhY2tncm91bmQlMjBhYnN0cmFjdHxlbnwwfDB8fHwxNzUzMjUwNDYzfDA&ixlib=rb-4.1.0&q=80&w=400"
                      }
                      alt={`${background.name} background example`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{background.name}</h3>
                  <p className="text-gray-600 text-sm">{background.description}</p>
                  {selectedBackground === background.id && (
                    <div className="mt-3">
                      <Badge className="bg-primary text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button 
                onClick={generateHeadshots}
                disabled={!selectedBackground || isGenerating || userCredits < 6}
                className="bg-primary hover:bg-primary/90"
              >
                {isGenerating ? 'Generating...' : userCredits < 6 ? 'Insufficient Credits' : 'Generate Headshots (6 credits)'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {isGenerating ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md mx-auto px-6">
                  {/* Clean animated logo */}
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>

                  {/* Simple heading */}
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
                    Generating your headshots
                  </h2>
                  
                  {/* Time expectation */}
                  <p className="text-gray-600 mb-8">
                    This will take 2-3 minutes
                  </p>

                  {/* Clean progress bar */}
                  <div className="mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{generationProgress}% complete</p>
                  </div>

                  {/* Simple status text */}
                  <p className="text-sm text-gray-600">
                    {generationProgress < 30 && "Analyzing your photos..."}
                    {generationProgress >= 30 && generationProgress < 90 && "Creating professional headshots..."}
                    {generationProgress >= 90 && "Almost done..."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">Your headshots are ready!</h1>
                  <p className="text-xl text-gray-600 font-light">Here are your AI-generated professional headshots</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedHeadshots.map((headshot) => (
                    <Card key={headshot.id} className="overflow-hidden">
                      <div className="relative group">
                        <img
                          src={headshot.url}
                          alt="Generated headshot"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleFavorite(headshot.id)}
                          >
                            <Heart className={`w-4 h-4 ${headshot.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadHeadshot(headshot.url, `headshot-${headshot.id}.jpg`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600">
                          {headshot.style} • {headshot.background}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => {
                      setCurrentStep(1)
                      setUploadedFiles([])
                      setSelectedStyle('')
                      setSelectedBackground('')
                      setGeneratedHeadshots([])
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Generate More Headshots
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}