/**
 * oEmbed endpoint for the portfolio. Fetches TikTok's oEmbed API server-side
 * and returns the thumbnail_url so the client can render a poster image for
 * TikTok videos without a browser-side CORS block.
 *
 * GET /api/oembed?url=<tiktok-video-url>
 *  -> { thumbnail_url }
 *
 * Caches results in-memory for 1 hour. TikTok thumbnails expire (signed
 * URLs), but 1 hour is plenty for a browsing session.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const CACHE = new Map() // url -> { thumbnail_url | null, ts }
const TTL_MS = 60 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const target = String(req.query.url || '')
  if (!/^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/(video|photo|v)\/\d+/.test(target)) {
    return res.status(400).json({ ok: false, error: 'Not a TikTok video URL' })
  }

  const cached = CACHE.get(target)
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return res
      .status(200)
      .setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`)
      .json({ ok: true, thumbnail_url: cached.thumbnail_url })
  }

  try {
    const r = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(target)}`,
      { headers: { 'User-Agent': UA, Accept: 'application/json' } },
    )
    if (!r.ok) throw new Error(`TikTok ${r.status}`)
    const json = await r.json()
    const thumbnail_url = typeof json?.thumbnail_url === 'string' ? json.thumbnail_url : null
    CACHE.set(target, { thumbnail_url, ts: Date.now() })
    return res
      .status(200)
      .setHeader('Cache-Control', `public, max-age=${TTL_MS / 1000}`)
      .json({ ok: true, thumbnail_url })
  } catch (err) {
    console.error('oembed proxy failed', err)
    CACHE.set(target, { thumbnail_url: null, ts: Date.now() })
    return res.status(200).json({ ok: true, thumbnail_url: null })
  }
}
