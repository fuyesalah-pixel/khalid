'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowUpRight,
  Tv,
  Clapperboard,
  Image as ImageIcon,
  Film,
  Globe,
} from 'lucide-react'
import { useSiteData } from '@/lib/store'
import { Badge } from '@/components/ui/Badge'
import { ActiveVideoProvider, VideoEmbed } from '@/components/ui/VideoEmbed'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/utils'
import type { AdminProject } from '@/lib/content'

const categoryIcons: Record<string, React.ReactNode> = {
  'Broadcast Design': <Tv className="h-3 w-3" />,
  Commercial: <Clapperboard className="h-3 w-3" />,
  'Personal Branding': <ImageIcon className="h-3 w-3" />,
  Documentary: <Film className="h-3 w-3" />,
  'Travel & Tourism': <Globe className="h-3 w-3" />,
  'Event & Social': <Clapperboard className="h-3 w-3" />,
}

const ease = [0.16, 1, 0.3, 1] as const

type RowKind = 'youtube' | 'tiktok'

function rowFor(p: AdminProject): RowKind | null {
  const platform = p.videoLink?.platform
  if (platform === 'tiktok') return 'tiktok'
  if (platform === 'youtube') return 'youtube'
  return null
}

/**
 * Horizontal snap scroller — one shared implementation for the YouTube row
 * (16:9 cards) and the TikTok row (9:16 cards). Cards are sized big enough
 * to read on phones; one live player is shared via ActiveVideoProvider, so
 * only a single TikTok/YouTube iframe ever exists on the page (TikTok serves
 * 429 when several embed iframes spawn at once).
 */
function VideoScroller({
  kind,
  projects,
  onOpenProject,
}: {
  kind: RowKind
  projects: AdminProject[]
  onOpenProject: (p: AdminProject) => React.ReactNode
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const first = el.querySelector<HTMLElement>('[data-card]')
    const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  const rowLabel = kind === 'tiktok' ? 'TikTok' : 'YouTube'

  if (projects.length === 0) return null

  return (
    <div className="relative">
      {/* Row heading + arrows (desktop) */}
      <div className="mb-3 flex items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-flame" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            {rowLabel} · {projects.length}
          </span>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label={`Scroll ${rowLabel} row left`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-flame/60 hover:text-flame"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label={`Scroll ${rowLabel} row right`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-flame/60 hover:text-flame"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scroller — full-bleed: the track is wider than the container, */}
      {/* bleeding to the screen edge on both sides. */}
      <div className="u-container relative me-0 ms-0 !px-0" aria-hidden="true" />
      <div
        ref={scrollerRef}
        data-scroller
        className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:gap-5 md:-mx-8 md:px-8"
        style={{ scrollPaddingLeft: 20 }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            data-card
            className={cn(
              'shrink-0 snap-start',
              kind === 'tiktok'
                ? /* TikTok 9:16 — bigger cards so the video is actually usable on phones */
                  'w-[68vw] max-w-[280px] sm:w-[240px] md:w-[260px] lg:w-[300px]'
                : /* YouTube 16:9 */
                  'w-[82vw] max-w-[520px] sm:w-[420px] md:w-[400px] lg:w-[440px]',
            )}
          >
            {onOpenProject(project)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Work() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const { projects } = useSiteData()

  const categories = ['all', ...Array.from(new Set(projects.map((p) => p.category)))]
  const filteredProjects =
    activeCategory === 'all' ? projects : projects.filter((p) => p.category === activeCategory)

  const ytProjects = filteredProjects.filter((p) => rowFor(p) === 'youtube')
  const ttProjects = filteredProjects.filter((p) => rowFor(p) === 'tiktok')
  const otherProjects = filteredProjects.filter((p) => rowFor(p) === null)

  const renderCard = (project: AdminProject) => (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease }}
      className="group panel panel-hover cursor-pointer overflow-hidden"
      tabIndex={0}
    >
      {/* Thumb — real video embed when available, styled poster otherwise */}
      {project.videoLink ? (
        <VideoEmbed
          platform={project.videoLink.platform}
          videoId={project.videoLink.id}
          title={project.title}
        />
      ) : (
        <div className="relative aspect-video overflow-hidden bg-raised">
          <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-flame/40 bg-flame/10 text-flame transition-all duration-500 group-hover:scale-110 group-hover:bg-flame group-hover:text-on-flame sm:h-14 sm:w-14">
              <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" aria-hidden="true" />
            </span>
          </div>
          <span className="absolute bottom-3 left-3 font-mono text-[11px] text-ink-faint">
            {project.year}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-flame">
              {project.title}
            </h3>
            <p className="mt-0.5 text-sm text-ink-soft">{project.subtitle}</p>
          </div>
          <ArrowUpRight
            className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-flame"
            aria-hidden="true"
          />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded border border-line px-2 py-0.5 text-[11px] text-ink-soft">
            {project.category}
          </span>
          <span className="rounded border border-line px-2 py-0.5 text-[11px] text-ink-soft">
            {project.year}
          </span>
        </div>
      </div>

      {/* Category / featured overlays */}
      <div className="pointer-events-none absolute left-3.5 top-3.5 z-10">
        <Badge variant="default">
          {categoryIcons[project.category]}
          {project.category}
        </Badge>
      </div>
      {project.featured && (
        <div className="pointer-events-none absolute right-3.5 top-3.5 z-10">
          <Badge variant="accent">Featured</Badge>
        </div>
      )}
    </motion.article>
  )

  return (
    <ActiveVideoProvider>
      <section id="work" className="u-section relative bg-panel/40" aria-labelledby="work-title">
        <div className="u-container">
          <SectionHeader
            index="02"
            eyebrow="Selected work"
            title={
              <>
                Projects that <span className="text-gradient-flame">speak volumes.</span>
              </>
            }
            description="Broadcast identities, launch campaigns, documentaries and short-form — a curated cut of client work across six years of screens."
          />

          {/* Filter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="Project categories"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                role="tab"
                aria-selected={activeCategory === cat}
                className={cn(
                  'rounded-full border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-all duration-300',
                  activeCategory === cat
                    ? 'border-flame bg-flame text-on-flame'
                    : 'border-line text-ink-soft hover:border-flame/50 hover:text-flame',
                )}
              >
                {cat === 'all' ? 'All work' : cat}
              </button>
            ))}
          </motion.div>

          {/* Two side-scrolling rows: YouTube (16:9) then TikTok (9:16) */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="space-y-10"
            role="tabpanel"
          >
            <VideoScroller kind="youtube" projects={ytProjects} onOpenProject={renderCard} />
            <VideoScroller kind="tiktok" projects={ttProjects} onOpenProject={renderCard} />
          </motion.div>

          {/* Fallback row for projects without a video link */}
          {otherProjects.length > 0 && (
            <OtherProjectsRow projects={otherProjects} renderCard={renderCard} />
          )}
        </div>
      </section>
    </ActiveVideoProvider>
  )
}

/** Vertical list for projects that have no video link (rare fallback) */
function OtherProjectsRow({
  projects,
  renderCard,
}: {
  projects: AdminProject[]
  renderCard: (p: AdminProject) => React.ReactNode
}) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-flame" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          More projects
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id}>{renderCard(p)}</div>
        ))}
      </div>
    </div>
  )
}
