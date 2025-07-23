import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-professional-headshot-generator-jqtrlfkm',
  authRequired: false // Landing page is public, auth required only for specific actions
})