/**
 * Vite dev middleware: emulates the Vercel /api/overrides + /api/contact
 * serverless functions during `npm run dev`, so the live-update flow can be
 * developed and tested locally.
 *
 * - GET  /api/overrides -> reads .freebuff/dev-overrides.json
 * - POST /api/overrides -> writes it (requires x-admin-key, same as prod)
 * - POST /api/contact   -> logs the message and returns ok (no Telegram/email
 *                          keys locally; the client falls back gracefully)
 * - GET  /api/oembed    -> TikTok oEmbed thumbnail proxy (mirrors api/oembed.js)
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const STORE_FILE = path.resolve(process.cwd(), '.freebuff/dev-overrides.json')
const ADMIN_KEY = 'khalidscut-admin-2026' // keep in sync with src/lib/store.tsx

/* In-memory cache for TikTok oEmbed responses — mirrors api/oembed.js so the
 * dev server doesn't hammer TikTok (rate-limit 429) when several cards
 * resolve thumbnails at once. 1-hour TTL: oEmbed thumbnails are signed URLs. */
const OEMBED_TTL_MS = 60 * 60 * 1000
const oembedCache = new Map<string, { thumbnail_url: string | null; ts: number }>()

function readStore(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeStore(data: unknown): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2))
}

export function apiDevPlugin(): Plugin {
  return {
    name: 'dev-api-overrides',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const url = req.url.split('?')[0]

        if (url === '/api/overrides' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, overrides: readStore() }))
          return
        }

        if (url === '/api/overrides' && req.method === 'POST') {
          if (req.headers['x-admin-key'] !== ADMIN_KEY) {
            res.statusCode = 401
            res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }))
            return
          }
          let body = ''
          req.on('data', (chunk: Buffer) => (body += chunk))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              if (!payload || typeof payload !== 'object') throw new Error('bad payload')
              writeStore(payload)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, persisted: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid payload' }))
            }
          })
          return
        }

        if (url === '/api/oembed' && req.method === 'GET') {
          const target = new URL(req.url, 'http://localhost').searchParams.get('url') ?? ''
          const m = target.match(/^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/(video|photo|v)\/(\d+)/)
          if (!m) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: 'Not a TikTok video URL' }))
            return
          }
          try {
            const cached = oembedCache.get(m[0])
            if (cached && Date.now() - cached.ts < OEMBED_TTL_MS) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', `public, max-age=${OEMBED_TTL_MS / 1000}`)
              res.end(JSON.stringify({ ok: true, thumbnail_url: cached.thumbnail_url }))
              return
            }
            const r = await fetch(
              `https://www.tiktok.com/oembed?url=${encodeURIComponent(m[0])}`,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                  Accept: 'application/json',
                },
              },
            )
            if (!r.ok) throw new Error(`TikTok ${r.status}`)
            const json = (await r.json()) as { thumbnail_url?: string }
            const thumbnail_url = json.thumbnail_url ?? null
            oembedCache.set(m[0], { thumbnail_url, ts: Date.now() })
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', `public, max-age=${OEMBED_TTL_MS / 1000}`)
            res.end(JSON.stringify({ ok: true, thumbnail_url }))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, thumbnail_url: null }))
          }
          return
        }

        if (url === '/api/contact' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: Buffer) => (body += chunk))
          req.on('end', () => {
            try {
              const { name, email, subject, message } = JSON.parse(body || '{}')
              console.log('— contact form (dev, not delivered) —')
              console.log(`  name: ${name}  email: ${email}`)
              console.log(`  subject: ${subject}`)
              console.log(`  message: ${String(message).slice(0, 140)}`)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, dev: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid payload' }))
            }
          })
          return
        }

        next()
      })
    },
  }
}
