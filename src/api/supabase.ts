import { createClient } from '@supabase/supabase-js'

// One Supabase client for the whole app: the auth composable and the API interceptor must share its session
const SUPABASE_URL = 'https://ikxnkhvvlsfqnwervleg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreG5raHZ2bHNmcW53ZXJ2bGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NjMwMTQsImV4cCI6MjEwNjAzOTAxNH0.EyDhkDC9ENeXrFeGKxDBVYnggYhTw5OyG-9W0TECTP8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
