import React from 'react'
import { Coins, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface CreditsProps {
  credits: number
  onBuyCredits: () => void
}

export default function Credits({ credits, onBuyCredits }: CreditsProps) {
  const isLowCredits = credits < 6

  return (
    <Card className={`transition-all duration-300 ${
      isLowCredits 
        ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50' 
        : 'border-gray-200 bg-white'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLowCredits 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-green-500 to-blue-500'
            }`}>
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Your Credits
              </h3>
              <p className="text-sm text-gray-600">
                {credits} photo{credits !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              isLowCredits ? 'text-orange-600' : 'text-green-600'
            }`}>
              {credits}
            </div>
            <Button
              onClick={onBuyCredits}
              size="sm"
              variant={isLowCredits ? "default" : "outline"}
              className={`mt-2 ${
                isLowCredits 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                  : 'border-primary text-primary hover:bg-primary hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Buy More
            </Button>
          </div>
        </div>
        
        {isLowCredits && (
          <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Running low on credits!</strong> Each generation uses 6 credits. 
              Purchase more to continue creating professional headshots.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}