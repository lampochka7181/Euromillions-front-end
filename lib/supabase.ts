import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }
  
  // Check if URL looks like a database connection string (wrong format)
  if (supabaseUrl.startsWith('postgresql://')) {
    console.error('❌ Wrong URL format! You provided a database connection string.')
    console.error('✅ You need the Supabase API URL, not the database URL.')
    console.error('📖 Go to your Supabase dashboard → Settings → API')
    console.error('🔗 Copy the "Project URL" (looks like: https://your-project.supabase.co)')
    return false
  }
  
  // Check if URL looks like a valid Supabase API URL
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL format.')
    console.error('✅ URL should start with https:// and contain supabase.co')
    return false
  }
  
  return true
}

if (!isSupabaseConfigured()) {
  console.warn('⚠️  Supabase not properly configured. App will work without database persistence.')
  console.warn('📝 To fix: Update your .env file with correct Supabase API credentials')
}

// Create a mock supabase client if not configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: new Error('Supabase not configured') }),
        eq: () => ({ select: () => ({ data: null, error: null }) }),
        single: () => ({ data: null, error: null })
      })
    }

// Types for our database
export interface Ticket {
  id: string
  user_id: string
  numbers: number[]
  powerball: number
  transaction_hash: string
  price: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  wallet_address: string
  created_at: string
  updated_at: string
}
