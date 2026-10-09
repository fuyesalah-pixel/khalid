import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import {
  defaultBio,
  defaultHeroImage,
  defaultProjects,
  defaultSocials,
  defaultSkills,
  type AdminProject,
  type AdminSocial,
  type AdminSkill,
} from './content'

export interface Overrides {
  bio?: string
  heroImage?: string
  videoLinks?: Record<string, string> // projectId -> full YouTube url or id
  projects?: Record<string, Partial<AdminProject>> // projectId -> field edits
  socials?: AdminSocial[]
  skills?: AdminSkill[]
}

const LS_KEY = 'khalidscut:overrides'
const API_ENDPOINT = '/api/overrides'

/* ------------------------------------------------------------------ */
/* Video link helpers (YouTube + TikTok)                               */
/* ------------------------------------------------------------------ */

export type VideoPlatform = 'youtube' | 'tiktok'

export interface ResolvedVideo {
  platform: VideoPlatform
  /** YouTube video id, or TikTok "@handle/videoId" pair */
  id: string
  /** Canonical URL for an "open on YouTube/TikTok" link */
  url: string
}

/** Accepts a full YouTube URL (watch, youtu.be, shorts, embed, live) or a raw ID */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      const m = url.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/)
      return m?.[2] ?? null
    }
  } catch {
    /* not a URL */
  }
  const bare = trimmed.match(/[\w-]{11}/)
  return bare?.[0] ?? null
}

/** Accepts a TikTok video URL — full, canonical, or vt.tiktok.com short — and
 * returns the "@handle/videoId" string used by TikTok's embed endpoints. */
export function extractTikTokVideo(input: string): string | null {
  if (!input) return null
  try {
    const url = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`)
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
    if (!(host === 'tiktok.com' || host.endsWith('.tiktok.com'))) return null

    // Short links (vt.tiktok.com/xxxx) redirect to the canonical
    // /@handle/video/<id> page, so just treat them as TikTok links whose id
    // is still unknown until the browser follows the redirect.
    if (host === 'vt.tiktok.com') return null

    const m = url.pathname.match(/\/@([\w.-]+?)\/(?:video|photo)\/(\d+)/)
    return m ? `@${m[1]}/video/${m[2]}` : null
  } catch {
    return null
  }
}

/**
 * Resolve any supported video link (YouTube or TikTok) into a uniform
 * descriptor the embed components can render. Returns null for
 * unrecognized links.
 */
export function resolveVideoLink(input: string | undefined): ResolvedVideo | null {
  if (!input) return null
  const trimmed = input.trim()

  const tiktok = extractTikTokVideo(trimmed)
  if (tiktok) {
    return { platform: 'tiktok', id: tiktok, url: `https://www.tiktok.com/${tiktok}` }
  }

  const yt = extractYouTubeId(trimmed)
  if (yt) {
    return { platform: 'youtube', id: yt, url: `https://youtube.com/watch?v=${yt}` }
  }

  return null
}

/** Any direct image/video URL (used for hero profile image) */
export function isSafeMediaUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('/')
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

function loadLocal(): Overrides {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Overrides) : {}
  } catch {
    return {}
  }
}

async function loadRemote(): Promise<Overrides> {
  /* Served by the Vercel function in prod and by the Vite dev middleware
   * locally — both return empty overrides when no storage is configured. */
  try {
    const res = await fetch(`${API_ENDPOINT}?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      return (json.overrides ?? {}) as Overrides
    }
  } catch {
    /* static hosting without API — fine */
  }
  return {}
}

/**
 * Server overrides win. localStorage edits are applied only for keys the
 * server hasn't published yet — so an admin sees their draft instantly while
 * everyone else sees the published state, and once a change is published
 * every visitor (including the admin) converges on it.
 */
function mergeOverrides(local: Overrides, remote: Overrides): Overrides {
  return {
    bio: remote.bio ?? local.bio,
    heroImage: remote.heroImage ?? local.heroImage,
    videoLinks: { ...local.videoLinks, ...remote.videoLinks },
    projects: { ...local.projects, ...remote.projects },
    socials: remote.socials ?? local.socials,
    skills: remote.skills ?? local.skills,
  }
}

export interface SiteData {
  bio: string
  heroImage: string
  videoLinks: Record<string, string>
  projects: AdminProject[]
  socials: AdminSocial[]
  skills: AdminSkill[]
}

function computeData(o: Overrides): SiteData {
  const projects = defaultProjects.map((p) => {
    const edit = o.projects?.[p.id] ?? {}
    const rawVideo = o.videoLinks?.[p.id] ?? edit.videoUrl ?? p.videoUrl
    return {
      ...p,
      ...edit,
      videoUrl: rawVideo,
      videoId: (rawVideo ? extractYouTubeId(rawVideo) : null) ?? undefined,
      videoLink: resolveVideoLink(rawVideo) ?? undefined,
    }
  })
  return {
    bio: o.bio ?? defaultBio,
    heroImage: o.heroImage ?? defaultHeroImage,
    videoLinks: o.videoLinks ?? {},
    projects,
    socials: o.socials ?? defaultSocials,
    skills: o.skills ?? defaultSkills,
  }
}

const SiteDataContext = createContext<SiteData>(computeData({}))

/**
 * Live content source. Pulls the published overrides from the server on
 * mount and polls every few seconds, so admin changes appear for every
 * visitor without a reload.
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({})

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const refresh = async () => {
      const [local, remote] = await Promise.all([Promise.resolve(loadLocal()), loadRemote()])
      if (!cancelled) {
        setOverrides(mergeOverrides(local, remote))
        // Continue polling only while the tab is visible
        if (!cancelled && !document.hidden) {
          timer = setTimeout(refresh, POLL_MS)
        } else if (!cancelled) {
          document.addEventListener('visibilitychange', onceVisible, { once: true })
        }
      }
    }

    const onceVisible = () => {
      if (!document.hidden && !cancelled) refresh()
    }

    refresh()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const data = computeData(overrides)

  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>
}

const POLL_MS = 5000

export function useSiteData(): SiteData {
  return useContext(SiteDataContext)
}

/** Read the current published overrides (used by the admin dashboard) */
export async function fetchPublishedOverrides(): Promise<Overrides> {
  return loadRemote()
}

/**
 * Publish overrides for everyone. Sends the full merged payload to the
 * server (Upstash Redis via the API) and clears this browser's local draft.
 */
export async function publishOverrides(next: Overrides): Promise<boolean> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_PUBLISH_KEY,
      },
      body: JSON.stringify(next),
    })
    if (!res.ok) return false
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      /* private mode */
    }
    return true
  } catch {
    return false
  }
}

/** Shared between the dashboard and the API route. */
export const ADMIN_PUBLISH_KEY = 'khalidscut-admin-2026'

/**
 * True when the current browser has a local draft (admin pre-publish view).
 */
export function useHasLocalEdits(): boolean {
  try {
    return !!localStorage.getItem(LS_KEY)
  } catch {
    return false
  }
}
