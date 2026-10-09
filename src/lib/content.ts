/* Editable content model shared by the public site and the admin dashboard */

export type VideoPlatform = 'youtube' | 'tiktok'

export interface AdminProject {
  id: string
  title: string
  /** Short line under the title (client / one-line pitch) */
  subtitle: string
  description: string
  /** Full YouTube or TikTok URL (or raw YouTube id) */
  videoUrl?: string
  /** Resolved 11-char YouTube id (computed by the store from videoUrl) */
  videoId?: string
  /** Resolved embed descriptor (platform + embed id) — computed by the store */
  videoLink?: { platform: VideoPlatform; id: string; url: string }
  year: number
  category: string
  featured: boolean
}

export interface AdminSocial {
  /** instagram | telegram | facebook | youtube | tiktok | linkedin */
  id: string
  label: string
  url: string
}

export interface AdminSkill {
  id: string
  name: string
  /** Type of work / category label */
  type: string
  detail: string
  /** 0 - 100 */
  percent: number
}

export const defaultBio = `Senior Video Editor & Social Media Strategist with 4+ years of experience crafting compelling visual narratives for broadcast networks, global brands, and high-growth creators. I specialize in transforming raw footage into polished, platform-optimized content that drives engagement and converts viewers into loyal audiences.

My expertise spans the full production pipeline: from pre-production planning and on-set direction through advanced post-production including color grading, motion graphics, and sound design. I combine technical mastery of industry-standard tools with a deep understanding of social algorithms and audience psychology.

Whether it's a 30-second viral Reel, a 6-episode documentary series, or a complete broadcast network rebrand, I bring the same level of craft, creativity, and strategic thinking to every project.`

export const defaultHeroImage = '/portfolio.png'

export const defaultProjects: AdminProject[] = [
  {
    id: 'nejashi-tv',
    title: 'Nejashi TV — Broadcast Identity',
    subtitle: 'Nejashi TV · Network rebrand',
    description:
      'Complete visual identity package for a major television network including lower thirds, transitions, bumpers, and show packaging. Delivered 200+ motion assets in 6 weeks.',
    videoUrl: 'https://youtu.be/pe1IgKrL91M',
    year: 2024,
    category: 'Broadcast Design',
    featured: true,
  },
  {
    id: 'dana-production',
    title: 'Dana Production — Documentary Series',
    subtitle: 'Documentary · 6 episodes',
    description:
      'Edited 6-episode documentary series with complex narrative structure, archival footage integration, and multilingual subtitles. Selected for international film festival.',
    videoUrl: 'https://youtu.be/Y5Y3ZEB76Zs',
    year: 2022,
    category: 'Documentary',
    featured: true,
  },
  {
    id: 'lawyer-addiss',
    title: 'Lawyer Addiss Mohammed — Personal Brand',
    subtitle: 'Personal branding · Short-form series',
    description:
      'Built complete personal brand video strategy including educational series, client testimonials, and short-form content. Increased consultation requests by 300%.',
    videoUrl: 'https://youtu.be/WtSMLH0hTpE',
    year: 2023,
    category: 'Personal Branding',
    featured: true,
  },
  {
    id: 'shadow-battery',
    title: 'Shadow Battery — Product Launch',
    subtitle: 'Shadow Battery · 3D commercial',
    description:
      'High-energy product launch campaign featuring 3D product visualization, kinetic typography, and multi-platform deliverables. Generated 500K+ views in first week.',
    videoUrl: 'https://www.tiktok.com/@zumi_industryplc/video/7628946721170574599',
    year: 2024,
    category: 'Commercial',
    featured: true,
  },
  {
    id: 'diya-production',
    title: 'Diya Production — Event Films',
    subtitle: 'Diya Production · Event highlight',
    description:
      'Wedding and event highlight films cut for vertical-first social reach — fast hooks, clean pacing and music-synced edits that hold attention to the last frame.',
    videoUrl: 'https://www.tiktok.com/@diya_nesre/video/7684558765202459912',
    year: 2025,
    category: 'Event & Social',
    featured: false,
  },
  {
    id: 'togt-travel',
    title: 'TOGT Tour & Travel — Campaigns',
    subtitle: 'Travel · Drone cinematography',
    description:
      'Created seasonal destination campaigns for 10+ locations combining drone cinematography, cultural storytelling, and conversion-focused CTAs. Boosted bookings 45%.',
    videoUrl: 'https://www.tiktok.com/@togtourandtravels/video/7677847465130970389',
    year: 2022,
    category: 'Travel & Tourism',
    featured: false,
  },
]

export const defaultSocials: AdminSocial[] = [
  { id: 'instagram', label: 'Instagram', url: 'https://instagram.com/khalidmubarek' },
  { id: 'telegram', label: 'Telegram', url: 'https://t.me/Khalid_4mubarek' },
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com/khalidmubarek' },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com/@khalidmubarek' },
  { id: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@khalidmubarek' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/khalidmubarek' },
]

export const defaultSkills: AdminSkill[] = [
  { id: 'premiere', name: 'Adobe Premiere Pro', type: 'Video Editing', detail: 'Advanced timeline editing, multicam, proxy workflows', percent: 95 },
  { id: 'after-effects', name: 'Adobe After Effects', type: 'Motion Graphics', detail: 'Motion graphics, VFX, expressions, templating', percent: 90 },
  { id: 'davinci', name: 'DaVinci Resolve', type: 'Color Grading', detail: 'Professional color grading, Fusion, Fairlight audio', percent: 88 },
  { id: 'capcut', name: 'CapCut Pro', type: 'Video Editing', detail: 'Short-form content, trending effects, templates', percent: 85 },
  { id: 'photoshop', name: 'Adobe Photoshop', type: 'Creative Direction', detail: 'Retouching, compositing, matte painting, thumbnails', percent: 92 },
  { id: 'illustrator', name: 'Adobe Illustrator', type: 'Creative Direction', detail: 'Vector graphics, logos, motion design assets', percent: 85 },
  { id: 'cinema4d', name: 'Cinema 4D Lite', type: 'Motion Graphics', detail: '3D motion graphics integration with After Effects', percent: 70 },
  { id: 'content-strategy', name: 'Content Strategy', type: 'Social Media', detail: 'Viral content frameworks, audience growth, monetization', percent: 90 },
  { id: 'analytics', name: 'Analytics & Growth', type: 'Social Media', detail: 'Data-driven optimization, A/B testing, ROI tracking', percent: 85 },
  { id: 'multi-platform', name: 'Multi-Platform Management', type: 'Social Media', detail: 'Instagram, TikTok, YouTube, LinkedIn, X', percent: 92 },
  { id: 'community', name: 'Community Building', type: 'Social Media', detail: 'Engagement strategies, brand loyalty, UGC campaigns', percent: 88 },
  { id: 'cinematography', name: 'Cinematography', type: 'Creative Direction', detail: 'Camera operation, lighting, composition, visual storytelling', percent: 85 },
  { id: 'directing', name: 'Directing', type: 'Creative Direction', detail: 'Creative direction, talent management, shot planning', percent: 80 },
  { id: 'scriptwriting', name: 'Script Writing', type: 'Creative Direction', detail: 'Commercial scripts, documentary narratives, social hooks', percent: 82 },
  { id: 'photography', name: 'Photography', type: 'Creative Direction', detail: 'Portrait, product, event, behind-the-scenes', percent: 80 },
  { id: 'sound-design', name: 'Sound Design', type: 'Technical', detail: 'Audio mixing, SFX, music licensing, voiceover direction', percent: 75 },
  { id: 'live-streaming', name: 'Live Streaming', type: 'Technical', detail: 'OBS, StreamYard, multi-camera live production', percent: 70 },
]

/* Contact routing — messages go to both Telegram and email */
export const CONTACT_EMAIL = 'khalidmubarek99@gmail.com'
export const CONTACT_TELEGRAM = 'https://t.me/Khalid_4mubarek'
export const TELEGRAM_USERNAME = 'Khalid_4mubarek'
