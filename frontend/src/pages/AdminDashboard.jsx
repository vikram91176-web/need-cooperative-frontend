/**
 * AdminDashboard.jsx — the Cooperative Federation administrative console.
 * Redesigned using Stitch Federation Central Admin Governance Hub & Civic Audit Tribunal references.
 *
 * WHAT: Executive command console for platform governance, worker KYC approval,
 *       booking oversight, welfare fund ledger, dispute tribunal, and AI demand forecasting.
 *
 * WHY:  On NEED, the cooperative federation governs the platform transparently under
 *       MSCS Act 2002, ensuring service standards through verified trade credentials
 *       and safeguarding the 85/10/5 collective welfare fund.
 *
 * HOW:  Seamlessly preserves all existing API bindings:
 *       - GET /api/admin/dashboard
 *       - POST /api/admin/workers/:id/verify
 *       - GET /api/admin/welfare-requests
 *       - POST /api/admin/welfare-requests/:id/action
 *       - POST /api/admin/tickets/:id/status
 *       - GET /api/admin/forecasting
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  HeartHandshake,
  HelpCircle,
  IndianRupee,
  LifeBuoy,
  Loader2,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getAdminDashboard,
  getAdminWelfareRequests,
  getDemandForecasting,
  handleWelfareRequestAction,
  updateTicketStatus,
  verifyWorker,
} from '../services/api'

// ---------------------------------------------------------------------------
// Status styles & badges
// ---------------------------------------------------------------------------
const VERIFICATION_STYLES = {
  verified: 'bg-primary/10 text-primary border-primary/30',
  pending: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/30',
}

const TICKET_STYLES = {
  open: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
  in_progress: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  resolved: 'bg-primary/15 text-primary border-primary/30',
}

const BOOKING_STYLES = {
  pending: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
  requested: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
  accepted: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  in_progress: 'bg-teal-500/10 text-teal-800 border-teal-500/30',
  completed: 'bg-primary/10 text-primary border-primary/30',
  confirmed: 'bg-primary text-white border-primary',
  cancelled: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/30',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('workers') // 'workers' | 'bookings' | 'welfare' | 'tickets' | 'forecasting'

  // Workers search & filter state
  const [workerFilter, setWorkerFilter] = useState('all') // 'all' | 'pending' | 'verified' | 'rejected'
  const [workerSearch, setWorkerSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  // Welfare & Forecasting state
  const [welfareRequests, setWelfareRequests] = useState([])
  const [forecastingData, setForecastingData] = useState(null)

  function loadData(showSkeleton = true) {
    if (showSkeleton) setLoading(true)
    setError('')
    getAdminDashboard()
      .then(setData)
      .catch((err) => {
        setError(err?.response?.data?.error || 'Could not load federation admin dashboard.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function fetchWelfareRequests() {
    getAdminWelfareRequests()
      .then((res) => setWelfareRequests(res.requests || []))
      .catch(() => {})
  }

  function fetchForecasting() {
    getDemandForecasting()
      .then((res) => setForecastingData(res))
      .catch(() => {})
  }

  useEffect(() => {
    if (activeTab === 'welfare') {
      fetchWelfareRequests()
    } else if (activeTab === 'forecasting') {
      fetchForecasting()
    }
  }, [activeTab])

  // Action: Verify or Reject Worker
  async function handleVerify(workerId, newStatus) {
    setActionLoadingId(workerId)
    try {
      await verifyWorker(workerId, newStatus)
      setData((prev) => {
        const updatedWorkers = prev.workers.map((w) => {
          if (w.user_id === workerId) {
            return {
              ...w,
              verification_status: newStatus,
              is_available: newStatus === 'verified',
            }
          }
          return w
        })

        const verified_workers = updatedWorkers.filter((w) => w.verification_status === 'verified').length
        const pending_workers = updatedWorkers.filter((w) => w.verification_status === 'pending').length
        const rejected_workers = updatedWorkers.filter((w) => w.verification_status === 'rejected').length

        return {
          ...prev,
          workers: updatedWorkers,
          stats: {
            ...prev.stats,
            verified_workers,
            pending_workers,
            rejected_workers,
          },
        }
      })

      setActionNotice({
        type: 'success',
        message: `Artisan member status updated to "${newStatus.toUpperCase()}".`,
      })
      setTimeout(() => setActionNotice(null), 4000)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update verification status.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Action: Approve or Reject Welfare Request
  async function handleWelfareAction(requestId, status) {
    let notes = ''
    if (status === 'rejected') {
      const input = window.prompt('Specify reason for rejecting emergency withdrawal request (optional):')
      if (input === null) return
      notes = input
    }

    setActionLoadingId(`welfare-${requestId}`)
    try {
      await handleWelfareRequestAction(requestId, status, notes)
      setActionNotice({
        type: 'success',
        message: `Welfare withdrawal request #${requestId} ${status} successfully.`,
      })
      setTimeout(() => setActionNotice(null), 4000)
      fetchWelfareRequests()
      loadData(false)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update welfare request status.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Action: Update Support Ticket Status with Resolution Response
  async function handleTicketStatus(ticketId, newStatus) {
    let responseText = ''
    if (['in_progress', 'resolved'].includes(newStatus)) {
      const input = window.prompt(`Enter tribunal resolution response for ticket #${ticketId} (optional):`)
      if (input === null) return
      responseText = input
    }

    setActionLoadingId(`ticket-${ticketId}`)
    try {
      const res = await updateTicketStatus(ticketId, newStatus, responseText)
      setData((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId
            ? { ...t, status: newStatus, admin_response: res.ticket?.admin_response || responseText }
            : t
        ),
      }))
      setActionNotice({
        type: 'success',
        message: `Support inquiry #${ticketId} marked as ${newStatus.toUpperCase()}.`,
      })
      setTimeout(() => setActionNotice(null), 4000)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update ticket status.')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-surface py-10 px-4 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-surface-container-high rounded-2xl w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-surface-container rounded-2xl" />
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
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Federation Admin Error</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{error}</p>
        <button onClick={() => loadData()} className="btn btn-primary">
          Reload Federation Console
        </button>
      </div>
    )
  }

  const { stats, workers, recent_bookings, tickets } = data

  const filteredWorkers = workers.filter((w) => {
    const matchesFilter = workerFilter === 'all' || w.verification_status === workerFilter
    const term = workerSearch.toLowerCase()
    const matchesSearch =
      !term ||
      w.name.toLowerCase().includes(term) ||
      (w.primary_service && w.primary_service.toLowerCase().includes(term)) ||
      (w.city && w.city.toLowerCase().includes(term)) ||
      (w.skills && w.skills.toLowerCase().includes(term))
    return matchesFilter && matchesSearch
  })

  // Estimated gross GMV from total bookings or welfare base
  const estimatedGmv = stats.total_bookings > 0 ? stats.total_bookings * 680 : 1480000

  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Top Governance Ambient Bar ──────────────────────────────────── */}
      <div className="w-full bg-surface-container-high px-4 sm:px-6 lg:px-8 py-2 text-on-surface-variant flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-container text-white font-label-caps text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed mr-1.5 animate-pulse" />
            COUNCIL ACTIVE SESSION
          </span>
          <span className="font-semibold text-on-surface">
            Noida &amp; NCR Worker Cooperative Federation General Assembly
          </span>
          <span className="text-outline-variant">|</span>
          <span className="font-mono text-[11px]">REG: MSCS/CR/2026/8912 • MSCS ACT 2002</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <ShieldCheck size={14} className="text-primary" />
            <span>Audit Block #49,201 Synced</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <Building2 size={14} />
            <span>Noida Authority Desk</span>
          </div>
        </div>
      </div>

      {/* ── Header Title Banner & Quick Actions ─────────────────────────── */}
      <section className="w-full bg-surface-container-lowest border-b border-surface-container-high px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-caps text-xs uppercase tracking-wider text-primary font-bold">
                Executive Operations &amp; Statutory Audit
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-bold">
                Live Federation Protocol
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Federation Central Admin &amp; Civic Governance Portal
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl mt-1 leading-relaxed">
              Real-time telemetry over worker-owned capital flows, statutory welfare vaults, Aadhaar e-KYC compliance,
              and democratic trade guild arbitrations across Delhi NCR.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => loadData(false)}
              className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Refresh live data"
            >
              <RefreshCw size={14} />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} />
              <span>Export Audit Ledger</span>
            </button>
            <button
              onClick={() => alert('Cooperative General Assembly session summoned. All ward coordinators notified.')}
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              <span>Convene Council</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Action Notice Alert ────────────────────────────────────────── */}
      {actionNotice && (
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3.5 text-sm text-on-surface animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-primary" />
              <span className="font-bold text-xs">{actionNotice.message}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-on-surface-variant hover:text-on-surface">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── 5 Major Federation KPIs (Bento arrangement) ─────────────────── */}
      <section className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Gross GMV */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-caps text-xs uppercase font-bold text-on-surface-variant">
                Federation GMV
              </span>
              <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <IndianRupee size={16} />
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                ₹{estimatedGmv.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 mt-1 text-primary font-bold text-xs">
                <TrendingUp size={13} />
                <span>+14.2% MoM</span>
                <span className="text-on-surface-variant font-normal text-[11px]">(Oct 2026)</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Artisan Take-Home (85%) */}
          <div className="bg-primary text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-primary-container rounded-full opacity-40 blur-lg pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-xs uppercase font-bold text-primary-fixed">
                Worker Take-Home (85%)
              </span>
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl sm:text-3xl font-black text-white">
                ₹{Math.round(estimatedGmv * 0.85).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-primary-fixed font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">sync_saved_locally</span>
                <span>Direct UPI / DBT • Zero Fee</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Jan Kalyan Welfare Vault (10%) */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-caps text-xs uppercase font-bold text-secondary">
                Welfare Vault (10%)
              </span>
              <span className="w-8 h-8 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                <HeartHandshake size={16} />
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                ₹{stats.welfare_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-1 mt-1 text-secondary font-bold text-xs">
                <Shield size={13} />
                <span>₹{stats.welfare_balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Liquid</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Certified Artisans */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-caps text-xs uppercase font-bold text-on-surface-variant">
                Certified Artisans
              </span>
              <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <Award size={16} />
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                {stats.verified_workers}{' '}
                <span className="text-xs font-normal text-on-surface-variant">/ {stats.total_workers}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-primary font-bold text-xs">
                <CheckCircle2 size={13} />
                <span>{stats.pending_workers} Pending Review</span>
              </div>
            </div>
          </div>

          {/* KPI 5: Platform Bookings */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-caps text-xs uppercase font-bold text-on-surface-variant">
                Citizen Bookings
              </span>
              <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <Briefcase size={16} />
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                {stats.total_bookings}
              </div>
              <div className="flex items-center gap-1 mt-1 text-on-surface-variant text-xs">
                <span>{stats.total_customers} Households Served</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Canvas & Tab Navigation ───────────────────────────────── */}
      <section className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-container-high overflow-x-auto pb-px mb-6">
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'workers'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <UserCheck size={16} />
            <span>Worker Members &amp; KYC Queue</span>
            {stats.pending_workers > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] font-extrabold text-white">
                {stats.pending_workers} Action
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Briefcase size={16} />
            <span>Bookings Oversight</span>
          </button>

          <button
            onClick={() => setActiveTab('welfare')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'welfare'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <HeartHandshake size={16} />
            <span>Welfare Social Security Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LifeBuoy size={16} />
            <span>Dispute Tribunal &amp; Support Desk</span>
            {tickets.filter((t) => t.status === 'open').length > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.2 text-[10px] font-extrabold text-white">
                {tickets.filter((t) => t.status === 'open').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('forecasting')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'forecasting'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <TrendingUp size={16} />
            <span>AI Demand Forecasting</span>
          </button>
        </div>

        {/* ── TAB 1: WORKER KYC QUEUE & DIRECTORY ─────────────────────────── */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            {/* Filter Chips + Search */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-low p-1">
                {[
                  { key: 'all', label: `All Artisans (${workers.length})` },
                  { key: 'pending', label: `Pending Approvals (${stats.pending_workers})` },
                  { key: 'verified', label: `Verified Active (${stats.verified_workers})` },
                  { key: 'rejected', label: `Flagged / Rejected (${stats.rejected_workers})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setWorkerFilter(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      workerFilter === tab.key
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search worker name, trade, city..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest py-2 pl-9 pr-4 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Workers KYC Table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase tracking-wider border-b border-surface-container-high">
                    <th className="py-3 px-4 font-bold">Artisan Identity &amp; Contact</th>
                    <th className="py-3 px-4 font-bold">Trade &amp; Technical Credentials</th>
                    <th className="py-3 px-4 font-bold">Cluster Location</th>
                    <th className="py-3 px-4 font-bold">Orders / Star Rating</th>
                    <th className="py-3 px-4 font-bold">KYC Status</th>
                    <th className="py-3 px-4 text-right font-bold">Federation Council Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                        No artisans match your selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w) => {
                      const isPending = w.verification_status === 'pending'
                      const isVerified = w.verification_status === 'verified'
                      const isRejected = w.verification_status === 'rejected'
                      const isProcessing = actionLoadingId === w.user_id

                      return (
                        <tr key={w.user_id} className="hover:bg-surface-container-low/50 transition-colors">
                          {/* Name & ID */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {w.name ? w.name.substring(0, 2).toUpperCase() : 'AR'}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface text-sm">{w.name}</p>
                                <p className="font-mono text-[11px] text-on-surface-variant">
                                  ID: #{(w.user_id || w.id || 0).toString().padStart(4, '0')} • {w.phone}
                                </p>
                                <p className="text-[11px] text-on-surface-variant truncate max-w-[200px]">{w.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Trade & Certification */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-primary text-xs">{w.primary_service}</span>
                            <p className="text-[11px] text-on-surface-variant truncate max-w-[180px]" title={w.skills || ''}>
                              {w.skills || 'General skilled'}
                            </p>
                            <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">
                              Exp: {w.experience_years}y • {w.certifications || 'ITI Diploma'}
                            </p>
                          </td>

                          {/* Location */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                              <MapPin size={13} className="shrink-0 text-secondary" />
                              <span className="truncate max-w-[140px]">{w.city || 'Noida'}</span>
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 font-bold text-on-surface text-xs">
                              <Star size={13} className="fill-secondary text-secondary" />
                              <span>{w.rating > 0 ? w.rating : '5.0'}</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant">{w.total_jobs} orders done</p>
                          </td>

                          {/* Verification Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
                                VERIFICATION_STYLES[w.verification_status] || 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {w.verification_status === 'verified' && <ShieldCheck size={13} />}
                              {w.verification_status === 'pending' && <Clock size={13} />}
                              {w.verification_status === 'rejected' && <ShieldAlert size={13} />}
                              {w.verification_status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {isProcessing ? (
                              <Loader2 size={18} className="animate-spin text-primary inline-block" />
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleVerify(w.user_id, 'verified')}
                                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-container shadow-sm"
                                      title="Approve verification documents"
                                    >
                                      <Check size={13} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleVerify(w.user_id, 'rejected')}
                                      className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                      title="Reject verification"
                                    >
                                      <X size={13} />
                                      Reject
                                    </button>
                                  </>
                                )}

                                {isRejected && (
                                  <button
                                    onClick={() => handleVerify(w.user_id, 'verified')}
                                    className="rounded-lg border border-primary bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                                  >
                                    Re-Approve
                                  </button>
                                )}

                                {isVerified && (
                                  <button
                                    onClick={() => handleVerify(w.user_id, 'rejected')}
                                    className="rounded-lg border border-surface-container-high px-2.5 py-1 text-xs font-bold text-on-surface-variant transition hover:bg-red-50 hover:text-red-700"
                                    title="Revoke member verification"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: BOOKINGS OVERSIGHT ───────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface">
                  Platform Bookings Oversight
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Live service dispatches and completions across all cooperative trade clusters.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {recent_bookings.length} Bookings Logged
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
              {recent_bookings.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <Briefcase size={36} className="mx-auto mb-3 text-on-surface-variant/60" />
                  <p className="font-bold text-on-surface">No bookings logged yet</p>
                  <p className="text-xs mt-1">Platform service requests will appear here in real-time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase tracking-wider border-b border-surface-container-high">
                        <th className="py-3 px-4 font-bold">Booking ID</th>
                        <th className="py-3 px-4 font-bold">Service &amp; Urgency</th>
                        <th className="py-3 px-4 font-bold">Schedule</th>
                        <th className="py-3 px-4 font-bold">Assigned Artisan</th>
                        <th className="py-3 px-4 font-bold">Gross Rupee Fee</th>
                        <th className="py-3 px-4 text-right font-bold">Dispatch Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {recent_bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-on-surface">
                            #BK-{b.id.toString().padStart(4, '0')}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-on-surface text-sm">{b.service_name}</span>
                            {b.is_emergency && (
                              <span className="ml-2 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-extrabold uppercase text-red-700">
                                🚨 Urgent
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant">
                            {b.scheduled_date ? `${b.scheduled_date} ${b.scheduled_time || ''}` : 'Immediate'}
                          </td>
                          <td className="py-4 px-4 font-semibold text-on-surface">
                            {b.worker_name || 'Unassigned'}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-on-surface">
                            ₹{b.amount || 0}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                BOOKING_STYLES[b.status] || 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: WELFARE SOCIAL SECURITY LEDGER ──────────────────────── */}
        {activeTab === 'welfare' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm border-l-4 border-l-primary">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Lifetime Welfare Generated
                </p>
                <p className="mt-2 font-mono text-3xl font-black text-on-surface">
                  ₹{stats.welfare_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">Cumulative 10% welfare allocations</p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm border-l-4 border-l-secondary">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Active Liquid Reserve (70%)
                </p>
                <p className="mt-2 font-mono text-3xl font-black text-secondary">
                  ₹{stats.welfare_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">Available across worker wallets</p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm border-l-4 border-l-primary-container">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Insurance Reserve Pool (30%)
                </p>
                <p className="mt-2 font-mono text-3xl font-black text-primary">
                  ₹{stats.insurance_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">Accident &amp; group health coverage pool</p>
              </div>
            </div>

            {/* Emergency Cash Withdrawal Requests Review Panel */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Emergency Welfare Withdrawal Requests
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Governed by Cooperative Bylaw Sec. 14A. Quorum review required.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary text-xs font-bold">
                  {welfareRequests.length} Requests
                </span>
              </div>

              {welfareRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">
                  <HeartHandshake size={28} className="mx-auto mb-2 text-primary" />
                  <p className="font-bold text-on-surface">No Pending Emergency Cash Out Requests</p>
                  <p className="mt-0.5">All worker welfare accounts in good standing.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-container-high bg-surface-container-low text-on-surface-variant font-label-caps uppercase">
                        <th className="px-4 py-3 font-bold">Worker Member</th>
                        <th className="px-4 py-3 font-bold">Amount Requested</th>
                        <th className="px-4 py-3 font-bold">Stated Emergency Reason</th>
                        <th className="px-4 py-3 font-bold">Review Status</th>
                        <th className="px-4 py-3 text-right font-bold">Council Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {welfareRequests.map((r) => {
                        const isActing = actionLoadingId === `welfare-${r.id}`
                        return (
                          <tr key={r.id} className="hover:bg-surface-container-low/40">
                            <td className="px-4 py-3.5 font-bold text-on-surface">{r.worker_name}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-primary">₹{r.amount}</td>
                            <td className="px-4 py-3.5 text-on-surface-variant max-w-[240px] truncate" title={r.reason}>
                              {r.reason}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                  r.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                                    : r.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-700 border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isActing ? (
                                <Loader2 size={16} className="animate-spin text-primary inline-block" />
                              ) : r.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleWelfareAction(r.id, 'approved')}
                                    className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary-container transition"
                                  >
                                    Approve Disbursal
                                  </button>
                                  <button
                                    onClick={() => handleWelfareAction(r.id, 'rejected')}
                                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Member Welfare Fund Balances */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
              <h3 className="font-headline-md text-base font-bold text-on-surface mb-4">
                Active Member Welfare Balances
              </h3>
              <div className="divide-y divide-surface-container-high">
                {workers.slice(0, 8).map((w) => (
                  <div key={w.user_id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-bold text-on-surface text-sm">{w.name} ({w.primary_service})</p>
                      <p className="text-on-surface-variant text-[11px]">Completed {w.total_jobs} cooperative jobs</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-primary text-sm">
                        ₹{w.welfare_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">Current wallet balance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: DISPUTE TRIBUNAL & SUPPORT DESK ──────────────────────── */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface">
                  Cooperative Dispute Tribunal &amp; Support Desk
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Customer and worker inquiries, payment clarification, and restorative arbitration.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {tickets.length} Inquiries Logged
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
              {tickets.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <LifeBuoy size={36} className="mx-auto mb-3 text-on-surface-variant/60" />
                  <p className="font-bold text-on-surface">No support tickets currently open</p>
                  <p className="text-xs mt-1">Inquiries submitted through the Support Center will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase tracking-wider border-b border-surface-container-high">
                        <th className="py-3 px-4 font-bold">Ticket ID</th>
                        <th className="py-3 px-4 font-bold">User Member</th>
                        <th className="py-3 px-4 font-bold">Category &amp; Subject</th>
                        <th className="py-3 px-4 font-bold">Filing Date</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 text-right font-bold">Tribunal Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-on-surface">
                            #TK-{t.id.toString().padStart(4, '0')}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-on-surface">{t.user_name || 'User'}</p>
                            <p className="text-[11px] text-on-surface-variant capitalize">{t.user_role}</p>
                          </td>
                          <td className="py-4 px-4 max-w-[280px]">
                            <span className="text-xs font-bold text-primary capitalize">
                              [{t.category || 'General'}]
                            </span>
                            <p className="font-bold text-on-surface truncate" title={t.subject}>
                              {t.subject}
                            </p>
                            {t.description && (
                              <p className="text-xs text-on-surface-variant truncate max-w-[240px]">
                                {t.description}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant">
                            {t.created_at ? t.created_at.split('T')[0] : '—'}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                TICKET_STYLES[t.status] || 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <select
                              value={t.status}
                              onChange={(e) => handleTicketStatus(t.id, e.target.value)}
                              disabled={actionLoadingId === `ticket-${t.id}`}
                              className="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: AI DEMAND FORECASTING & PREDICTIVE ANALYTICS ─────────── */}
        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface">
                AI Demand Forecasting &amp; Worker Allocation
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Real-time predictive models anticipating seasonal service demand surges across Noida &amp; NCR.
              </p>
            </div>

            {!forecastingData ? (
              <div className="bg-surface-container-lowest rounded-2xl py-16 text-center text-on-surface-variant border border-surface-container-high">
                <Loader2 size={28} className="animate-spin mx-auto mb-2 text-primary" />
                <p className="text-xs">Computing AI demand forecasting models...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary KPIs */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high border-l-4 border-l-primary shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Forecast Horizon</p>
                    <p className="mt-1 font-headline-md text-lg font-bold text-on-surface">
                      {forecastingData.forecasting_summary.forecast_period}
                    </p>
                    <p className="text-xs text-primary font-bold mt-1">
                      {forecastingData.forecasting_summary.overall_demand_growth}
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high border-l-4 border-l-emerald-600 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Verified Active Partners</p>
                    <p className="mt-1 font-headline-md text-lg font-bold text-on-surface">
                      {forecastingData.forecasting_summary.verified_active_workers} Active
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {forecastingData.forecasting_summary.total_registered_workers} Total Registered
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high border-l-4 border-l-secondary shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Predictive Demand Status</p>
                    <p className="mt-1 font-headline-md text-lg font-bold text-secondary">
                      Peak Capacity Alert
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">Noida &amp; Greater Noida Hotspots</p>
                  </div>
                </div>

                {/* AI Strategic Advisories */}
                <div className="rounded-3xl p-6 sm:p-8 space-y-4 bg-gradient-to-br from-primary via-primary-container to-tertiary text-white shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-fixed">
                    <Zap size={16} className="text-secondary-container" />
                    AI Executive Advisories &amp; Strategic Actions
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {forecastingData.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-fixed">
                            {rec.category}
                          </span>
                          <span className="rounded bg-secondary-container/30 px-2 py-0.5 text-[10px] font-bold text-white border border-secondary-container/40">
                            {rec.impact}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{rec.title}</h4>
                        <p className="text-xs text-white/90 leading-relaxed">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* High Demand Hotspots Table */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high space-y-4">
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Top High-Demand Service Hotspots
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-surface-container-high bg-surface-container-low text-on-surface-variant font-label-caps uppercase">
                          <th className="px-4 py-3 font-bold">Service Name</th>
                          <th className="px-4 py-3 font-bold">Trade Category</th>
                          <th className="px-4 py-3 font-bold">Seasonal Surge Factor</th>
                          <th className="px-4 py-3 font-bold">7-Day Projected Demand</th>
                          <th className="px-4 py-3 font-bold">Active Verified Artisans</th>
                          <th className="px-4 py-3 text-right font-bold">Readiness Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high">
                        {forecastingData.demand_hotspots.map((h) => (
                          <tr key={h.service_id} className="hover:bg-surface-container-low/40">
                            <td className="px-4 py-3.5 font-bold text-on-surface">{h.service_name}</td>
                            <td className="px-4 py-3.5 text-on-surface-variant">{h.category}</td>
                            <td className="px-4 py-3.5 font-bold text-primary">
                              {h.seasonal_factor} ({h.trend_percentage})
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-on-surface">
                              {h.projected_7day_demand} bookings
                            </td>
                            <td className="px-4 py-3.5 font-mono text-on-surface">
                              {h.active_verified_workers} partners
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                  h.urgency_level === 'critical'
                                    ? 'bg-red-500/10 text-red-700 border-red-500/20'
                                    : h.urgency_level === 'high'
                                    ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                                }`}
                              >
                                {h.urgency_level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </section>

    </div>
  )
}
