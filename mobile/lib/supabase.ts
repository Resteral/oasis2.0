import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://hsrcsmynfgendypscrbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzcmNzbXluZmdlbmR5cHNjcmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzcwNDYsImV4cCI6MjA4NTAxMzA0Nn0.dL_z_BUkJqwR3qfKAQjhZB_M8zVz_hiE7m8dKTVMly0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
