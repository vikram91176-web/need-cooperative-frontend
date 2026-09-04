/**
 * CooperativeDashboard.jsx — Dashboard for Labour Cooperative / Society Administrators.
 * Redesigned using the Stitch Cooperative Society Dispatch Roster Hub reference.
 *
 * Dedicated dashboard enabling cooperative leaders to:
 *  1. View & manage worker profiles, verify skills & identity with physical credential view.
 *  2. Add new worker members to the society roster.
 *  3. Dispatch & assign workers to customer bookings with auto-allocation and live routing.
 *  4. Inspect transparent earnings breakdown (Cooperative 5% share, worker payouts, reserve pool).
 *  5. Assist with dispute resolution & peer arbitrations.
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Filter,
  IndianRupee,
  Info,
  Loader2,
  MapPin,
  Phone,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import {
  cooperativeAddWorker,
  cooperativeAssignWorker,
  cooperativeVerifyWorker,
  getCooperativeDashboard,
  resolveDispute,
} from '../services/api'

export default function CooperativeDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('workers') // 'workers' | 'bookings' | 'financials' | 'disputes'

  // Search & Filters
  const [workerSearch, setWorkerSearch] = useState('')
  const [bookingFilter, setBookingFilter] = useState('all') // 'all' | 'unassigned' | 'emergency'

  // Modals state
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    email: '',
    phone: '',
    primary_service: 'Electrician',
    skills: '',
    experience_years: 3,
  })
  const [addingWorker, setAddingWorker] = useState(false)

  const [assignModal, setAssignModal] = useState({ isOpen: false, booking: null })
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [disputeModal, setDisputeModal] = useState({ isOpen: false, dispute: null })
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const res = await getCooperativeDashboard()
      setData(res)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cooperative society dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyWorker(workerId, status) {
    try {
      await cooperativeVerifyWorker(workerId, status, 'Verified by Cooperative District Assembly')
      fetchDashboardData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update verification status.')
    }
  }

  async function handleAddWorker(e) {
    e.preventDefault()
    setAddingWorker(true)
    try {
      await cooperativeAddWorker(newWorkerForm)
      setShowAddWorker(false)
      setNewWorkerForm({
        name: '',
        email: '',
        phone: '',
        primary_service: 'Electrician',
        skills: '',
        experience_years: 3,
      })
      fetchDashboardData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add worker member.')
    } finally {
      setAddingWorker(false)
    }
  }

  async function handleAssignWorker(e) {
    e.preventDefault()
    if (!selectedWorkerId) return
    setAssigning(true)
    try {
      await cooperativeAssignWorker(assignModal.booking.id, selectedWorkerId)
      setAssignModal({ isOpen: false, booking: null })
      setSelectedWorkerId('')
      fetchDashboardData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch worker.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleResolveDispute(e) {
    e.preventDefault()
    setResolving(true)
    try {
      await resolveDispute(disputeModal.dispute.id, 'resolved', resolutionNotes)
      setDisputeModal({ isOpen: false, dispute: null })
      setResolutionNotes('')
      fetchDashboardData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve dispute.')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-surface py-10 px-4 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-44 bg-surface-container-high rounded-3xl w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-surface-container rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-surface-container-high rounded-3xl w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Cooperative Portal Error</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Reload Society Hub
        </button>
      </div>
    )
  }

  const { cooperative, stats, workers, bookings, disputes } = data

  const filteredWorkers = workers.filter((w) => {
    if (!workerSearch) return true
    const term = workerSearch.toLowerCase()
    return (
      w.name.toLowerCase().includes(term) ||
      (w.primary_service && w.primary_service.toLowerCase().includes(term)) ||
      (w.skills && w.skills.toLowerCase().includes(term)) ||
      (w.phone && w.phone.includes(term))
    )
  })

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'unassigned') return !b.worker_id || b.status === 'requested' || b.status === 'pending'
    if (bookingFilter === 'emergency') return b.is_emergency
    return true
  })

  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Society Identity Banner (Embossed Civic Aesthetic) ───────────── */}
      <section className="relative w-full overflow-hidden bg-surface-container-low px-4 sm:px-6 lg:px-8 py-8 border-b border-surface-container-high">
        {/* Ambient Civic Glow */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-secondary-container/10 blur-2xl" />

        <div className="relative z-10 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto flex flex-col gap-6">
          {/* Upper Header Meta & Credential Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md flex-shrink-0">
                <span className="material-symbols-outlined text-[36px]">shield_person</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="bg-primary text-white font-label-caps text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    State Affiliated Society
                  </span>
                  <span className="bg-surface-container-lowest text-on-surface-variant font-label-caps text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm border border-surface-container-high">
                    Autonomous Assembly
                  </span>
                  <span className="text-primary font-label-md text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span> Valid Till Dec 2028
                  </span>
                </div>

                <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {cooperative?.name || 'Noida Artisans & Electricians Cooperative Union'}
                </h1>

                <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
                  Govt. Registration: <span className="font-bold text-on-surface font-mono">{cooperative?.registration_number || 'COOP-UP-2022-1082'}</span>
                  <span className="opacity-40">•</span>
                  <span>{cooperative?.city || 'Gautam Buddha Nagar'}, Uttar Pradesh</span>
                </p>
              </div>
            </div>

            {/* Coordinator & Add Member Actions */}
            <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
              <div className="flex items-center gap-3 bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-surface-container-high">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">supervisor_account</span>
                </div>
                <div className="flex flex-col pr-2">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">Elected Coordinator</span>
                  <span className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface leading-tight">
                    Vikram Singh (Ward 14)
                  </span>
                  <span className="text-[11px] text-secondary leading-none">Term 2024–2027</span>
                </div>
              </div>

              <button
                onClick={() => setShowAddWorker(true)}
                className="btn btn-primary text-xs py-2.5 px-4 shadow-md flex items-center gap-1.5"
                type="button"
              >
                <UserPlus size={16} />
                <span>Enrol Worker Member</span>
              </button>
            </div>
          </div>

          {/* Key KPI Mosaics (Data-Dense Civic Ledger) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Verified Artisans */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                    Artisan Roll
                  </span>
                  <p className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface mt-1">
                    {stats.total_workers}{' '}
                    <span className="font-headline-sm text-xs text-primary font-bold">Members</span>
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-container-high flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold text-on-surface">{stats.verified_workers} Verified Active</span>
                </div>
                <span className="text-secondary font-bold text-[11px]">Noida &amp; NCR</span>
              </div>
            </div>

            {/* Metric 2: Completed Jobs */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                    Dispatched Services
                  </span>
                  <p className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface mt-1">
                    {stats.total_jobs_completed}{' '}
                    <span className="font-headline-sm text-xs text-on-surface-variant font-medium">Jobs</span>
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-container-high flex items-center gap-2">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-container h-full w-[96%]" />
                </div>
                <span className="font-label-caps text-xs text-on-surface font-bold">99.2%</span>
              </div>
            </div>

            {/* Metric 3: Reserve Pool */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                    Reserve Pool (5% Coop)
                  </span>
                  <p className="font-metric-val text-2xl sm:text-3xl font-black text-primary mt-1">
                    ₹{stats.cooperative_share_earnings.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary-container text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">savings</span>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight mt-3">
                Reinvested democratically in safety gear, tool locker &amp; skills training.
              </p>
            </div>

            {/* Metric 4: Payouts Dispatched */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                    Worker Direct Payouts
                  </span>
                  <p className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface mt-1">
                    ₹{(stats.worker_total_earnings || stats.total_gmv * 0.85).toLocaleString('en-IN')}{' '}
                    <span className="font-headline-sm text-xs text-on-surface font-semibold">(85%)</span>
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                  <IndianRupee size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-container-high flex items-center justify-between text-[11px] font-bold">
                <span className="text-primary">Zero Intermediary Skim</span>
                <span className="text-on-surface-variant">Weekly Direct DBT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Workstation Container ───────────────────────────────────── */}
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* ── Tabs Navigation ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-surface-container-high overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'workers'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Users size={16} />
            Co-op Member Roster ({workers.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Wrench size={16} />
            Live Dispatch Queue ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'financials'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <DollarSign size={16} />
            Transparent Split &amp; Ledger
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'disputes'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <AlertTriangle size={16} />
            Dispute Tribunal ({disputes.length})
          </button>
        </div>

        {/* ── TAB 1: Managed Workers Roster ──────────────────────────────── */}
        {activeTab === 'workers' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  Cooperative Member Roster &amp; Credentials
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Verified trade practitioners governed by the local Labour Cooperative Assembly.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-container-lowest px-3 py-2 rounded-xl shadow-sm border border-surface-container-high flex items-center gap-2">
                  <Search size={16} className="text-on-surface-variant" />
                  <input
                    type="text"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search member, skill, phone..."
                    className="bg-transparent text-xs text-on-surface focus:outline-none w-44 sm:w-60"
                  />
                  {workerSearch && (
                    <button onClick={() => setWorkerSearch('')} className="text-on-surface-variant hover:text-on-surface">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowAddWorker(true)}
                  className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={15} />
                  <span>Enrol Member</span>
                </button>
              </div>
            </div>

            {/* Member Registry Table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase tracking-wider border-b border-surface-container-high">
                    <th className="py-3 px-4 font-bold">Artisan Member &amp; Trade</th>
                    <th className="py-3 px-4 font-bold">Trade Credentials &amp; Skills</th>
                    <th className="py-3 px-4 font-bold">Trust Badges</th>
                    <th className="py-3 px-4 font-bold">Fulfilled Orders</th>
                    <th className="py-3 px-4 font-bold">Verification Status</th>
                    <th className="py-3 px-4 text-right font-bold">Society Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {filteredWorkers.map((w) => (
                    <tr key={w.worker_id} className="hover:bg-surface-container-low/50 transition-colors">
                      {/* Col 1: Member */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {w.name ? w.name.substring(0, 2).toUpperCase() : 'AR'}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface text-sm">{w.name}</div>
                            <div className="text-[11px] text-on-surface-variant">
                              ID: #{`SHR-2026-${(w.user_id || w.id || w.worker_id || 0).toString().padStart(4, '0')}`} • {w.phone || w.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Trade & Skills */}
                      <td className="py-4 px-4">
                        <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary inline-block">
                          {w.primary_service || 'General Service'}
                        </span>
                        <p className="text-[11px] text-on-surface-variant mt-1 max-w-[200px] truncate" title={w.skills}>
                          {w.skills || 'Cooperative registered specialist'}
                        </p>
                      </td>

                      {/* Col 3: Badges */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded-md bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-700" />
                            Aadhaar e-KYC
                          </span>
                          <span className="rounded-md bg-blue-500/10 text-blue-800 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                            <Award size={12} className="text-blue-700" />
                            ITI Certified
                          </span>
                        </div>
                      </td>

                      {/* Col 4: Jobs */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-on-surface">{w.total_jobs} orders</span>
                        <div className="text-[11px] text-secondary font-bold flex items-center gap-0.5 mt-0.5">
                          <span>{w.rating || 5.0}</span>
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                      </td>

                      {/* Col 5: Status */}
                      <td className="py-4 px-4">
                        {w.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={13} /> Active Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-full">
                            <Clock size={13} /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Col 6: Action */}
                      <td className="py-4 px-4 text-right">
                        {w.verification_status === 'pending' ? (
                          <button
                            onClick={() => handleVerifyWorker(w.user_id, 'verified')}
                            className="rounded-lg bg-primary px-3 py-1.5 text-white font-bold text-xs hover:bg-primary-container transition shadow-sm"
                          >
                            Approve &amp; Certify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyWorker(w.user_id, 'pending')}
                            className="rounded-lg border border-surface-container-high px-2.5 py-1 text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition"
                          >
                            Review Logs
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: Live Society Dispatch Queue ─────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 cols: Queue */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  <h2 className="font-headline-md text-xl font-bold text-on-surface">
                    Live Society Dispatch Queue
                  </h2>
                  <span className="bg-surface-container-high text-on-surface px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {filteredBookings.length} Calls
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high">
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bookingFilter === 'all' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    All Calls
                  </button>
                  <button
                    onClick={() => setBookingFilter('unassigned')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bookingFilter === 'unassigned' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Unassigned
                  </button>
                  <button
                    onClick={() => setBookingFilter('emergency')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bookingFilter === 'emergency' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    🚨 Urgent
                  </button>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container-high">
                  <Wrench size={32} className="mx-auto mb-3 text-on-surface-variant" />
                  <p className="font-bold text-sm text-on-surface">No Service Calls in Queue</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    All incoming customer requests have been assigned to certified artisans.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => {
                    const isUnassigned = !b.worker_id || b.status === 'requested' || b.status === 'pending'
                    return (
                      <div
                        key={b.id}
                        className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all flex flex-col gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-extrabold text-on-surface">#{b.id}</span>
                            <span className="bg-surface-container-high text-on-surface text-xs font-bold px-2.5 py-0.5 rounded-md">
                              {b.service_name}
                            </span>
                            {b.is_emergency && (
                              <span className="bg-red-500/10 text-red-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border border-red-200">
                                🚨 Rush Emergency
                              </span>
                            )}
                            <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              {b.status}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-on-surface-variant">Guaranteed Fee:</span>
                            <span className="font-mono text-base font-extrabold text-primary">₹{b.amount}</span>
                          </div>
                        </div>

                        {/* Location, Schedule & Customer Meta */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 bg-surface-container-low/60 rounded-xl px-4 text-xs">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-secondary shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Location</span>
                              <span className="font-semibold text-on-surface truncate" title={b.address}>
                                {b.address || 'Noida Sector 62'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Schedule</span>
                              <span className="font-semibold text-on-surface">
                                {b.scheduled_date ? `${b.scheduled_date} ${b.scheduled_time || ''}` : 'Immediate Dispatch'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Citizen</span>
                              <span className="font-semibold text-on-surface truncate">
                                {b.customer_name || 'Resident'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Worker / Dispatch CTA */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-xs shrink-0">
                              <span className="material-symbols-outlined text-[20px]">engineering</span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-on-surface">
                                {b.worker_name ? (
                                  <span className="flex items-center gap-1.5 text-primary">
                                    <CheckCircle2 size={13} /> {b.worker_name} (Assigned)
                                  </span>
                                ) : (
                                  <span className="text-amber-800 font-bold">Unassigned • Needs Society Dispatch</span>
                                )}
                              </div>
                              <p className="text-[11px] text-on-surface-variant">
                                Co-op Share: ₹{Math.round(b.amount * 0.05)} • Worker Take-Home: ₹{Math.round(b.amount * 0.85)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isUnassigned ? (
                              <button
                                onClick={() => setAssignModal({ isOpen: true, booking: b })}
                                className="btn btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">near_me</span>
                                <span>Assign Artisan</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setAssignModal({ isOpen: true, booking: b })}
                                className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition"
                              >
                                Reassign
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right 4 cols: Sector Radar & Governance */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Sector Radar Widget */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">map</span>
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface">Active Sector Radar</h3>
                  </div>
                  <span className="bg-primary/10 text-primary font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Noida Sec 62 Core
                  </span>
                </div>

                {/* Radar Mock Visualization */}
                <div className="w-full h-44 bg-surface-container-high rounded-xl relative overflow-hidden flex flex-col justify-between p-3 border border-surface-container-high">
                  <div className="bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-lg self-start shadow-sm flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="font-bold text-on-surface">{stats.verified_workers} Active Radii Tracked</span>
                  </div>
                  <div className="bg-surface/90 backdrop-blur-md px-3 py-1 rounded-lg self-end shadow-sm text-xs">
                    <span className="text-secondary font-bold">Avg Arrival: 14 min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                  <span>Cluster Radius: 5.0 km</span>
                  <span className="text-primary font-bold">NCR Federation Mesh</span>
                </div>
              </div>

              {/* Society Tool Bank Status */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                    <Wrench size={16} className="text-primary" />
                    Society Tool Bank
                  </h3>
                  <span className="font-label-caps text-[10px] text-secondary font-bold">Sec 62 Locker</span>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-xl">
                    <span className="font-semibold text-on-surface">Bosch Rotary Hammer Drill (x4)</span>
                    <span className="text-primary font-bold text-[10px]">All Checked In</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-xl">
                    <span className="font-semibold text-on-surface">High Pressure Jet Flusher</span>
                    <span className="text-secondary font-bold text-[10px]">Active in Field</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-xl">
                    <span className="font-semibold text-on-surface">High-Voltage Thermal Scanner</span>
                    <span className="text-primary font-bold text-[10px]">Ready in Locker</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Transparent Earnings & Democratic Split ─────────────── */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  Total Gross Merchandise Value (GMV)
                </span>
                <div className="text-3xl font-black text-on-surface mt-1 font-mono">
                  ₹{stats.total_gmv.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Total consumer invoices processed</p>
              </div>

              <div className="rounded-2xl border border-secondary/30 bg-secondary-container/10 p-6 shadow-sm">
                <span className="text-xs text-secondary font-bold uppercase tracking-wider">
                  Cooperative Share (5% Society Fund)
                </span>
                <div className="text-3xl font-black text-secondary font-mono mt-1">
                  ₹{stats.cooperative_share_earnings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-secondary mt-1">
                  100% democratically retained for member equipment &amp; emergency relief
                </p>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
                <span className="text-xs text-primary font-bold uppercase tracking-wider">
                  Worker Net Direct Payouts (85%)
                </span>
                <div className="text-3xl font-black text-primary font-mono mt-1">
                  ₹{(stats.worker_total_earnings || stats.total_gmv * 0.85).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-primary mt-1">
                  Directly credited via automated bank transfer (DBT / UPI)
                </p>
              </div>
            </div>

            {/* Split Visual Explanation */}
            <div className="rounded-3xl border border-surface-container-high bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">
                  Democratic Cooperative Fair-Split Formula
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Under the Multi-State Co-operative Societies Act 2002, private gig commission skimming is eliminated.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-4 rounded-full bg-surface-container-high flex overflow-hidden">
                  <div className="bg-primary h-full w-[85%]" title="85% Worker Payout" />
                  <div className="bg-secondary-container h-full w-[10%]" title="10% Welfare Trust" />
                  <div className="bg-outline-variant h-full w-[5%]" title="5% Co-op Admin & Tools" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <strong className="font-bold text-on-surface">85% Direct Worker Pay</strong>
                    </div>
                    <p className="text-on-surface-variant text-[11px] leading-relaxed">
                      Transferred immediately upon verified customer OTP signature. No payment holds.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary-container/10 border border-secondary/20 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full bg-secondary-container" />
                      <strong className="font-bold text-secondary">10% Personal Welfare Trust</strong>
                    </div>
                    <p className="text-on-surface-variant text-[11px] leading-relaxed">
                      Partitioned 70% for emergency cash withdrawal and 30% for health &amp; equipment cover.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-high border border-surface-container-high text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full bg-outline-variant" />
                      <strong className="font-bold text-on-surface">5% Local Society Fund</strong>
                    </div>
                    <p className="text-on-surface-variant text-[11px] leading-relaxed">
                      Maintains cooperative tool lockers, regional dispute tribunals, and server infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Dispute Tribunal ────────────────────────────────────── */}
        {activeTab === 'disputes' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-container-high flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Cooperative Dispute Tribunal &amp; Peer Arbitration
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Peer-adjudicated conflict resolution with zero punitive algorithmic worker deactivation.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {disputes.length} Total Cases
              </span>
            </div>

            {disputes.length === 0 ? (
              <div className="p-12 text-center text-xs text-on-surface-variant">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-primary" />
                <p className="font-bold text-on-surface text-sm">Zero Open Grievances</p>
                <p className="mt-1">All service dispatches fulfilled without recorded citizen disputes.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container-high">
                {disputes.map((d) => (
                  <div key={d.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-on-surface font-mono">Dispute #{d.id}</span>
                        <span className="rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">
                          {d.category || 'Quality'}
                        </span>
                        <span className="rounded-full bg-surface-container-high text-on-surface-variant px-2 py-0.5 text-[10px] font-bold uppercase">
                          Status: {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface font-semibold">{d.description}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Raised by: <strong>{d.raised_by_name}</strong> ({d.raised_by_role}) • Booking #{d.booking_id}
                      </p>
                    </div>

                    {d.status === 'open' && (
                      <button
                        onClick={() => setDisputeModal({ isOpen: true, dispute: d })}
                        className="btn btn-primary text-xs py-2 px-4 shadow-sm"
                      >
                        Tribunal Review &amp; Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL: Enrol Worker Member ─────────────────────────────────── */}
      {showAddWorker && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 sm:p-8 shadow-2xl border border-surface-container-high animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3 mb-5">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Enrol Worker Member to Cooperative
              </h3>
              <button onClick={() => setShowAddWorker(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newWorkerForm.name}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
                  placeholder="e.g. Dinesh Verma"
                  className="input-stitch text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newWorkerForm.email}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, email: e.target.value })}
                  placeholder="dinesh@example.com"
                  className="input-stitch text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Mobile Phone (Aadhaar Linked)</label>
                <input
                  type="tel"
                  required
                  value={newWorkerForm.phone}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, phone: e.target.value })}
                  placeholder="9820001122"
                  className="input-stitch text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Primary Trade</label>
                <select
                  value={newWorkerForm.primary_service}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, primary_service: e.target.value })}
                  className="input-stitch text-xs"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="AC Service">AC Service &amp; HVAC</option>
                  <option value="Cleaner">Deep Cleaning Specialist</option>
                  <option value="Painter">Painter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Skills &amp; Trade Details</label>
                <input
                  type="text"
                  value={newWorkerForm.skills}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, skills: e.target.value })}
                  placeholder="e.g. Wiring, MCB fitting, Inverter setup"
                  className="input-stitch text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowAddWorker(false)}
                  className="btn btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWorker}
                  className="btn btn-primary text-xs py-2 px-5"
                >
                  {addingWorker ? <Loader2 className="animate-spin" size={16} /> : 'Register & Issue ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Assign Worker to Booking ────────────────────────────── */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 sm:p-8 shadow-2xl border border-surface-container-high animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3 mb-4">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Dispatch Artisan to Booking #{assignModal.booking?.id}
              </h3>
              <button
                onClick={() => setAssignModal({ isOpen: false, booking: null })}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignWorker} className="space-y-4">
              <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1">
                <p className="font-bold text-on-surface">{assignModal.booking?.service_name}</p>
                <p className="text-on-surface-variant">{assignModal.booking?.address || 'Noida'}</p>
                <p className="text-primary font-bold">Fee: ₹{assignModal.booking?.amount}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Select Certified Cooperative Artisan
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="input-stitch text-xs"
                >
                  <option value="">-- Choose Artisan Member --</option>
                  {workers.map((w) => (
                    <option key={w.worker_id} value={w.user_id}>
                      {w.name} ({w.primary_service} — {w.rating || 5.0}★)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setAssignModal({ isOpen: false, booking: null })}
                  className="btn btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedWorkerId}
                  className="btn btn-primary text-xs py-2 px-5"
                >
                  {assigning ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Resolve Dispute ─────────────────────────────────────── */}
      {disputeModal.isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 sm:p-8 shadow-2xl border border-surface-container-high animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3 mb-4">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Resolve Dispute #{disputeModal.dispute?.id}
              </h3>
              <button
                onClick={() => setDisputeModal({ isOpen: false, dispute: null })}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Tribunal Resolution Notes &amp; Findings
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record cooperative arbitration findings and restorative settlement..."
                  className="input-stitch text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setDisputeModal({ isOpen: false, dispute: null })}
                  className="btn btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="btn btn-primary text-xs py-2 px-5"
                >
                  {resolving ? <Loader2 className="animate-spin" size={16} /> : 'Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
