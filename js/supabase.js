import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://cmqnicfsfwdwvqfhojez.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_w2-oXsXem9v8MUkTp9XCHA_JT35JKcu'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export { supabase }
