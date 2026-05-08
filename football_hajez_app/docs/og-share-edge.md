# Link previews (Open Graph) for `/match/:id`

The SPA updates `<title>` and `og:*` meta tags in the browser when a user opens a match. Many chat and social crawlers fetch HTML **without** executing JavaScript, so they only see the static `index.html` shell.

## Supabase Edge Function `share-match`

`supabase/functions/share-match/index.ts` returns a minimal HTML document with `og:title`, `og:description`, `og:url`, and `og:image` for a given match.

Deploy:

```bash
cd football_hajez_app
supabase functions deploy share-match --no-verify-jwt
```

Set the function secret (or project env) **`PUBLIC_SITE_URL`** to your real app origin (for example `https://your-app.example.com`). The function uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` automatically in hosted Supabase.

Invoke:

`https://<project-ref>.supabase.co/functions/v1/share-match?match_id=<uuid>`

## Wiring crawlers to the function

Point **bot user-agents** (Facebook, Slack, Twitter, iMessage, etc.) at the function response when they request your canonical match URL, or expose the function URL as the shared link for previews only. The exact mechanism depends on your host:

- **Cloudflare**: Worker or Snippet that checks `User-Agent` and proxies to the function for bots.
- **Netlify**: Edge function on `/match/*` returning the function fetch for known crawler UAs.
- **Vercel**: `middleware.ts` with the same pattern.

Humans should still load the SPA at `/match/:id` so the app works normally.
