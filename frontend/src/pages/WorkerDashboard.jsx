/**
 * WorkerDashboard.jsx — the control centre for verified cooperative workers.
 * Redesigned using the Stitch Worker Partner Portal & Welfare Dashboard design reference.
 *
 * WHAT: Shows the worker's cooperative member ID card, availability toggle,
 *       earnings, ratings, welfare savings trust, compliance credentials, and assigned jobs.
 *
 * WHY:  On NEED, workers are cooperative owners, not gig contractors.
 *       The dashboard emphasizes cooperative membership, verified trade status,
 *       and the 90/10 democratic fair-split safety net.
 *
 * HOW:  Integrates seamlessly with existing API endpoints:
 *       - GET /api/worker/dashboard
 *       - POST /api/worker/availability
 *       - POST /api/worker/bookings/:id/action
 *       - POST /api/bookings/:id/status
 *       - POST /api/worker/welfare/withdraw
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  HeartHandshake,
  IndianRupee,
  Info,
  Loader2,
  MapPin,
  Phone,
  Power,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RotateCcw,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  User,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getWorkerDashboard,
  handleWorkerBookingAction,
  requestWelfareWithdrawal,
  updateWorkerAvailability,
  updateBookingStatus,
} from '../services/api'
import WorkerIdCard from '../components/WorkerIdCard'
import SectionHeading from '../components/SectionHeading'
import BookingLifecycleStepper from '../components/BookingLifecycleStepper'
import VerificationModal from '../components/VerificationModal'
import InvoiceModal from '../components/InvoiceModal'

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const STATUS_BADGES = {
  pending: {
    bg: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
    label: 'Pending Request',
    icon: 'schedule',
  },
  requested: {
    bg: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
    label: 'New Dispatch',
    icon: 'notifications_active',
  },
  worker_assigned: {
    bg: 'bg-primary/10 text-primary border-primary/30',
    label: 'Assigned to You',
    icon: 'assignment_ind',
  },
  accepted: {
    bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    label: 'Accepted • Prepare',
    icon: 'thumb_up',
  },
  on_the_way: {
    bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
    label: 'On The Way 🚗',
    icon: 'near_me',
  },
  arrived: {
    bg: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
    label: 'Arrived at Site 📍',
    icon: 'pin_drop',
  },
  in_progress: {
    bg: 'bg-teal-500/10 text-teal-800 border-teal-500/30',
    label: 'Work in Progress ⚡',
    icon: 'construction',
  },
  completed: {
    bg: 'bg-primary/15 text-primary border-primary/40',
    label: 'Service Completed ✅',
    icon: 'task_alt',
  },
  confirmed: {
    bg: 'bg-primary text-white border-primary',
    label: 'Confirmed & Settled 🏆',
    icon: 'verified',
  },
  cancelled: {
    bg: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
    label: 'Cancelled',
    icon: 'cancel',
  },
  rejected: {
    bg: 'bg-red-500/10 text-red-700 border-red-500/30',
    label: 'Declined',
    icon: 'block',
  },
}

function BookingStatusBadge({ status }) {
  const badge = STATUS_BADGES[status] || {
    bg: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
    label: status,
    icon: 'info',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.bg}`}>
      <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
      {badge.label}
    </span>
  )
}

function VerificationBanner({ status, notes, onOpenModal }) {
  if (status === 'verified') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3.5 text-sm text-on-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="font-bold text-primary">Cooperative Federation Verified Artisan</strong>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">Active Status</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Your government Aadhaar offline e-KYC &amp; ITI Trade certifications have been verified by Federation District Inspection.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="rounded-xl border border-primary/30 bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">file_upload</span>
          Update Trade Credentials
        </button>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-500/10 px-5 py-3.5 text-sm text-on-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div>
            <strong className="font-bold text-amber-900">Trade Verification In Review:</strong>
            <p className="text-xs text-amber-800 mt-0.5">
              The Cooperative Society Council is currently validating your trade proof. Unverified members cannot accept public bookings.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">upload</span>
          Submit / Edit Proof
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-500/10 px-5 py-3.5 text-sm text-on-surface">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </div>
        <div>
          <strong className="font-bold text-red-900">Verification Requires Attention:</strong>
          <p className="text-xs text-red-800 mt-0.5">
            {notes || 'Your submitted documentation requires revision before cooperative board approval.'}
          </p>
        </div>
      </div>
      <button
        onClick={onOpenModal}
        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm flex items-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[16px]">refresh</span>
        Re-submit Trade Proof
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Worker Dashboard Main Component
// ---------------------------------------------------------------------------
export default function WorkerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [jobActionLoadingId, setJobActionLoadingId] = useState(null)
  const [verificationModal, setVerificationModal] = useState({ isOpen: false })
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  function loadDashboard(showSkeleton = true) {
    if (showSkeleton) setLoading(true)
    setError('')
    getWorkerDashboard()
      .then(setData)
      .catch((err) => {
        setError(err?.response?.data?.error || 'Could not load worker dashboard.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleJobAction(bookingId, action) {
    if (jobActionLoadingId !== null) return

    let note = ''
    if (action === 'complete') {
      const input = window.prompt(
        'Add a brief job completion note (optional):',
        'Service completed with precision and verified by customer.'
      )
      if (input === null) return
      note = input || 'Service completed.'
    }

    setJobActionLoadingId(bookingId)
    try {
      await handleWorkerBookingAction(bookingId, action, note)
      loadDashboard(false)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update job status.')
    } finally {
      setJobActionLoadingId(null)
    }
  }

  async function handleWithdrawalRequest() {
    if (!data?.wallet) return
    const maxAvailable = Math.max(0, data.wallet.balance - (data.wallet.insurance_contribution || 0))
    if (maxAvailable <= 0) {
      alert('You have no withdrawable emergency balance at this time. Insurance reserve (30%) is protected for health & accident emergencies.')
      return
    }

    const amountStr = window.prompt(
      `Enter emergency withdrawal amount (Maximum ₹${maxAvailable.toLocaleString('en-IN')}):`,
      maxAvailable.toString()
    )
    if (!amountStr) return

    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0 || amount > maxAvailable) {
      alert(`Invalid amount. Please enter an amount between ₹1 and ₹${maxAvailable.toLocaleString('en-IN')}.`)
      return
    }

    const reason = window.prompt(
      'Specify reason for emergency withdrawal (e.g. Medical emergency, Children school fees, Tool repair):',
      'Medical emergency'
    )
    if (!reason || !reason.trim()) {
      alert('A reason is required by Cooperative Bylaw Sec. 14A for welfare audit compliance.')
      return
    }

    try {
      const res = await requestWelfareWithdrawal(amount, reason.trim())
      alert(res.message || 'Emergency withdrawal request submitted to Cooperative Society Board!')
      loadDashboard(false)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to submit withdrawal request.')
    }
  }

  async function handleToggleAvailability() {
    if (!data?.profile) return
    const current = data.profile.is_available
    setTogglingAvailability(true)
    try {
      const res = await updateWorkerAvailability(!current)
      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          is_available: res.is_available,
        },
      }))
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update availability status. Please ensure your trade credentials are approved.')
    } finally {
      setTogglingAvailability(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-surface py-10 px-4 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-surface-container-high rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-container rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-surface-container-high rounded-2xl w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Worker Portal Error</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{error}</p>
        <button onClick={() => loadDashboard()} className="btn btn-primary">
          Reload Dashboard
        </button>
      </div>
    )
  }

  const { user: workerUser, profile, wallet, stats, bookings } = data
  const isAvailable = profile?.is_available ?? false
  const verificationStatus = profile?.verification_status || 'pending'
  const verificationNotes = profile?.verification_notes || ''
  const skillsList = (profile?.skills || '').split(',').map((s) => s.trim()).filter(Boolean)

  const withdrawableAmount = Math.max(0, (wallet?.balance || 0) - (wallet?.insurance_contribution || 0))
  const insuranceAmount = wallet?.insurance_contribution || 0
  const totalWelfareSaved = wallet?.total_contribution || wallet?.balance || 0

  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Top Greeting & Realtime Status Band ──────────────────────────── */}
      <section className="w-full border-b border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Namaste, {workerUser.name.split(' ')[0]} 🙏
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Government Co-op Member
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-xs uppercase font-mono">
                ID: #{`SHR-2026-${workerUser.id.toString().padStart(4, '0')}`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant text-xs flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-secondary">
                <span className="material-symbols-outlined text-[15px]">groups</span>
                Noida Artisans &amp; Service Union (Affiliated Sector 62 Hub)
              </span>
              <span className="text-outline-variant">•</span>
              <span>Next Democratic Dividend Payout: <strong>1st of Next Month</strong></span>
            </div>
          </div>

          {/* Availability Toggle & Trade Documents Action */}
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <div className="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvailable ? 'bg-primary animate-pulse' : 'bg-outline-variant'
                  }`}
                />
                <span className="font-label-md text-xs sm:text-sm text-on-surface font-bold whitespace-nowrap">
                  {isAvailable ? 'Online & Ready' : 'Currently Offline'}
                </span>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAvailable ? 'bg-primary' : 'bg-outline-variant'
                }`}
                title="Toggle accepting customer job dispatches"
              >
                {togglingAvailability ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={12} className="animate-spin text-white" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                )}
              </button>
            </div>

            <button
              onClick={() => setVerificationModal({ isOpen: true })}
              className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3.5 py-2 rounded-xl font-label-md text-xs sm:text-sm font-bold transition-all shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
              <span className="hidden sm:inline">Trade</span> Credentials
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* ── Verification Banner ────────────────────────────────────────── */}
        <VerificationBanner
          status={verificationStatus}
          notes={verificationNotes}
          onOpenModal={() => setVerificationModal({ isOpen: true })}
        />

        {/* ── 4-Stat Metrics Bar with Cooperative Transparency Callouts ───── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Earnings */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-3 -top-3 w-20 h-20 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  Total Net Earnings
                </span>
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee size={16} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                  ₹{stats.earnings.toLocaleString('en-IN')}
                </span>
                <span className="inline-flex items-center text-primary font-label-md text-xs font-bold">
                  <TrendingUp size={13} className="mr-0.5" />+18%
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2 bg-surface-container-low -mx-5 -mb-5 px-5 py-2 flex items-center justify-between text-on-surface-variant font-label-caps text-[11px]">
              <span>85-90% Direct Payout</span>
              <span className="text-primary font-bold">Zero Comm. Skim</span>
            </div>
          </div>

          {/* Stat 2: Jobs Completed */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  Jobs Fulfilled
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
                  <Wrench size={16} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                  {stats.total_jobs}
                </span>
                <span className="text-on-surface-variant text-xs">orders verified</span>
              </div>
            </div>
            <div className="mt-4 pt-2 bg-surface-container-low -mx-5 -mb-5 px-5 py-2 flex items-center justify-between text-on-surface-variant font-label-caps text-[11px]">
              <span>Co-op Verification</span>
              <span className="text-primary font-bold">100% Verified</span>
            </div>
          </div>

          {/* Stat 3: Rating */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  Member Rating
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
                  <Star size={16} className="fill-secondary text-secondary" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-metric-val text-2xl sm:text-3xl font-black text-on-surface">
                  {stats.rating || '5.0'}
                </span>
                <div className="flex text-secondary text-xs">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 bg-surface-container-low -mx-5 -mb-5 px-5 py-2 flex items-center justify-between text-on-surface-variant font-label-caps text-[11px]">
              <span>Citizen Feedback</span>
              <span className="text-secondary font-bold">Tier A Master</span>
            </div>
          </div>

          {/* Stat 4: Welfare Savings */}
          <div className="bg-primary text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-container rounded-full opacity-40 blur-lg pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-xs text-primary-fixed uppercase tracking-wider font-bold">
                  Welfare Savings
                </span>
                <span className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                  <HeartHandshake size={16} />
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-metric-val text-2xl sm:text-3xl font-black text-white">
                  ₹{wallet.balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2 bg-white/10 -mx-5 -mb-5 px-5 py-2 flex items-center justify-between font-label-caps text-[11px] text-white">
              <span>Democratic Safety Net</span>
              <span className="text-primary-fixed font-bold">Liquid &amp; Protected</span>
            </div>
          </div>
        </section>

        {/* ── Interactive Cooperative Welfare Wallet & Withdrawal Banner ── */}
        <section className="w-full bg-gradient-to-br from-primary via-primary-container to-tertiary rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-primary-fixed/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1 rounded-full backdrop-blur-md self-start">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">security</span>
                <span className="font-label-caps text-xs text-white uppercase tracking-wider font-bold">
                  Democratic Cooperative Security Vault
                </span>
              </div>
              <h2 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Artisan Emergency Welfare Trust
              </h2>
              <p className="text-sm text-white/90 leading-relaxed">
                Unlike private gig corporations that confiscate 25-35% in platform commissions as corporate profits,
                <strong> 10% of every rupee earned</strong> through NEED flows directly into your personal cooperative safety net
                for medical emergencies, child schooling, equipment insurance, and seasonal liquidity.
              </p>

              {/* Fund Partitioning Breakdown Bars */}
              <div className="mt-2 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-white">Welfare Fund Partitioning (Bylaw Sec. 12)</span>
                  <span className="text-primary-fixed font-bold font-mono">
                    Total Lifetime Saved: ₹{totalWelfareSaved.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="w-full h-3 bg-inverse-surface/40 rounded-full flex overflow-hidden">
                  <div
                    className="bg-primary-fixed h-full transition-all duration-500"
                    style={{ width: '70%' }}
                    title="70% Liquid Emergency Savings"
                  />
                  <div
                    className="bg-secondary-container h-full transition-all duration-500"
                    style={{ width: '30%' }}
                    title="30% Medical & Life Insurance Pool"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary-fixed mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-white leading-tight">
                        ₹{(wallet.balance * 0.7).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (70%)
                      </p>
                      <p className="text-white/80 text-[11px]">Liquid Emergency Savings (Instant withdrawal)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary-container mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-white leading-tight">
                        ₹{(wallet.balance * 0.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (30%)
                      </p>
                      <p className="text-white/80 text-[11px]">Federation Group Health &amp; Equipment Shield</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Panel */}
            <div className="w-full lg:w-96 bg-surface-container-lowest text-on-surface rounded-2xl p-6 shadow-xl flex flex-col gap-4 shrink-0 border border-surface-container-high">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">
                  Available to Cash Out
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label-caps text-xs font-bold">
                  Zero Transfer Fee
                </span>
              </div>

              <div>
                <div className="text-3xl font-black font-metric-val text-on-surface leading-tight tracking-tight">
                  ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">account_balance</span>
                  Direct RTGS / UPI to Verified Bank Account
                </p>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2.5 text-xs">
                <Clock size={18} className="text-primary shrink-0" />
                <span className="text-on-surface">
                  Disbursal guaranteed within <strong>2 hours</strong> by Cooperative Board quorum.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleWithdrawalRequest}
                  className="w-full bg-primary hover:bg-primary-container text-white font-label-lg font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  Request Emergency Cash Out
                </button>
                <p className="text-center font-label-caps text-[10px] text-on-surface-variant">
                  Regulated under MSCS Act 2002 • Bylaw Sec. 14A
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2-Column Split: Physical Cooperative ID Badge & Compliance ──── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Tactile Physical Credential (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                Physical Trade Credential
              </h3>
              <span className="font-label-caps text-xs text-primary uppercase font-bold tracking-wider flex items-center gap-1 bg-primary/10 px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">nfc</span> NFC Tap Enabled
              </span>
            </div>

            <div className="max-w-md w-full">
              <WorkerIdCard
                name={workerUser.name}
                trade={profile?.primary_service || 'Master Artisan'}
                society="Noida Artisans & Electricians Co-op"
                memberId={`SHR-2026-${workerUser.id.toString().padStart(4, '0')}`}
                rating={stats.rating || 5.0}
                jobs={stats.total_jobs || 0}
                area={profile?.city || workerUser.address || 'Noida Sector 62'}
                status={verificationStatus}
              />
            </div>

            {/* Quick Actions for Credential */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
              <button
                onClick={() => setQrModalOpen(true)}
                className="text-primary hover:underline font-bold flex items-center gap-1.5"
                type="button"
              >
                <Share2 size={14} /> Share QR with Customer
              </button>
              <button
                onClick={() => window.print()}
                className="hover:text-on-surface font-semibold flex items-center gap-1.5"
                type="button"
              >
                <Printer size={14} /> Print Physical Card
              </button>
            </div>

            {/* Skills & Qualifications Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <Award size={16} className="text-primary" />
                  Skills &amp; Qualifications
                </h4>
                <button
                  onClick={() => setVerificationModal({ isOpen: true })}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Edit
                </button>
              </div>

              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-surface-container-high bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-on-surface"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No skills listed yet.</p>
              )}

              <div className="border-t border-surface-container-high pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Field Experience:</span>
                  <span className="font-bold text-on-surface">{profile?.experience_years || 5}+ years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">State Certification:</span>
                  <span className="font-bold text-on-surface truncate max-w-[200px]" title={profile?.certifications || 'ITI Diploma'}>
                    {profile?.certifications || 'ITI Wireman / Electrical Diploma'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Service Radius:</span>
                  <span className="font-bold text-on-surface">{profile?.service_radius_km || 10} km (NCR)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cooperative Compliance & Skill Badges (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                Cooperative Compliance &amp; Skill Badges
              </h3>
              <span className="font-label-md text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {verificationStatus === 'verified' ? '100% Federation Compliant' : 'Review in Progress'}
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-5">
              <div className="flex items-start gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-sm font-bold text-on-surface">
                    Cooperative Membership Verification
                  </span>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Aadhaar (UIDAI Offline e-KYC), ITI State Technical Certification, and Police Background Verification
                    approved by Federation District Governance Board.
                  </p>
                </div>
              </div>

              {/* Document List Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                        Govt Identity
                      </span>
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <p className="font-label-md text-xs font-bold text-on-surface">Aadhaar e-KYC</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">UID: •••• •••• 8819</p>
                  </div>
                  <button
                    onClick={() => setVerificationModal({ isOpen: true })}
                    className="text-left font-label-caps text-[11px] text-primary font-bold hover:underline mt-3"
                    type="button"
                  >
                    View Document
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                        Trade License
                      </span>
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <p className="font-label-md text-xs font-bold text-on-surface">ITI Trade Diploma</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Govt ITI Meerut / NCR</p>
                  </div>
                  <button
                    onClick={() => setVerificationModal({ isOpen: true })}
                    className="text-left font-label-caps text-[11px] text-primary font-bold hover:underline mt-3"
                    type="button"
                  >
                    View Certificate
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">
                        Annual Safety
                      </span>
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <p className="font-label-md text-xs font-bold text-on-surface">Safety Certified</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Valid till Dec 2026</p>
                  </div>
                  <button
                    onClick={() => setVerificationModal({ isOpen: true })}
                    className="text-left font-label-caps text-[11px] text-primary font-bold hover:underline mt-3"
                    type="button"
                  >
                    Renew / Re-test
                  </button>
                </div>
              </div>

              {/* Upload Drag & Drop Trigger Banner */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                    <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                  </div>
                  <div>
                    <p className="font-label-md text-xs font-bold text-on-surface">Have additional technical certifications?</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Upload Solar Inverter, EV Charger or Smart Home installer credentials for premium badge dispatch.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationModal({ isOpen: true })}
                  className="px-4 py-2 bg-on-surface text-surface rounded-xl text-xs font-bold hover:bg-inverse-surface transition-colors shrink-0 shadow-sm"
                  type="button"
                >
                  Upload PDF / JPG
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent Job Dispatches & Instant Ledger Table ────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
                <Briefcase size={20} className="text-primary" />
                Live Job Dispatches &amp; Instant Ledger
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Direct bank settlements governed by Cooperative Fair-Split Bylaw #3. Zero hidden algorithmic penalties.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {bookings.length} {bookings.length === 1 ? 'Dispatch' : 'Dispatches'}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center">
                  <Briefcase size={28} />
                </div>
                <p className="font-bold text-base text-on-surface">No Active Booking Requests</p>
                <p className="max-w-md text-xs text-on-surface-variant">
                  When residents in your service radius book {profile?.primary_service || 'your trade'}, new dispatches will arrive here in real-time. Keep your availability switched online.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase tracking-wider border-b border-surface-container-high">
                      <th className="py-3 px-4 font-bold">Job &amp; Customer</th>
                      <th className="py-3 px-4 font-bold">Schedule &amp; Address</th>
                      <th className="py-3 px-4 font-bold">Gross Rupee Fee</th>
                      <th className="py-3 px-4 font-bold">Fair Split Breakdown</th>
                      <th className="py-3 px-4 font-bold">Dispatch Status</th>
                      <th className="py-3 px-4 text-right font-bold">Job Actions &amp; Tax Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {bookings.map((b) => {
                      const isActing = jobActionLoadingId === b.id
                      const amount = b.amount || 500
                      const netPayout = Math.round(amount * 0.85)
                      const welfareAmount = Math.round(amount * 0.10)
                      const adminFee = amount - netPayout - welfareAmount

                      return (
                        <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                          {/* Col 1: Job & Customer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {b.customer_name ? b.customer_name.substring(0, 2).toUpperCase() : 'CU'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                                  {b.service_name}
                                  {b.is_emergency && (
                                    <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.2 text-[10px] font-extrabold uppercase">
                                      Urgent
                                    </span>
                                  )}
                                </span>
                                <span className="text-on-surface-variant text-xs mt-0.5">
                                  {b.customer_name || 'Resident'} {b.customer_phone ? `• ${b.customer_phone}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Schedule & Address */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col text-xs">
                              <span className="font-semibold text-on-surface flex items-center gap-1">
                                <Clock size={12} className="text-primary" />
                                {b.scheduled_date ? `${b.scheduled_date} ${b.scheduled_time || ''}` : 'Immediate Dispatch'}
                              </span>
                              <span className="text-on-surface-variant text-[11px] mt-0.5 max-w-[200px] truncate" title={b.address}>
                                <MapPin size={11} className="inline mr-0.5 text-secondary" />
                                {b.address || 'Noida & NCR'}
                              </span>
                            </div>
                          </td>

                          {/* Col 3: Gross Fee */}
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-extrabold text-on-surface">
                              ₹{amount.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Col 4: Fair Split Breakdown */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 w-44">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-primary">₹{netPayout} (85% Net)</span>
                                <span className="text-secondary">₹{welfareAmount} (10% Trust)</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-surface-container-high flex overflow-hidden">
                                <div className="bg-primary h-full w-[85%]" title="85% Worker Payout" />
                                <div className="bg-secondary-container h-full w-[10%]" title="10% Welfare Trust" />
                                <div className="bg-outline-variant h-full w-[5%]" title="5% Co-op Admin" />
                              </div>
                              <span className="text-[9px] text-on-surface-variant">₹{adminFee} (5% Co-op Admin)</span>
                            </div>
                          </td>

                          {/* Col 5: Dispatch Status */}
                          <td className="py-4 px-4">
                            <BookingStatusBadge status={b.status} />
                          </td>

                          {/* Col 6: Actions & Invoice */}
                          <td className="py-4 px-4 text-right">
                            {isActing ? (
                              <Loader2 size={18} className="animate-spin text-primary inline-block" />
                            ) : (
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {/* Action Buttons depending on status */}
                                {(b.status === 'pending' || b.status === 'requested' || b.status === 'worker_assigned') && (
                                  <>
                                    <button
                                      onClick={() => handleJobAction(b.id, 'accept')}
                                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-container transition shadow-sm"
                                    >
                                      Accept Dispatch
                                    </button>
                                    <button
                                      onClick={() => handleJobAction(b.id, 'decline')}
                                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}

                                {b.status === 'accepted' && (
                                  <button
                                    onClick={async () => {
                                      setJobActionLoadingId(b.id)
                                      try {
                                        await updateBookingStatus(b.id, 'on_the_way')
                                        loadDashboard(false)
                                      } finally {
                                        setJobActionLoadingId(null)
                                      }
                                    }}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm flex items-center gap-1"
                                  >
                                    <span>On The Way</span> 🚗
                                  </button>
                                )}

                                {b.status === 'on_the_way' && (
                                  <button
                                    onClick={async () => {
                                      setJobActionLoadingId(b.id)
                                      try {
                                        await updateBookingStatus(b.id, 'arrived')
                                        loadDashboard(false)
                                      } finally {
                                        setJobActionLoadingId(null)
                                      }
                                    }}
                                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm flex items-center gap-1"
                                  >
                                    <span>Mark Arrived</span> 📍
                                  </button>
                                )}

                                {b.status === 'arrived' && (
                                  <button
                                    onClick={() => handleJobAction(b.id, 'start')}
                                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm flex items-center gap-1"
                                  >
                                    <span>Start Work</span> ⚡
                                  </button>
                                )}

                                {b.status === 'in_progress' && (
                                  <button
                                    onClick={() => handleJobAction(b.id, 'complete')}
                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-container transition shadow-sm flex items-center gap-1"
                                  >
                                    <span>Complete Job</span> ✅
                                  </button>
                                )}

                                {(b.status === 'completed' || b.status === 'confirmed') && (
                                  <button
                                    onClick={() => setSelectedInvoiceBooking(b)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors inline-flex items-center gap-1 text-xs font-bold border border-surface-container-high"
                                    title="View & Print Official Tax Invoice"
                                  >
                                    <Receipt size={14} />
                                    <span>Invoice</span>
                                  </button>
                                )}

                                {['cancelled', 'rejected'].includes(b.status) && (
                                  <span className="text-xs text-on-surface-variant italic">Closed</span>
                                )}
                              </div>
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
        </section>

      </div>

      {/* ── Verification Modal ─────────────────────────────────────────── */}
      <VerificationModal
        isOpen={verificationModal.isOpen}
        onClose={() => setVerificationModal({ isOpen: false })}
        profile={profile}
        onSuccess={() => loadDashboard(false)}
      />

      {/* ── Invoice Modal ──────────────────────────────────────────────── */}
      {selectedInvoiceBooking && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedInvoiceBooking(null)}
          booking={selectedInvoiceBooking}
        />
      )}

      {/* ── QR Code Share Modal ────────────────────────────────────────── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container-high text-center space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-surface-container-high">
              <span className="font-bold text-sm text-on-surface">Artisan Digital QR Badge</span>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-inner inline-block border border-surface-container-high">
              <svg className="w-48 h-48 text-on-surface fill-current mx-auto" viewBox="0 0 24 24">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 10h8v8H2v-8zm2 2v4h4v-4H4zm10-14h8v8h-8V2zm2 2v4h4V4h-4zm-1 9h2v2h-2v-2zm3-1h2v3h-2v-3zm-3 4h3v2h-3v-2zm5 1h2v4h-2v-4zm-2 2h2v2h-2v-2zm-3-3h2v2h-2v-2zm8-2h-2v-2h2v2zm-3-5h2v2h-2v-2zM5 5h2v2H5V5zm0 12h2v2H5v-2zm12-12h2v2h-2V5z" />
              </svg>
            </div>

            <div>
              <p className="font-bold text-sm text-on-surface">{workerUser.name}</p>
              <p className="text-xs text-on-surface-variant">
                Credential ID: FED-DEL-{workerUser.id.toString().padStart(4, '0')}-ELEC
              </p>
              <p className="text-[11px] text-primary font-bold mt-1">
                Scan to verify government cooperative membership &amp; active insurance shield.
              </p>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full btn btn-primary py-2.5 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
