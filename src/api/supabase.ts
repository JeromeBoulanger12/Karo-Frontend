import { createClient } from '@supabase/supabase-js'

// One Supabase client for the whole app: the auth composable, the API interceptor and the sign-up page share its session.
// Project in Canada (Central, Montréal). The publishable key is public by design; the tables are not reachable with it.
const SUPABASE_URL = 'https://alwjyidwlsndccezppzr.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XyAGVukPEcX_TkVwMRzMdQ_vw7uJ_NI'

// Read before the client clears the address: the reset page only opens from a recovery email,
// and an expired or already used link comes back with an error code instead of a session
const authRedirect = window.location.hash
export const openedFromRecoveryLink = /type=recovery/.test(authRedirect)
export const recoveryLinkFailed = /error_code=/.test(authRedirect)

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
