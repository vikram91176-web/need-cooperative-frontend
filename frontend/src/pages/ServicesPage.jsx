/**
 * ServicesPage.jsx — Stitch Explore Services & Instant Guild Dispatch.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Grid,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { getServices, getWorkers } from '../services/api'
import ServiceCard from '../components/ServiceCard'
import WorkerIdCard from '../components/WorkerIdCard'
import BookingModal from '../components/BookingModal'
import { getServiceImage } from '../utils/serviceImages'

const CATEGORIES = [
  { key: 'all', label: 'All Services', icon: 'apps' },
  { key: 'home', label: 'Home Services', icon: 'home_repair_service' },
  { key: 'appliance', label: 'Appliance Services', icon: 'microwave' },
  { key: 'personal', label: 'Personal & Sanitation', icon: 'cleaning_services' },
]

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const initialTrade    = searchParams.get('trade') || ''
  const initialMode     = searchParams.get('mode') || (initialTrade ? 'workers' : 'services')

  const [mode, setMode]                         = useState(initialMode) // 'services' | 'workers'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedTrade, setSelectedTrade]       = useState(initialTrade)
  const [searchQuery, setSearchQuery]           = useState('')
  const [sortBy, setSortBy]                     = useState('rated')

  // Selected item for persistent instant booking drawer
  const [activeServiceForDrawer, setActiveServiceForDrawer] = useState(null)
  const [activeWorkerForDrawer, setActiveWorkerForDrawer]   = useState(null)
  const [selectedSlot, setSelectedSlot]                     = useState('today')

  // Full Modal state (if customer triggers full checkout modal)
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    service: null,
    worker: null,
  })

  // Data states
  const [services, setServices] = useState([])
  const [workers, setWorkers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  function loadAllData() {
    setLoading(true)
    setError('')
    Promise.all([getServices(), getWorkers({ verified_only: true })])
      .then(([servicesData, workersData]) => {
        setServices(servicesData)
        setWorkers(workersData)
        if (servicesData.length > 0 && !activeServiceForDrawer) {
          setActiveServiceForDrawer(servicesData[0])
        }
        if (workersData.length > 0 && !activeWorkerForDrawer) {
          setActiveWorkerForDrawer(workersData[0])
        }
      })
      .catch(() => {
        setError('Could not load service catalogue. Please ensure the backend is active.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadAllData, [])

  function handleSelectMode(newMode) {
    setMode(newMode)
    if (newMode === 'services' && selectedTrade) {
      setSelectedTrade('')
    }
  }

  function handleViewWorkersForService(serviceName) {
    setSelectedTrade(serviceName)
    setMode('workers')
  }

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      let matchesCat = true
      if (selectedCategory === 'home') matchesCat = s.category === 'Home Services'
      else if (selectedCategory === 'appliance') matchesCat = s.category === 'Appliance Services'
      else if (selectedCategory === 'personal') matchesCat = s.category === 'Other Services'

      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        s.category.toLowerCase().includes(query)

      return matchesCat && matchesSearch
    })
  }, [services, selectedCategory, searchQuery])

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    let result = workers.filter((w) => {
      const matchesTrade = !selectedTrade || w.trade.toLowerCase() === selectedTrade.toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !query ||
        w.name.toLowerCase().includes(query) ||
        w.trade.toLowerCase().includes(query) ||
        (w.skills && w.skills.toLowerCase().includes(query)) ||
        (w.area && w.area.toLowerCase().includes(query))
      return matchesTrade && matchesSearch
    })

    if (sortBy === 'jobs') {
      result.sort((a, b) => b.total_jobs - a.total_jobs)
    } else if (sortBy === 'experience') {
      result.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0))
    } else {
      result.sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [workers, selectedTrade, searchQuery, sortBy])

  // Split calculations for persistent drawer
  const drawerPrice = activeServiceForDrawer?.starting_price || 299
  const drawerWorkerShare = Math.round(drawerPrice * 0.85)
  const drawerWelfareShare = Math.round(drawerPrice * 0.10)
  const drawerOpsShare = drawerPrice - drawerWorkerShare - drawerWelfareShare

  return (
    <div className="w-full bg-surface pb-16">
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Top Status & Assurance Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/40">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
            <span className="font-label-caps text-primary font-bold uppercase tracking-wider">
              Federation Marketplace
            </span>
            <span className="text-outline">•</span>
            <span className="font-medium text-on-surface">Sector 62, Noida &amp; Greater NCR</span>
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              148 Guild Artisans Active Now
            </span>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded-full border border-outline-variant/40 shadow-xs text-xs">
            <span className="material-symbols-outlined text-primary text-[17px]">gavel</span>
            <span className="font-medium text-on-surface">Democratically Fixed Tariff • Zero Surge Guarantees</span>
          </div>
        </div>

        {/* Filter Bar & Search Architecture */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/50 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trade (e.g. switchboard fix, leak repair, split AC tune-up)..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
              />
            </div>

            {/* Mode Switcher + Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/40 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectMode('services')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    mode === 'services'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Services ({filteredServices.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('workers')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    mode === 'workers'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Verified Workers ({filteredWorkers.length})
                </button>
              </div>

              {/* Sorting Filter */}
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface">
                <span className="material-symbols-outlined text-primary text-[17px]">sort</span>
                <span className="font-label-caps text-[10px] text-outline uppercase font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="rated">Highest Rated (4.8+)</option>
                  <option value="jobs">Most Jobs Completed</option>
                  <option value="experience">Trade Experience</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          {mode === 'services' && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-outline-variant/40 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Main Layout: Catalog / Workers (8 Cols) + Persistent Instant Booking Drawer (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols on Desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Live Cooperative Guarantee Alert Banner */}
            <div className="bg-gradient-to-r from-surface-container to-surface-container-low p-4 rounded-xl flex items-center justify-between gap-4 border border-outline-variant/40 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">100% Cooperative Guarantee</h4>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-tight">
                    All artisans are certified union shareholding members. 30-day revisit protection on all tasks.
                  </p>
                </div>
              </div>
              <span className="font-label-caps text-[10px] bg-surface-container-lowest text-primary px-2.5 py-1 rounded font-bold uppercase tracking-wider hidden sm:block border border-outline-variant/40">
                Act of 2002 Compliant
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center space-y-3">
                <Loader2 size={36} className="animate-spin text-primary mx-auto" />
                <p className="text-xs text-on-surface-variant font-medium">Loading verified directory…</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-3 rounded-2xl bg-error-container/40 border border-error/30 text-on-error-container">
                <AlertCircle size={32} className="text-error mx-auto" />
                <p className="text-xs font-semibold">{error}</p>
                <button onClick={loadAllData} className="btn btn-outline text-xs">
                  Retry Loading
                </button>
              </div>
            ) : mode === 'services' ? (
              /* Services Grid */
              filteredServices.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/50 space-y-2">
                  <p className="font-headline-sm text-base text-on-surface font-bold">No services match your filter</p>
                  <p className="text-xs text-on-surface-variant">Try adjusting your search terms or view all categories.</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="btn btn-primary text-xs mt-2">
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredServices.map((svc) => (
                    <ServiceCard
                      key={svc.id}
                      service={svc}
                      onBook={(serviceItem) => {
                        setActiveServiceForDrawer(serviceItem)
                        setBookingModal({ isOpen: true, service: serviceItem })
                      }}
                      onViewWorkers={handleViewWorkersForService}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Workers Directory */
              filteredWorkers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/50 space-y-2">
                  <p className="font-headline-sm text-base text-on-surface font-bold">No verified artisans found</p>
                  <p className="text-xs text-on-surface-variant">Try selecting a different trade or reset your search query.</p>
                  <button onClick={() => { setSelectedTrade(''); setSearchQuery(''); }} className="btn btn-primary text-xs mt-2">
                    View All Workers
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredWorkers.map((w) => (
                    <WorkerIdCard
                      key={w.id}
                      name={w.name}
                      trade={w.trade}
                      society={w.cooperative_name || 'Noida Artisans Cooperative Union'}
                      memberId={w.member_id || `SS-EL-${w.id.toString().padStart(4, '0')}`}
                      rating={w.rating}
                      jobs={w.total_jobs}
                      area={w.area || 'Noida Sector 62'}
                      status={w.verification_status || 'verified'}
                      showBookingTrigger={true}
                      onBook={() => {
                        setActiveWorkerForDrawer(w)
                        const matchingSvc = services.find((s) => s.name.toLowerCase() === w.trade.toLowerCase())
                        setBookingModal({
                          isOpen: true,
                          service: matchingSvc || null,
                          worker: w,
                        })
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Right Column: Persistent Instant Booking Drawer (4 Cols on Desktop) */}
          <aside className="lg:col-span-4 w-full sticky top-24">
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-md border-2 border-primary/20 relative overflow-hidden space-y-4">
              {/* Tactile Header */}
              <div className="bg-inverse-surface text-inverse-on-surface -mx-5 -mt-5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-container text-[18px]">badge</span>
                  <span className="font-label-caps text-[10px] tracking-widest text-secondary-fixed uppercase font-bold">
                    Cooperative Dispatch System
                  </span>
                </div>
                <span className="bg-primary/20 text-primary-fixed text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  SLOT ACTIVE
                </span>
              </div>

              {/* Title */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-[10px] uppercase text-primary font-bold">
                    Instant Guild Dispatch
                  </span>
                  <h3 className="font-headline-sm text-base text-on-surface font-extrabold">
                    Book Verified Member
                  </h3>
                </div>
                <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold">
                  4/4
                </div>
              </div>

              {/* Step 1: Selected Service Scope */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-bold">1</span>
                    Service Scope
                  </span>
                  <span className="text-[11px] text-primary font-semibold">Fixed Rate</span>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getServiceImage(activeServiceForDrawer)}
                      alt={activeServiceForDrawer?.name || 'Service'}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-outline-variant/50 shadow-xs"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">{activeServiceForDrawer?.name || 'Electrician'}</p>
                      <p className="text-[10px] text-on-surface-variant">Diagnostics &amp; Tools Included</p>
                    </div>
                  </div>
                  <span className="font-metric-val text-sm text-primary font-extrabold">
                    ₹{drawerPrice}
                  </span>
                </div>
              </div>

              {/* Step 2: Slot Selection Chips */}
              <div className="space-y-1.5">
                <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-bold">2</span>
                  Preferred Slot Window
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot('today')}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                      selectedSlot === 'today'
                        ? 'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/20'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">bolt</span> Today
                    </span>
                    <span className="text-[10px] opacity-90">4:00 PM - 5:00 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSlot('tomorrow1')}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                      selectedSlot === 'tomorrow1'
                        ? 'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/20'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-bold">Tomorrow</span>
                    <span className="text-[10px] opacity-90">10:00 AM - 11:00 AM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSlot('tomorrow2')}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                      selectedSlot === 'tomorrow2'
                        ? 'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/20'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-bold">Tomorrow</span>
                    <span className="text-[10px] opacity-90">02:30 PM - 03:30 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingModal({ isOpen: true, service: activeServiceForDrawer })}
                    className="p-2 rounded-xl text-left bg-surface-container-low text-on-surface hover:bg-surface-container font-semibold flex flex-col justify-between text-xs"
                  >
                    <span>Custom Slot</span>
                    <span className="text-[10px] text-primary font-bold">Pick Calendar →</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Assigned Guild Worker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-bold">3</span>
                    Assigned Member
                  </span>
                  <span className="font-label-caps text-[10px] text-secondary font-bold uppercase">
                    Rotation Active
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-2.5 border-l-4 border-primary flex items-center gap-2.5 text-xs">
                  <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {activeWorkerForDrawer?.name ? activeWorkerForDrawer.name.split(' ').map(n=>n[0]).join('') : 'RK'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface truncate">{activeWorkerForDrawer?.name || 'Rahul Kumar'}</span>
                      <span className="text-secondary font-bold text-xs">★ {activeWorkerForDrawer?.rating || '4.95'}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {activeWorkerForDrawer?.trade || 'Master Electrician'} • Verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Transparent Fair Split Accounting */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1 text-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                    Democratic Split Formula
                  </span>
                  <span className="font-bold text-primary">₹{drawerPrice} Total</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-surface-container flex mb-1">
                  <div className="h-full bg-primary" style={{ width: '85%' }} />
                  <div className="h-full bg-secondary-container" style={{ width: '10%' }} />
                  <div className="h-full bg-outline-variant" style={{ width: '5%' }} />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
                  <span className="text-primary font-semibold">₹{drawerWorkerShare} To Worker (85%)</span>
                  <span className="text-secondary font-semibold">₹{drawerWelfareShare} Welfare (10%)</span>
                  <span>₹{drawerOpsShare} Ops (5%)</span>
                </div>
              </div>

              {/* Primary Trigger */}
              <button
                type="button"
                onClick={() => setBookingModal({ isOpen: true, service: activeServiceForDrawer, worker: activeWorkerForDrawer })}
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition shadow-md flex items-center justify-center gap-2 font-label-md text-xs font-bold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Confirm Instant Booking (₹{drawerPrice})</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Full Booking Modal */}
      {bookingModal.isOpen && (
        <BookingModal
          isOpen={bookingModal.isOpen}
          onClose={() => setBookingModal({ isOpen: false, service: null, worker: null })}
          service={bookingModal.service}
          worker={bookingModal.worker}
          allServices={services}
        />
      )}
    </div>
  )
}
