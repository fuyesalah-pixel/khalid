'use client'

import { motion } from 'framer-motion'
import { Film, Sparkles, Award, Globe } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useSiteData } from '@/lib/store'

const specialties = [
  { icon: Film, title: 'Video Editing', desc: 'Premiere Pro, DaVinci, CapCut — broadcast to short-form' },
  { icon: Sparkles, title: 'Motion Graphics', desc: 'After Effects, Cinema 4D — kinetic type to VFX' },
  { icon: Award, title: 'Color Grading', desc: 'DaVinci Resolve — cinematic looks & HDR delivery' },
  { icon: Globe, title: 'Social Strategy', desc: 'Growth frameworks, analytics, multi-platform' },
]

const education = [
  {
    title: 'Cinematography, Editing, Photography, Directing & Script Writing',
    school: 'Billalul Habeshi School · Professional Diploma',
  },
  {
    title: 'Advanced Color Grading & DaVinci Resolve',
    school: 'Blackmagic Design · Certified Professional',
  },
  {
    title: 'Social Media Marketing & Content Strategy',
    school: 'Meta Blueprint · Certification',
  },
]

const clients = [
  'Nejashi TV',
  'Shadow Battery',
  'Lawyer Addiss Mohammed',
  'Diya Production',
  'Dana Production',
  'TOGT Tour & Travel',
]

const categorySkills: Record<string, string[]> = {
  editing: ['Premiere Pro', 'DaVinci Resolve', 'CapCut Pro', 'Final Cut Pro'],
  motion: ['After Effects', 'Cinema 4D Lite', 'Expressions', 'Templates'],
  color: ['Resolve Color', 'HDR Grading', 'LUT Creation', 'ACES'],
  social: ['Content Strategy', 'Analytics', 'Community', 'Paid Ads'],
  creative: ['Cinematography', 'Directing', 'Scriptwriting', 'Photography'],
  technical: ['Sound Design', 'Live Streaming', 'Encoding', 'Delivery'],
}

const ease = [0.16, 1, 0.3, 1] as const

export function About() {
  const { bio } = useSiteData()

  return (
    <section id="about" className="u-section relative" aria-labelledby="about-title">
      <div className="u-container">
        <SectionHeader
          index="01"
          eyebrow="About"
          title={
            <>
              Editor first, <span className="text-gradient-flame">strategist always.</span>
            </>
          }
          description="Four years across broadcast networks, brand campaigns and creator studios — with the technical range to deliver and the strategy to make it perform."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Bio card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease }}
            className="lg:col-span-7"
          >
            <Card padding="lg" className="h-full">
              <span className="mono-tag mb-4 block">The story</span>
              <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
                {bio.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Specialties */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="lg:col-span-5"
          >
            <Card padding="lg" className="h-full">
              <span className="mono-tag mb-6 block">Core specialties</span>
              <div className="space-y-5">
                {specialties.map((item) => (
                  <div key={item.title} className="group flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-flame transition-colors duration-300 group-hover:border-flame/40 group-hover:bg-flame/10">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-[15px] font-semibold text-ink">{item.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease }}
            className="lg:col-span-7"
          >
            <Card padding="lg" className="h-full">
              <span className="mono-tag mb-6 block">Education & training</span>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.title} className="flex items-start gap-4 border-l-2 border-line pl-4 transition-colors duration-300 hover:border-flame/50">
                    <div>
                      <p className="text-[15px] font-medium leading-snug text-ink">{edu.title}</p>
                      <p className="mt-1 text-sm text-ink-soft">{edu.school}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Skills summary + clients */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="lg:col-span-5"
          >
            <Card padding="lg" className="flex h-full flex-col">
              <span className="mono-tag mb-6 block">Trusted by</span>
              <div className="flex flex-wrap gap-2">
                {clients.map((client) => (
                  <span key={client} className="chip hover:border-flame/40 hover:text-flame">
                    {client}
                  </span>
                ))}
              </div>

              <span className="mono-tag mb-4 mt-8 block">Toolkit snapshot</span>
              <div className="space-y-3">
                {Object.entries(categorySkills)
                  .slice(0, 3)
                  .map(([type, list]) => (
                    <div key={type} className="flex flex-wrap items-center gap-2">
                      <span className="w-full text-[13px] font-medium capitalize text-ink">{type}</span>
                      {list.map((skill) => (
                        <span key={skill} className="rounded border border-line px-2 py-0.5 text-xs text-ink-soft">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ))}
              </div>

              <div className="mt-auto pt-8">
                <Button
                  className="w-full"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start a project
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
