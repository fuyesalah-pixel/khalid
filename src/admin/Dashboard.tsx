'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clapperboard,
  Film,
  Image as ImageIcon,
  Share2,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Upload,
  Loader2,
  Globe,
  AlertTriangle,
} from 'lucide-react'
import {
  useSiteData,
  resolveVideoLink,
  isSafeMediaUrl,
  publishOverrides,
  fetchPublishedOverrides,
  type Overrides,
} from '@/lib/store'
import type { AdminProject, AdminSocial, AdminSkill } from '@/lib/content'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { destroySession } from './auth'

type Tab = 'videos' | 'profile' | 'socials' | 'skills'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'videos', label: 'Videos & Projects', icon: Film },
  { id: 'profile', label: 'Profile & Bio', icon: ImageIcon },
  { id: 'socials', label: 'Social Links', icon: Share2 },
  { id: 'skills', label: 'Expertise', icon: Sparkles },
]

const ease = [0.16, 1, 0.3, 1] as const

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const data = useSiteData()
  const [tab, setTab] = useState<Tab>('videos')
  const [toast, setToast] = useState<string | null>(null)

  /* Local draft: keeps admin edits visible between save operations. Saving
   * publishes to the server so every visitor picks the change up via polling. */
  const [draft, setDraft] = useState<Overrides>({})
  const [saving, setSaving] = useState(false)
  const [publishError, setPublishError] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  /**
   * Publish a patch for all visitors: merge with the current published
   * payload (so unrelated keys survive), send it to the server, and keep a
   * local copy so the admin sees the change instantly without waiting for
   * the next poll.
   */
  const save = async (patch: Overrides, message: string) => {
    setSaving(true)
    setPublishError(false)
    const next: Overrides = { ...draft, ...patch }
    setDraft(next)

    try {
      const published = await fetchPublishedOverrides()
      const merged: Overrides = {
        ...published,
        ...next,
        videoLinks: { ...published.videoLinks, ...next.videoLinks },
        projects: { ...published.projects, ...next.projects },
      }

      const ok = await publishOverrides(merged)
      if (!ok) {
        // Server unreachable / not configured — keep the change locally so
        // the admin's view stays consistent, and surface a warning.
        try {
          localStorage.setItem('khalidscut:overrides', JSON.stringify(merged))
        } catch {
          /* storage full / private mode */
        }
        setPublishError(true)
        showToast('Saved locally — could not reach the server')
        return
      }
      showToast(message)
    } finally {
      setSaving(false)
    }
  }

  const updateProject = (id: string, patch: Partial<AdminProject>) => {
    const projects = { ...draft.projects, [id]: { ...draft.projects?.[id], ...patch } }
    setDraft((d) => ({ ...d, projects }))
  }

  const saveProject = (id: string, patch: Partial<AdminProject>, videoLink?: string) => {
    /* Live edits live in draft.projects[id] — they must win over the stale
     * prop values captured in `patch`. */
    const edited = draft.projects?.[id] ?? {}
    const merged: Partial<AdminProject> = {
      ...patch,
      ...edited,
      videoUrl: videoLink ?? edited.videoUrl ?? patch.videoUrl,
    }
    const projects = { ...draft.projects, [id]: merged }
    const videoLinks =
      videoLink !== undefined
        ? { ...draft.videoLinks, [id]: videoLink }
        : draft.videoLinks
    void save({ projects, videoLinks }, 'Project saved')
  }

  const handleLogout = () => {
    destroySession()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-base pt-16">
      <div className="u-container py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-flame text-on-flame">
              <Clapperboard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="display-title text-xl md:text-2xl">Studio Dashboard</h1>
              <p className="mono-tag flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-mint" aria-hidden="true" />
                Saving publishes live to every visitor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-2 text-sm text-ink-faint">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Publishing…
              </span>
            )}
            <a href="#home" className="btn-outline px-4 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              View site
            </a>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-all ${
                tab === t.id
                  ? 'border-flame bg-flame text-on-flame'
                  : 'border-line text-ink-soft hover:border-flame/50 hover:text-flame'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease }}
          >
            {tab === 'videos' && (
              <VideosEditor
                projects={data.projects}
                videoLinks={data.videoLinks}
                onChange={updateProject}
                onSave={saveProject}
              />
            )}
            {tab === 'profile' && <ProfileEditor draft={draft} onSave={save} />}
            {tab === 'socials' && <SocialsEditor socials={data.socials} onSave={(socials) => save({ socials }, 'Social links saved')} />}
            {tab === 'skills' && <SkillsEditor skills={data.skills} onSave={(skills) => save({ skills }, 'Expertise saved')} />}
          </motion.div>
        </AnimatePresence>

        {/* Publish-failure warning */}
        <AnimatePresence>
          {publishError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-500"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Publish failed — change is only visible to you.</p>
                <p className="mt-0.5 opacity-80">
                  On Vercel: add Upstash Redis (Marketplace → Storage) and set ADMIN_PUBLISH_KEY, then redeploy.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-mint/40 bg-panel px-5 py-3 shadow-lift"
              role="status"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-base">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-ink">{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Videos & Projects editor                                            */
/* ================================================================== */

function VideosEditor({
  projects,
  videoLinks,
  onChange,
  onSave,
}: {
  projects: AdminProject[]
  videoLinks: Record<string, string>
  onChange: (id: string, patch: Partial<AdminProject>) => void
  onSave: (id: string, patch: Partial<AdminProject>, videoLink?: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Paste any YouTube or TikTok link (watch, share, Shorts, vt.tiktok.com) — the site extracts the video automatically.
      </p>
      {projects.map((project) => {
        const open = openId === project.id
        const currentLink = videoLinks[project.id] ?? project.videoUrl ?? ''
        const parsed = resolveVideoLink(currentLink)
        const parsedId = parsed?.platform === 'youtube' ? parsed.id : null
        const isTikTok = parsed?.platform === 'tiktok'
        return (
          <div key={project.id} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-[15px] font-semibold text-ink">{project.title}</h3>
                <p className="mono-tag mt-1 truncate">
                  {isTikTok
                    ? `TikTok · ${parsed?.id}`
                    : parsedId
                      ? `YT · ${parsedId}`
                      : 'No video set'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {parsedId && (
                  <img
                    src={`https://i.ytimg.com/vi/${parsedId}/default.jpg`}
                    alt=""
                    className="h-9 w-16 rounded border border-line object-cover"
                    aria-hidden="true"
                  />
                )}
                {isTikTok && (
                  <img
                    src="/tiktok-toggle.svg"
                    alt=""
                    className="h-9 w-16 rounded border border-line object-cover"
                    aria-hidden="true"
                  />
                )}
                <Button variant="ghost" size="sm" onClick={() => setOpenId(open ? null : project.id)}>
                  {open ? 'Close' : 'Edit'}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <ProjectForm
                    key={`${project.id}-editor`}
                    project={project}
                    videoLink={currentLink}
                    onChange={onChange}
                    onSave={onSave}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* Single project form — owns its own live draft state                 */
/* ================================================================== */

function ProjectForm({
  project,
  videoLink,
  onChange,
  onSave,
}: {
  project: AdminProject
  videoLink: string
  onChange: (id: string, patch: Partial<AdminProject>) => void
  onSave: (id: string, patch: Partial<AdminProject>, videoLink?: string) => void
}) {
  const [link, setLink] = useState(videoLink)
  const [form, setForm] = useState({
    title: project.title,
    subtitle: project.subtitle,
    description: project.description,
    year: project.year,
    category: project.category,
    featured: project.featured,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const parsed = resolveVideoLink(link)

  return (
    <div className="space-y-4 pt-5">
      <div>
        <Input
          label="Video link (YouTube or TikTok URL or ID)"
          value={link}
          onChange={(e) => {
            setLink(e.target.value)
            onChange(project.id, { videoUrl: e.target.value })
          }}
          placeholder="https://youtube.com/watch?v=… or https://www.tiktok.com/@user/video/…"
        />
        {link && !parsed && (
          <p className="mt-1.5 text-xs text-red-500" role="alert">
            Could not find a YouTube or TikTok video ID in that link
          </p>
        )}
        {parsed && (
          <p className="mono-tag mt-1.5">
            {parsed.platform === 'youtube' ? 'YouTube ID' : 'TikTok video'} · {parsed.id}
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Input label="Subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
      </div>
      <Textarea label="Text" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Year"
          type="number"
          value={String(form.year)}
          onChange={(e) => set('year', Number(e.target.value) || form.year)}
        />
        <Input label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} />
        <label className="flex cursor-pointer items-end gap-2 pb-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="h-4 w-4 accent-[var(--flame)]"
          />
          Featured
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => onSave(project.id, form, link)}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Save changes
        </Button>
        {parsed && (
          <a
            href={parsed.platform === 'tiktok' ? `https://www.tiktok.com/${parsed.id}` : `https://youtube.com/watch?v=${parsed.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-faint transition-colors hover:text-flame"
          >
            Preview on {parsed.platform === 'tiktok' ? 'TikTok' : 'YouTube'} ↗
          </a>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/* Profile & Bio editor                                                */
/* ================================================================== */

function ProfileEditor({ draft, onSave }: { draft: Overrides; onSave: (patch: Overrides, message: string) => void }) {
  const data = useSiteData()
  const [heroImage, setHeroImage] = useState(draft.heroImage ?? data.heroImage)
  const [bio, setBio] = useState(draft.bio ?? data.bio)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-6">
        <h3 className="mb-1 font-display text-lg font-semibold text-ink">Hero profile image</h3>
        <p className="mb-5 text-sm text-ink-soft">Paste a direct image URL (https://… or /image.png)</p>

        <div className="mb-4 flex items-center gap-4">
          <img
            src={isSafeMediaUrl(heroImage) ? heroImage : '/portfolio.png'}
            alt="Current hero"
            className="h-28 w-24 rounded-xl border border-line object-cover"
            onError={(e) => {
              e.currentTarget.src = '/portfolio.png'
            }}
          />
          <div className="flex-1">
            <Input
              label="Image URL"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://…/photo.jpg"
            />
          </div>
        </div>
        <Button size="sm" onClick={() => onSave({ heroImage }, 'Profile image saved')}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Save image
        </Button>
      </div>

      <div className="panel p-6">
        <h3 className="mb-1 font-display text-lg font-semibold text-ink">About text</h3>
        <p className="mb-5 text-sm text-ink-soft">Separate paragraphs with an empty line</p>
        <Textarea label="Bio" rows={10} value={bio} onChange={(e) => setBio(e.target.value)} />
        <Button size="sm" className="mt-4" onClick={() => onSave({ bio }, 'Bio saved')}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Save bio
        </Button>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Socials editor                                                      */
/* ================================================================== */

const SOCIAL_IDS = ['instagram', 'telegram', 'facebook', 'youtube', 'tiktok', 'linkedin'] as const

function SocialsEditor({
  socials,
  onSave,
}: {
  socials: AdminSocial[]
  onSave: (socials: AdminSocial[]) => void
}) {
  const [rows, setRows] = useState<AdminSocial[]>(socials)

  const update = (idx: number, patch: Partial<AdminSocial>) =>
    setRows((r) => r.map((s, i) => (i === idx ? { ...s, ...patch } : s)))

  return (
    <div className="panel mx-auto max-w-2xl p-6">
      <h3 className="mb-1 font-display text-lg font-semibold text-ink">Social media links</h3>
      <p className="mb-6 text-sm text-ink-soft">These appear in the contact section and footer</p>
      <div className="space-y-4">
        {rows.map((social, idx) => (
          <div key={social.id} className="grid gap-3 sm:grid-cols-[130px_1fr]">
            <Input label="Platform" value={social.label} onChange={(e) => update(idx, { label: e.target.value })} />
            <Input
              label="URL"
              value={social.url}
              onChange={(e) => update(idx, { url: e.target.value })}
              placeholder="https://…"
            />
          </div>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-6"
        onClick={() => onSave(rows.map((r) => ({ ...r, id: SOCIAL_IDS.includes(r.id as never) ? r.id : r.id })))}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        Save all links
      </Button>
    </div>
  )
}

/* ================================================================== */
/* Skills editor                                                       */
/* ================================================================== */

function SkillsEditor({ skills, onSave }: { skills: AdminSkill[]; onSave: (skills: AdminSkill[]) => void }) {
  const [rows, setRows] = useState<AdminSkill[]>(skills)
  const [dirty, setDirty] = useState(false)

  const update = (id: string, patch: Partial<AdminSkill>) => {
    setRows((r) => r.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    setDirty(true)
  }

  const remove = (id: string) => {
    setRows((r) => r.filter((s) => s.id !== id))
    setDirty(true)
  }

  const add = () => {
    const id = `skill-${Date.now()}`
    setRows((r) => [...r, { id, name: 'New tool', type: 'Video Editing', detail: '', percent: 50 }])
    setDirty(true)
  }

  return (
    <div className="panel mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Expertise</h3>
          <p className="text-sm text-ink-soft">Tool, type of work, detail and proficiency</p>
        </div>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add tool
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((skill) => (
          <div key={skill.id} className="rounded-xl border border-line p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_170px_90px_auto]">
              <Input label="Tool name" value={skill.name} onChange={(e) => update(skill.id, { name: e.target.value })} />
              <Input label="Type of work" value={skill.type} onChange={(e) => update(skill.id, { type: e.target.value })} />
              <Input
                label="%"
                type="number"
                min={0}
                max={100}
                value={String(skill.percent)}
                onChange={(e) => update(skill.id, { percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              />
              <div className="flex items-end pb-0.5">
                <button
                  onClick={() => remove(skill.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-faint transition-colors hover:border-red-500/50 hover:text-red-500"
                  aria-label={`Delete ${skill.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <Input label="Detail" value={skill.detail} onChange={(e) => update(skill.id, { detail: e.target.value })} />
            </div>
          </div>
        ))}
      </div>

      <Button size="sm" className="mt-6" disabled={!dirty} onClick={() => onSave(rows)}>
        <Check className="h-4 w-4" aria-hidden="true" />
        Save expertise
      </Button>
    </div>
  )
}
