import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = { 'Access-Control-Allow-Origin': '*' }

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = new URL(req.url)
  const matchId = url.searchParams.get('match_id')
  if (!matchId?.trim()) {
    return new Response('match_id query parameter is required', { status: 400, headers: cors })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return new Response('Missing SUPABASE_URL or SUPABASE_ANON_KEY', { status: 500, headers: cors })
  }

  const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') ?? 'http://localhost:5173').replace(/\/$/, '')
  const supabase = createClient(supabaseUrl, anonKey)

  const { data: match, error } = await supabase
    .from('matches')
    .select('id, starts_at, type, price_lbp, venues(name)')
    .eq('id', matchId.trim())
    .eq('status', 'scheduled')
    .maybeSingle()

  if (error || !match) {
    const body = '<!DOCTYPE html><html><head><title>Malaab</title></head><body>Match not found</body></html>'
    return new Response(body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors } })
  }

  const v = match.venues as { name?: string } | { name?: string }[] | null
  const venueName = Array.isArray(v) ? (v[0]?.name ?? 'Venue') : (v?.name ?? 'Venue')
  const title = `${venueName} · Malaab`
  const desc = `${match.type} · ${match.price_lbp} LBP · ${match.starts_at}`
  const canonUrl = `${siteUrl}/match/${match.id}`
  const ogImage = `${siteUrl}/venues/4b.png`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${escapeHtml(canonUrl)}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(desc)}"/>
<meta property="og:url" content="${escapeHtml(canonUrl)}"/>
<meta property="og:type" content="website"/>
<meta property="og:image" content="${escapeHtml(ogImage)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(desc)}"/>
</head>
<body>
<p><a href="${escapeHtml(canonUrl)}">Open in Malaab</a></p>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors } })
})
