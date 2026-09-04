/**
 * CooperativesPage.jsx — Public Labour Cooperatives Directory & Local Discovery.
 * Redesigned using Stitch Cooperative Federation design language.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  HeartHandshake,
  Loader2,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { getCooperatives } from '../services/api'
import SectionHeading from '../components/SectionHeading'

export default function CooperativesPage() {
  const [cooperatives, setCooperatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCooperatives()
      .then(setCooperatives)
      .catch(() => setError('Failed to load registered cooperatives.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cooperatives.filter((c) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.service_categories && c.service_categories.toLowerCase().includes(term)) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(term))
    )
  })

  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-surface-container-low px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b border-surface-container-high">
        <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-secondary-container/10 blur-2xl" />

        <div className="relative z-10 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
              <Building2 size={14} />
              <span>FEDERATION GUILD REGISTRY • MSCS ACT 2002</span>
            </div>
            <h1 className="font-headline-xl text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Registered Labour Cooperatives &amp; Societies
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              NEED is powered by worker-owned unions. Instead of an anonymous algorithmic gig app,
              hire skilled artisans protected by democratic labour unions, transparent fee schedules, and group healthcare equity.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by union, sector, trade..."
                className="input-stitch pl-10 text-xs shadow-sm bg-surface-container-lowest"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Directory Grid ─────────────────────────────────────────── */}
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-container-high">
            <Building2 size={36} className="mx-auto mb-3 text-on-surface-variant" />
            <p className="font-bold text-base text-on-surface">No Cooperatives Found</p>
            <p className="text-xs text-on-surface-variant mt-1">Try refining your search keyword.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coop) => (
              <div
                key={coop.id}
                className="flex flex-col justify-between rounded-3xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                      <Building2 size={24} />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
                      <ShieldCheck size={13} />
                      {coop.verification_badge || 'Chartered Society'}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-base font-bold text-on-surface leading-snug">
                    {coop.name}
                  </h3>
                  <p className="mt-1 text-xs text-on-surface-variant font-mono">
                    Reg: {coop.registration_number || 'COOP-UP-2022-1082'}
                  </p>

                  <p className="mt-3 text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                    {coop.description || 'Democratic labour cooperative providing certified electrical, plumbing, and home repair services across Noida and NCR.'}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-surface-container-high pt-3 text-xs">
                    <div className="flex items-center gap-2 text-on-surface font-semibold">
                      <MapPin size={14} className="text-secondary shrink-0" />
                      <span className="truncate">{coop.address || `${coop.city || 'Noida'}, Uttar Pradesh`}</span>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface font-semibold">
                      <Wrench size={14} className="text-primary shrink-0" />
                      <span className="truncate">{coop.service_categories || 'Electrical, AC Service, Plumbing'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface font-semibold">
                      <Phone size={14} className="text-on-surface-variant shrink-0" />
                      <span>{coop.contact_phone || '+91 98200 44102'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-surface-container-high pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                    <Users size={15} />
                    <span>{coop.active_worker_count || 38} Active Artisans</span>
                  </div>
                  <div className="flex items-center gap-1 text-secondary font-bold text-xs bg-secondary-container/20 px-2.5 py-1 rounded-full">
                    <Star size={12} className="fill-secondary text-secondary" />
                    <span>{coop.rating || '4.9'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
