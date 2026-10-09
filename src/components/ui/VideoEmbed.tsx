'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VideoPlatform = 'youtube' | 'tiktok'

interface VideoEmbedProps {
  platform: VideoPlatform
  /** YouTube video id, or TikTok "@handle/videoId" pair */
  videoId: string
  title: string
  className?: string
  /** Extra classes for the iframe/poster wrapper height inside the card */
  frameClassName?: string
}

/**
 * Only one embedded player may be *live* on the page at a time. Opening a
 * new player unmounts the previous one — TikTok serves 429 "too many
 * requests" when several embed iframes load simultaneously, and stacked
 * autoplaying iframes hurt browsers on small phones.
 */
const ActiveVideoContext = createContext<{
  activeKey: string | null
  setActiveKey: (key: string | null) => void
}>({ activeKey: null, setActiveKey: () => {} })

/** Wraps a section's video cards — provide one per page. */
export function ActiveVideoProvider({ children }: { children: React.ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  return (
    <ActiveVideoContext.Provider value={{ activeKey, setActiveKey }}>
      {children}
    </ActiveVideoContext.Provider>
  )
}

/**
 * Custom-styled video embed. Uses NO brand players by default — the poster
 * layer handles click-to-play the same way for both YouTube (16:9 iframe) and
 * TikTok (9:16 iframe), so it reads as part of the portfolio rather than
 * YouTube/TikTok branding.
 *
 * The player frame sizes off its container (absolute inset-0), so until it is
 * activated the poster keeps the same aspect box as the live player, and on
 * small phones each card can size itself via `frameClassName`.
 */
export function VideoEmbed({ platform, videoId, title, className, frameClassName }: VideoEmbedProps) {
  const { activeKey, setActiveKey } = useContext(ActiveVideoContext)
  const key = `${platform}:${videoId}`
  const [tiktokThumb, setTiktokThumb] = useState<string | null>(null)
  const isTikTok = platform === 'tiktok'
  const active = activeKey === key

  /* TikTok has no predictable CDN thumbnail URL — resolve it once via the
   * oEmbed proxy (/api/oembed, cached server-side and by the browser).
   * Only fetch when this card is actually mounted on screen-close (mounted
   * lazily by the scroller), which keeps request volume far below TikTok's
   * rate limits. YouTube uses static i.ytimg posters. */
  useEffect(() => {
    if (!isTikTok || active) return
    let cancelled = false
    const canonical = `https://www.tiktok.com/${videoId}`
    fetch(`/api/oembed?url=${encodeURIComponent(canonical)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { thumbnail_url?: string | null } | null) => {
        if (!cancelled && json?.thumbnail_url) setTiktokThumb(json.thumbnail_url)
      })
      .catch(() => {
        /* leave poster state — the styled fallback shows */
      })
    return () => {
      cancelled = true
    }
  }, [isTikTok, videoId, active])

  const frame = isTikTok ? 'aspect-[9/16]' : 'aspect-video'

  const embedSrc = isTikTok
    ? `https://www.tiktok.com/embed/v2/${videoId.split('/video/')[1] ?? ''}`
    : `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&iv_load_policy=3&playsinline=1&color=white`

  const posterSrc = isTikTok ? '' : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div
      className={cn(
        'group/video relative isolate w-full overflow-hidden bg-raised',
        frame,
        frameClassName,
        className,
      )}
    >
      {active ? (
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActiveKey(key)}
          className="absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play video: ${title}`}
        >
          {/* Poster layer — ytimg hqdefault always exists; TikTok resolved via oEmbed,
              with a styled grid fallback while it loads (or if it fails) */}
          {(!isTikTok || tiktokThumb) && (
            <img
              src={isTikTok ? tiktokThumb! : posterSrc}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover/video:scale-[1.03] group-hover/video:opacity-100"
            />
          )}
          {isTikTok && !tiktokThumb && (
            <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />
          )}
          {/* Readability + brand tint */}
          <div className="absolute inset-0 bg-gradient-to-t from-base/90 via-base/20 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 bg-flame/0 transition-colors duration-500 group-hover/video:bg-flame/10" aria-hidden="true" />

          {/* Center play button */}
          <span
            className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-flame/50 bg-base/70 text-flame backdrop-blur-md transition-all duration-500 group-hover/video:scale-110 group-hover/video:bg-flame group-hover/video:text-on-flame sm:h-14 sm:w-14"
            aria-hidden="true"
          >
            <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
          </span>

          {/* Bottom-left chip instead of YouTube/TikTok branding */}
          <span
            className="absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-lg border border-line bg-base/80 px-2.5 py-1 backdrop-blur-md sm:bottom-3.5 sm:left-3.5 sm:px-3 sm:py-1.5"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-flame" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft sm:text-[11px]">
              {isTikTok ? 'PLAY TIKTOK' : 'PLAY SHOWREEL'}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
