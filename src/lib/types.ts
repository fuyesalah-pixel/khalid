export interface Project {
  id: string
  title: string
  client: string
  category: string
  description: string
  thumbnail: string
  videoUrl?: string
  /** YouTube video id for the case-study/showreel embed */
  videoId?: string
  /** Resolved embed descriptor (platform + id) — added for YouTube/TikTok support */
  videoLink?: { platform: 'youtube' | 'tiktok'; id: string; url: string }
  images: string[]
  tags: string[]
  role: string
  year: number
  featured: boolean
}

export interface Skill {
  id: string
  name: string
  category: 'editing' | 'motion' | 'color' | 'social' | 'creative' | 'technical'
  proficiency: number
  icon: string
  description?: string
}

export interface Experience {
  id: string
  company: string
  role: string
  period: string
  location: string
  description: string
  achievements: string[]
  technologies: string[]
  type: 'full-time' | 'freelance' | 'project'
}

export interface SocialLink {
  platform: string
  url: string
  icon: string
  label: string
}

export interface ContactInfo {
  email: string
  phone: string[]
  location: string
  socialLinks: SocialLink[]
}

export interface Stats {
  label: string
  value: string | number
  suffix?: string
  prefix?: string
}

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export type Theme = 'light' | 'dark'

export interface AnimationVariants {
  hidden: Record<string, unknown>
  visible: Record<string, unknown>
  exit?: Record<string, unknown>
}