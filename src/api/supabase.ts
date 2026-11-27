import { createClient } from '@supabase/supabase-js'

// One Supabase client for the whole app: the auth composable, the API interceptor and the sign-up page share its session.
// Project in Canada (Central, Montréal). The publishable key is public by design; the tables are not reachable with it.
const SUPABASE_URL = 'https://alwjyidwlsndccezppzr.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XyAGVukPEcX_TkVwMRzMdQ_vw7uJ_NI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
