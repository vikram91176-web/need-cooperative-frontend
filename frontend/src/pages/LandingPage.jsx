import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Gavel,
  IndianRupee,
  MapPin,
  PiggyBank,
  ReceiptText,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

import ServiceCard from '../components/ServiceCard'
import WorkerIdCard from '../components/WorkerIdCard'
import BookingModal from '../components/BookingModal'
import { getServicesByCategory, getStats } from '../services/api'

const STEPS = [
  {
    step: '01',
    title: 'Choose Local Service',
    body: 'Select from 20+ verified trades across electrical, plumbing, carpentry, and home appliance care.',
  },
  {
    step: '02',
    title: 'Compare Certified Artisans',
    body: 'View real union trade credentials, police verification badges, and citizen ratings before booking.',
  },
  {
    step: '03',
    title: 'Instant Guild Dispatch',
    body: 'Select your preferred date & time window. Dispatch is confirmed instantly without surge pricing.',
  },
  {
    step: '04',
    title: 'Transparent Remittance',
    body: 'Pay upon satisfaction via UPI, card, or cash. Receive a statutory invoice detailing the 85/10/5 split.',
  },
]

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified Artisans',
    body: 'Identity, police verification, and trade credentials audited under the Multi-State Cooperative Societies Act.',
    badge: 'Co-op Certified',
  },
  {
    icon: IndianRupee,
    title: 'Direct Living Wages',
    body: '85% of your payment is remitted directly to the artisan. Zero middleman commissions or opaque algorithmic fines.',
    badge: '85% Direct Pay',
  },
  {
    icon: PiggyBank,
    title: 'Welfare Safety Net',
    body: '10% of every job funds the worker’s emergency healthcare, child scholarship, and monsoon off-season wallet.',
    badge: '10% Welfare Vault',
  },
  {
    icon: ReceiptText,
    title: 'Radical Transparency',
    body: 'Itemized receipts showing labor, welfare fund contribution, and cooperative maintenance for complete civic trust.',
    badge: 'Audited Ledger',
  },
]

const CATEGORY_FILTERS = [
  { key: 'All', label: 'All 20+ Services' },
  { key: 'Home Services', label: 'Home Maintenance' },
  { key: 'Appliance Services', label: 'Appliances & AC' },
  { key: 'Other Services', label: 'Personal & Sanitation' },
]

const CALC_PRESETS = [300, 500, 1200, 2500]

function needSplit(amount) {
  const worker = Math.round(amount * 0.85)
  const welfare = Math.round(amount * 0.10)
  const ops = amount - worker - welfare
  return { worker, welfare, ops }
}

function privateSplit(amount) {
  const worker = Math.round(amount * 0.66)
  const platform = amount - worker
  return { worker, platform }
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search Bar State
  const [heroSearch, setHeroSearch] = useState('')
  const [heroCategory, setHeroCategory] = useState('All 20+ Trades')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Split Simulator State
  const [calcAmount, setCalcAmount] = useState(500)

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState({ isOpen: false, service: null })

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, categoryData] = await Promise.all([
          getStats(),
          getServicesByCategory(),
        ])
        setStats(statsData)
        setCategories(categoryData)
      } catch (requestError) {
        setError(requestError)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const totalServiceCount = useMemo(
    () => categories.reduce((sum, group) => sum + group.services.length, 0),
    [categories],
  )

  const filteredCategories = useMemo(() => {
    if (categoryFilter === 'All') return categories
    return categories.filter((group) => group.category === categoryFilter)
  }, [categories, categoryFilter])

  function handleHeroSearch(e) {
    e.preventDefault()
    const query = heroSearch.trim()
    if (query) {
      navigate(`/services?trade=${encodeURIComponent(query)}`)
    } else if (heroCategory !== 'All 20+ Trades') {
      navigate(`/services?category=${encodeURIComponent(heroCategory)}`)
    } else {
      navigate('/services')
    }
  }

  const need = needSplit(calcAmount)
  const priv = privateSplit(calcAmount)
  const extraEarnings = need.worker - priv.worker

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* ──────────────────────────────────────────────────────────────────
          1. HERO & GRAND SEARCH (from marketplace_homepage_hero/code.html)
      ────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-surface-container-low py-8 lg:py-12">
        {/* Ambient Gradient Glow Underlays */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[30rem] h-[30rem] rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Overline Federation Tag */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-caps text-[11px] sm:text-xs tracking-wider uppercase font-bold shadow-sm">
              <span className="material-symbols-outlined text-[15px]">shield_with_heart</span>
              Registered Under Multi-State Co-op Act 2002
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-on-surface-variant font-label-md text-xs sm:text-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Zero Corporate Intermediary Cut
            </span>
          </div>

          {/* Asymmetrical Grid Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col">
              <h1 className="font-display-lg text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] 2xl:text-[4rem] text-on-surface font-extrabold tracking-tight leading-[1.12] mb-5 break-words">
                Trusted Local Services. <br />
                <span className="text-primary underline decoration-secondary-container decoration-4 underline-offset-8">
                  Fair Wages.
                </span> <br />
                100% Cooperative-Owned.
              </h1>
              <p className="font-body-lg text-base sm:text-lg 2xl:text-xl text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
                Connect directly with verified electricians, plumbers, carpenters &amp; technicians in your neighbourhood. Where <strong className="text-on-surface font-bold">85% of every rupee</strong> goes straight to worker hands, not private gig app commissions.
              </p>

              {/* Grand Integrated Search Bar */}
              <form onSubmit={handleHeroSearch} className="bg-surface-container-lowest rounded-2xl shadow-xl p-2.5 mb-6 flex flex-col md:flex-row items-stretch gap-2 border border-outline-variant/50">
                {/* Location Hub Picker */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-container-low/70 rounded-xl md:w-56 cursor-pointer group hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[22px]">location_on</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Service Hub</span>
                    <span className="font-label-lg text-xs sm:text-sm text-on-surface font-bold truncate">Sector 62, Noida &amp; NCR</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto text-[18px]">expand_more</span>
                </div>

                {/* Trade Dropdown */}
                <div className="flex items-center gap-2 px-3.5 py-3 bg-surface-container-low/40 rounded-xl md:w-48">
                  <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="bg-transparent border-0 font-label-md text-xs sm:text-sm text-on-surface focus:outline-none w-full cursor-pointer py-1 font-semibold"
                  >
                    <option value="All 20+ Trades">All 20+ Trades</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Appliance Services">Appliance Services</option>
                    <option value="Other Services">Other Services</option>
                  </select>
                </div>

                {/* Search Text Input */}
                <div className="flex-1 flex items-center gap-2 px-3.5 py-3">
                  <span className="material-symbols-outlined text-outline text-[20px]">search</span>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search trade e.g. Fan Install, Tap Leak, AC Jet Wash..."
                    className="w-full bg-transparent border-0 font-body-md text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none py-1"
                  />
                </div>

                {/* Search CTA */}
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-on-primary px-7 py-3 rounded-xl font-label-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] uppercase tracking-wider whitespace-nowrap"
                >
                  <span>Find Artisan</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </form>

              {/* Quick Service Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-label-caps text-[11px] text-outline uppercase font-bold mr-1">Popular in Noida:</span>
                <button
                  type="button"
                  onClick={() => navigate('/services?trade=AC%20Technician')}
                  className="px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-md text-xs transition-colors shadow-xs border border-outline-variant/40 font-medium"
                >
                  AC Jet Service ₹599
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/services?trade=Electrician')}
                  className="px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-md text-xs transition-colors shadow-xs border border-outline-variant/40 font-medium"
                >
                  Switchboard Wiring ₹299
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/services?trade=Plumber')}
                  className="px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-md text-xs transition-colors shadow-xs border border-outline-variant/40 font-medium"
                >
                  Tap &amp; Sink Leak ₹249
                </button>
              </div>
            </div>

            {/* Hero Right Column: Physical Trade Credential Card */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <WorkerIdCard
                name="Rajesh Kumar Verma"
                trade="Master Electrician & Solar Wireman"
                society="Noida Shramik Electric Co-op"
                memberId="ND-ELE-8812"
                rating={4.96}
                jobs={342}
                area="Sector 62, Noida & Greater NCR"
                status="verified"
                showBookingTrigger={true}
                photoUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Qu5QGgKPQ9fXfjxdPboz5T8WdgWJp0FouvXjH9iwZ8u4wh62f0HPdJJnloj2KPmWl4kunZoVUwX26D6XJ_KWrCQkZavr0VjjuyVG123Pf06Kj6nTDuC0AHHYJeQvy4s9HOZ5TXTs5zRIS_j6VtM652UGmP3VjUR_L2FCBDEsKInHlJ4l7roYI0sPbC890pGS8wMR3YTLdRlTmZY2kfimVIaZ7bcAGTLMpdjq8RpCBf6_vGPGecO1"
                onBook={() => setBookingModal({ isOpen: true, service: { id: 1, name: 'Electrician', starting_price: 299 } })}
              />

              {/* Decorative Floating Trust Badge */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 z-20 bg-surface-container-lowest p-3 rounded-xl shadow-lg border border-outline-variant/50 items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <p className="font-label-caps text-[10px] text-outline uppercase font-bold">Direct Payout Rate</p>
                  <p className="font-headline-sm text-xs text-on-surface font-extrabold leading-none">Instant Remittance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Trust Stats Bar */}
          <div className="mt-12 sm:mt-16 pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 2xl:gap-6">
            <div className="bg-surface-container-lowest p-5 2xl:p-6 rounded-2xl shadow-xs border border-outline-variant/40 flex items-center gap-4">
              <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">groups</span>
              </div>
              <div>
                <div className="font-metric-val text-xl sm:text-2xl 2xl:text-3xl text-on-surface font-extrabold leading-none">
                  {stats ? `${stats.total_workers}+` : '1,420+'}
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium">Verified Artisans</div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 2xl:p-6 rounded-2xl shadow-xs border border-outline-variant/40 flex items-center gap-4">
              <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-xl bg-secondary-container/15 text-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">currency_rupee</span>
              </div>
              <div>
                <div className="font-metric-val text-xl sm:text-2xl 2xl:text-3xl text-primary font-extrabold leading-none">
                  {stats ? `₹${Math.round(stats.total_payments || 1800000).toLocaleString('en-IN')}` : '₹1.8 Cr+'}
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium">Directly to Workers</div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 2xl:p-6 rounded-2xl shadow-xs border border-outline-variant/40 flex items-center gap-4">
              <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">reviews</span>
              </div>
              <div>
                <div className="font-metric-val text-xl sm:text-2xl 2xl:text-3xl text-on-surface font-extrabold leading-none">4.9★</div>
                <div className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium">Citizen Satisfaction</div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 2xl:p-6 rounded-2xl shadow-xs border border-outline-variant/40 flex items-center gap-4">
              <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">gavel</span>
              </div>
              <div>
                <div className="font-metric-val text-xl sm:text-2xl 2xl:text-3xl text-on-surface font-extrabold leading-none">100%</div>
                <div className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium">Govt. Registered Societies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          2. INTERACTIVE SPLIT SIMULATOR (from DESIGN.md & reference)
      ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-label-caps text-xs bg-primary/10 text-primary px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold">
            Radical Economic Transparency
          </span>
          <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl 2xl:text-[2.75rem] text-on-surface font-extrabold mt-3 mb-2">
            See Where Your Money Actually Goes
          </h2>
          <p className="font-body-md text-sm sm:text-base 2xl:text-lg text-on-surface-variant leading-relaxed">
            Private gig aggregators silently deduct up to 35% in commissions, marketing surcharges, and penal algorithms. Under NEED's cooperative charter, fair splits are democratic law.
          </p>
        </div>

        {/* The Bento Calculator Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/50">
          {/* Header & Presets */}
          <div className="bg-inverse-surface text-inverse-on-surface p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-label-caps text-[11px] uppercase text-secondary-fixed font-bold tracking-wider">
                Live Split Simulator
              </span>
              <h3 className="font-headline-md text-lg text-on-primary mt-0.5 font-bold">
                Job Invoice Benchmark: ₹{calcAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            {/* Presets */}
            <div className="flex items-center gap-1.5 bg-surface-variant/20 p-1.5 rounded-xl flex-wrap">
              {CALC_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCalcAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    calcAmount === preset
                      ? 'bg-secondary-container text-on-secondary shadow-sm'
                      : 'text-inverse-on-surface hover:bg-white/10'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Bento Layout */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Side 1: Private Gig Economy Apps */}
            <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-5 border border-outline-variant/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error" />
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">Private Gig Platforms</h4>
                </div>
                <span className="font-label-caps text-[10px] text-error font-bold uppercase bg-error-container px-2 py-0.5 rounded">
                  High Middleman Cut
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-body-sm text-xs text-on-surface-variant">Worker Net Take-Home:</span>
                  <span className="font-metric-val text-xl text-on-surface font-extrabold">₹{priv.worker}</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex mb-1">
                  <div className="h-full bg-outline" style={{ width: '66%' }}></div>
                  <div className="h-full bg-error" style={{ width: '34%' }}></div>
                </div>
                <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant">
                  <span>Only 66% Reaches Artisan</span>
                  <span className="text-error font-bold">34% Platform Cut (₹{priv.platform})</span>
                </div>
              </div>

              <ul className="space-y-2 font-body-sm text-xs text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[16px]">close</span>
                  <span>25–30% platform commissions + lead generation charges</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[16px]">close</span>
                  <span>Zero welfare, zero emergency medical fund allocation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[16px]">close</span>
                  <span>Opaque algorithmic fines and delayed weekly payouts</span>
                </li>
              </ul>
            </div>

            {/* Center VS Bridge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center my-2 lg:my-0">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shadow-inner">
                <span className="font-headline-md text-base text-primary font-black">VS</span>
              </div>
              <span className="font-label-caps text-[10px] uppercase text-outline font-bold mt-1.5 tracking-wider">
                Cooperative Model
              </span>
            </div>

            {/* Side 2: NEED Worker-Owned Cooperative */}
            <div className="lg:col-span-5 bg-primary/5 rounded-xl p-5 border border-primary/20 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <h4 className="font-headline-sm text-sm font-extrabold text-primary">NEED Cooperative</h4>
                </div>
                <span className="font-label-caps text-[10px] text-on-primary font-bold uppercase bg-primary px-2.5 py-0.5 rounded shadow-sm">
                  Verified Co-op Standard
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-body-sm text-xs text-on-surface-variant">Worker Direct Remittance:</span>
                  <span className="font-metric-val text-xl text-primary font-extrabold">₹{need.worker}</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex mb-1">
                  <div className="h-full bg-primary" style={{ width: '85%' }}></div>
                  <div className="h-full bg-secondary-container" style={{ width: '10%' }}></div>
                  <div className="h-full bg-outline-variant" style={{ width: '5%' }}></div>
                </div>
                <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant">
                  <span className="text-primary font-bold">85% to Worker</span>
                  <span className="text-secondary font-bold">10% Welfare (₹{need.welfare})</span>
                  <span>5% Ops (₹{need.ops})</span>
                </div>
              </div>

              <ul className="space-y-2 font-body-sm text-xs text-on-surface">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary shrink-0" />
                  <span><strong>85% direct remittance</strong> into worker bank account</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary shrink-0" />
                  <span><strong>10% welfare wallet</strong> for health cover &amp; tool funds</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary shrink-0" />
                  <span><strong>Democratic ownership</strong> with full voting rights</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Callout Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/40 bg-surface-container-low px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-on-surface">
              <CircleDollarSign size={18} className="text-secondary" />
              <span>
                On this benchmark visit, the artisan earns{' '}
                <strong className="text-primary font-bold">+₹{extraEarnings} more</strong> through NEED than private apps.
              </span>
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
            >
              Explore Federation Charter <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          3. SERVICE EXPLORATION CATALOGUE
      ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-container-low/60 border-t border-outline-variant/50">
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-label-caps text-xs bg-primary/10 text-primary px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold">
                Cooperative Guild Roster
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface font-extrabold mt-2.5">
                Explore Verified Trades
              </h2>
              <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1.5">
                Zero surge pricing, certified artisans, and 30-day rework guarantees.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    categoryFilter === cat.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8">
            {filteredCategories.flatMap((grp) => grp.services).slice(0, 8).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={(svc) => setBookingModal({ isOpen: true, service: svc })}
                onViewWorkers={(tradeName) => navigate(`/services?trade=${encodeURIComponent(tradeName)}&mode=workers`)}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="btn btn-primary text-sm font-bold px-8 py-3.5 uppercase tracking-wider shadow-md"
            >
              Browse All 20+ Guild Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          4. HOW THE FEDERATION WORKS (4 STEPS)
      ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-label-caps text-xs bg-primary/10 text-primary px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold">
            Democratic Guild Workflow
          </span>
          <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface font-extrabold mt-3 mb-2">
            How NEED Protects Both Sides
          </h2>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant">
            From upfront pricing to transparent welfare escrow, every stage is audited.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/50 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-primary/30 block mb-3">
                  {item.step}
                </span>
                <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface mb-2">
                  {item.title}
                </h3>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {item.body}
                </p>
              </div>
              <div className="w-8 h-1 bg-primary-fixed rounded-full mt-5" />
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          5. PILLARS & COOPERATIVE CHARTER
      ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-container-low border-t border-outline-variant/50">
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon
              return (
                <div
                  key={pillar.title}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/50 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon size={24} />
                    </div>
                    <span className="font-label-caps text-[10px] sm:text-[11px] text-secondary font-bold uppercase block mb-1">
                      {pillar.badge}
                    </span>
                    <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface mb-2">
                      {pillar.title}
                    </h3>
                    <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {bookingModal.isOpen && (
        <BookingModal
          isOpen={bookingModal.isOpen}
          onClose={() => setBookingModal({ isOpen: false, service: null })}
          service={bookingModal.service}
          allServices={categories.flatMap((c) => c.services)}
        />
      )}
    </div>
  )
}
