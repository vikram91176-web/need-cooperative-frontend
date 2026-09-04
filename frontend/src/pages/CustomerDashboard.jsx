/**
 * CustomerDashboard.jsx — Stitch Customer Account & Service Activity Dashboard.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Receipt,
  Search,
  Star,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cancelBooking, getCustomerDashboard } from '../services/api'
import BookingModal from '../components/BookingModal'
import PaymentModal from '../components/PaymentModal'
import InvoiceModal from '../components/InvoiceModal'
import ReviewModal from '../components/ReviewModal'
import DisputeModal from '../components/DisputeModal'
import BookingLifecycleStepper from '../components/BookingLifecycleStepper'
import { getServiceImage } from '../utils/serviceImages'

const STATUS_STYLES = {
  pending:     'bg-secondary-container/20 text-secondary border-secondary/40 font-bold',
  accepted:    'bg-primary-fixed/50 text-on-primary-fixed font-bold border-primary/30',
  in_progress: 'bg-primary text-on-primary font-bold shadow-xs',
  completed:   'bg-primary-fixed/40 text-primary font-bold border-primary/20',
  cancelled:   'bg-surface-container text-on-surface-variant font-medium border-outline-variant',
  rejected:    'bg-error-container text-on-error-container font-medium border-error/20',
}

const STATUS_LABELS = {
  pending:     'Pending Dispatch',
  accepted:    'Artisan Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  rejected:    'Declined',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-surface-container text-on-surface-variant'
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${style}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  // Filters & Tabs
  const [activeFilterTab, setActiveFilterTab] = useState('all') // 'all' | 'active' | 'completed' | 'cancelled'
  const [searchFilter, setSearchFilter]       = useState('')

  // Modals state
  const [bookingModal, setBookingModal] = useState({ isOpen: false, service: null, worker: null })
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, booking: null })
  const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, invoiceId: null })
  const [reviewModal, setReviewModal]   = useState({ isOpen: false, booking: null })
  const [disputeModal, setDisputeModal] = useState({ isOpen: false, booking: null })

  function loadDashboard() {
    setLoading(true)
    setError('')
    getCustomerDashboard()
      .then(setData)
      .catch((err) => {
        setError(err?.response?.data?.error || 'Could not load your activity dashboard.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleCancel(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this cooperative service request?')) {
      return
    }
    setCancellingId(bookingId)
    try {
      await cancelBooking(bookingId)
      loadDashboard()
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  const allBookings = data?.recent_bookings || []

  // Active in-flight booking (if any)
  const inFlightBooking = useMemo(() => {
    return allBookings.find((b) => ['accepted', 'in_progress'].includes(b.status)) || null
  }, [allBookings])

  // Filtered list
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      let matchesTab = true
      if (activeFilterTab === 'active') {
        matchesTab = ['pending', 'accepted', 'in_progress'].includes(b.status)
      } else if (activeFilterTab === 'completed') {
        matchesTab = b.status === 'completed'
      } else if (activeFilterTab === 'cancelled') {
        matchesTab = ['cancelled', 'rejected'].includes(b.status)
      }

      const q = searchFilter.toLowerCase()
      const matchesSearch =
        !q ||
        (b.service_name && b.service_name.toLowerCase().includes(q)) ||
        (b.worker_name && b.worker_name.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        String(b.id).includes(q)

      return matchesTab && matchesSearch
    })
  }, [allBookings, activeFilterTab, searchFilter])

  // Calculate welfare contribution total
  const completedCount = allBookings.filter((b) => b.status === 'completed').length
  const totalWelfareEstimated = Math.round(
    allBookings
      .filter((b) => b.status === 'completed' || b.is_paid)
      .reduce((sum, b) => sum + (b.amount || 299) * 0.1, 0),
  )

  return (
    <div className="w-full bg-surface pb-16">
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        {/* ── 1. Top Greeting Banner ──────────────────────────────────── */}
        <div className="relative bg-surface-container-lowest rounded-2xl shadow-sm p-6 sm:p-8 overflow-hidden border border-outline-variant/50">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-primary-container text-on-primary-container font-label-caps text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                  Democratic Member Resident
                </span>
                <span className="flex items-center gap-1 font-label-md text-xs text-primary font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  Live Sync • Noida Hub
                </span>
              </div>
              <h1 className="font-headline-xl text-2xl sm:text-3xl text-on-surface font-extrabold">
                Namaste, {user?.name || 'Ananya'}! 🌿
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-medium">
                <span className="flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                  {user?.address || 'B-Block, Sector 62, Noida (NCR)'}
                </span>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  RWA Verified Household #{user?.id || '402'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/services"
                className="btn btn-primary text-xs font-bold px-5 py-2.5 shadow-sm uppercase tracking-wider flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">engineering</span>
                <span>Book Verified Artisan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Metric KPI Cards (Stitch 4-Card Mosaic) ──────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Completed Bookings */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <span className="bg-primary/10 text-primary font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold">
                100% Fair-Split
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl text-on-surface font-extrabold">
                {completedCount} Completed
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant font-medium">
                Total Cooperative Bookings
              </div>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 2: Welfare Contributed */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/40 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">medical_services</span>
              </div>
              <span className="bg-secondary-fixed text-on-secondary-fixed-variant font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold">
                Social Security
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl text-primary font-extrabold">
                ₹{totalWelfareEstimated || 480}
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant font-medium">
                Worker Welfare Contributed
              </div>
            </div>
            <div className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-primary">shield</span>
              Emergency Health &amp; Safety Reserve
            </div>
          </div>

          {/* Card 3: In-Flight Status */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/50 flex flex-col justify-between space-y-3 ring-1 ring-primary/20">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </div>
              <span className="bg-primary-container text-on-primary-container font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                Live State
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl text-primary font-extrabold">
                {inFlightBooking ? '1 Active' : '0 Active'}
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant font-medium">
                {inFlightBooking ? `${inFlightBooking.service_name} In Transit` : 'No active dispatches'}
              </div>
            </div>
            <div className="text-[11px] text-primary font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {inFlightBooking ? 'Arriving in ~15–25 mins' : 'Instant booking ready'}
            </div>
          </div>

          {/* Card 4: Citizen Trust */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                <Star size={18} className="fill-secondary text-secondary" />
              </div>
              <span className="bg-surface-container text-on-surface-variant font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold">
                Neighbor Trust
              </span>
            </div>
            <div>
              <div className="font-metric-val text-2xl text-on-surface font-extrabold">
                4.9 ★
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant font-medium">
                Average Rating Given
              </div>
            </div>
            <div className="text-[11px] text-on-surface-variant font-medium">
              Verified review certificates recorded
            </div>
          </div>
        </div>

        {/* ── 3. Live Active Booking Card (if in flight) ────────────────── */}
        {inFlightBooking && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden border border-primary/30 relative animate-fade-in">
            {/* Dark ID Header Strip */}
            <div className="bg-inverse-surface text-inverse-on-surface px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
                <span className="font-label-caps text-secondary-fixed text-[11px] uppercase tracking-wider font-bold">
                  In-Flight Dispatch • Cooperative Ticket #{inFlightBooking.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-variant">
                <span>Artisan: <strong className="text-primary-fixed">{inFlightBooking.worker_name}</strong></span>
                <span className="text-outline">|</span>
                <span>Noida Ward 4 Unit</span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Worker Info */}
              <div className="lg:col-span-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-primary text-xl shadow-sm shrink-0">
                  {inFlightBooking.worker_name ? inFlightBooking.worker_name.split(' ').map(n=>n[0]).join('') : 'W'}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-headline-sm text-base text-on-surface font-bold truncate">
                      {inFlightBooking.worker_name}
                    </h3>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ITI Cert.
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium truncate">
                    {inFlightBooking.service_name} • Sector 62 Guild
                  </p>
                  <div className="flex items-center gap-1 text-xs text-secondary font-bold">
                    <Star size={13} className="fill-secondary text-secondary" /> 4.95 Rating
                  </div>
                </div>
              </div>

              {/* Status & Stepper */}
              <div className="lg:col-span-8 space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getServiceImage(inFlightBooking.service_name)}
                      alt={inFlightBooking.service_name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-outline-variant/50 shadow-xs"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-label-caps text-[10px] text-primary uppercase font-bold">Service In Transit</span>
                      <h4 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                        {inFlightBooking.service_name}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">Fixed Tariff</span>
                    <div className="font-metric-val text-base text-primary font-bold">
                      ₹{inFlightBooking.amount || 299}
                    </div>
                  </div>
                </div>

                <BookingLifecycleStepper status={inFlightBooking.status} />

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 text-xs">
                  <div className="text-on-surface-variant text-[11px]">
                    Fair-Split: <strong className="text-primary">85% to Worker</strong> • <strong className="text-secondary">10% to Welfare Reserve</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    {inFlightBooking.status === 'completed' && !inFlightBooking.is_paid && (
                      <button
                        onClick={() => setPaymentModal({ isOpen: true, booking: inFlightBooking })}
                        className="btn btn-primary text-xs py-1.5 px-3 font-bold"
                      >
                        Pay ₹{inFlightBooking.amount}
                      </button>
                    )}
                    {['pending', 'accepted'].includes(inFlightBooking.status) && (
                      <button
                        onClick={() => handleCancel(inFlightBooking.id)}
                        disabled={cancellingId === inFlightBooking.id}
                        className="btn btn-outline text-error text-xs py-1 px-2.5"
                      >
                        {cancellingId === inFlightBooking.id ? 'Cancelling…' : 'Cancel Request'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Booking History & Controls ───────────────────────────── */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/50 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">
                Audited Service History
              </span>
              <h2 className="font-headline-sm text-xl text-on-surface font-extrabold mt-0.5">
                Your Service Bookings &amp; Invoices
              </h2>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/40 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeFilterTab === 'all'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({allBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeFilterTab === 'active'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('completed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeFilterTab === 'completed'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('cancelled')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeFilterTab === 'cancelled'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* Search in Bookings */}
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search booking..."
                  className="pl-8 pr-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-medium text-on-surface placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-outline" />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-16 text-center space-y-2">
              <Loader2 size={32} className="animate-spin text-primary mx-auto" />
              <p className="text-xs text-on-surface-variant">Loading service history…</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface-container-low/50 border border-outline-variant/40 space-y-2">
              <p className="font-bold text-sm text-on-surface">No bookings found in this view</p>
              <p className="text-xs text-on-surface-variant">Book a certified cooperative artisan to schedule home repairs.</p>
              <Link to="/services" className="btn btn-primary text-xs mt-2 inline-block">
                Browse Services →
              </Link>
            </div>
          ) : (
            <div className="border border-outline-variant/50 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase border-b border-outline-variant/50 text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Booking / Service</th>
                      <th className="px-4 py-3">Assigned Artisan</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3 text-right">Fee</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                    {filteredBookings.map((b) => {
                      const canCancel = ['pending', 'accepted'].includes(b.status)
                      const canPay = b.status === 'completed' && !b.is_paid
                      const canInvoice = Boolean(b.is_paid && b.invoice_id)
                      const canReview = b.status === 'completed' && !b.review
                      const hasReview = Boolean(b.review)

                      return (
                        <tr key={b.id} className="hover:bg-surface-container-low/60 transition">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getServiceImage(b.service_name)}
                                alt={b.service_name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-outline-variant/50 shadow-xs"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                                }}
                              />
                              <div>
                                <span className="font-bold text-on-surface block">{b.service_name}</span>
                                <span className="font-mono text-[10px] text-on-surface-variant">ID: #{b.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {b.worker_name ? (
                              <div>
                                <span className="font-semibold text-on-surface block">{b.worker_name}</span>
                                <span className="text-[10px] text-primary font-medium">Verified Guild Member</span>
                              </div>
                            ) : (
                              <span className="text-on-surface-variant italic">Rotating Dispatch</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-on-surface-variant font-medium">
                            <div>{b.scheduled_date}</div>
                            <div className="text-[10px] text-outline">{b.scheduled_time}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-on-surface">
                            ₹{b.amount || 299}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(b.id)}
                                  disabled={cancellingId === b.id}
                                  className="btn btn-outline text-error text-[11px] py-1 px-2.5 font-bold"
                                >
                                  {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                                </button>
                              )}

                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentModal({ isOpen: true, booking: b })}
                                  className="btn btn-primary text-[11px] py-1 px-2.5 font-bold flex items-center gap-1 shadow-xs"
                                >
                                  <CreditCard size={12} />
                                  Pay Now
                                </button>
                              )}

                              {canInvoice && (
                                <button
                                  type="button"
                                  onClick={() => setInvoiceModal({ isOpen: true, invoiceId: b.invoice_id })}
                                  className="btn btn-outline text-[11px] py-1 px-2.5 font-semibold flex items-center gap-1"
                                >
                                  <Receipt size={12} />
                                  Invoice
                                </button>
                              )}

                              {canReview && (
                                <button
                                  type="button"
                                  onClick={() => setReviewModal({ isOpen: true, booking: b })}
                                  className="rounded-lg border border-secondary/40 bg-secondary-fixed/40 px-2 py-1 text-[11px] font-bold text-on-secondary-fixed flex items-center gap-1 hover:bg-secondary-fixed transition"
                                >
                                  <Star size={11} className="fill-secondary text-secondary" />
                                  Rate
                                </button>
                              )}

                              {b.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => setDisputeModal({ isOpen: true, booking: b })}
                                  className="text-[11px] text-on-surface-variant hover:text-error transition font-medium px-1"
                                  title="Raise Dispute"
                                >
                                  Dispute
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── 5. Quick Rebooking Services Grid ────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">
                Instant Roster
              </span>
              <h3 className="font-headline-sm text-lg text-on-surface font-extrabold">
                1-Click Cooperative Rebooking
              </h3>
            </div>
            <Link to="/services" className="text-xs font-bold text-primary hover:underline">
              View All 20+ →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 1, name: 'Electrician', price: 299, icon: 'bolt' },
              { id: 2, name: 'Plumber', price: 249, icon: 'faucet' },
              { id: 3, name: 'AC Service', price: 599, icon: 'mode_fan' },
              { id: 4, name: 'Carpenter', price: 349, icon: 'carpenter' },
              { id: 5, name: 'Home Painter', price: 1499, icon: 'format_paint' },
              { id: 6, name: 'Home Cleaner', price: 499, icon: 'cleaning_services' },
            ].map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setBookingModal({ isOpen: true, service: { id: svc.id, name: svc.name, starting_price: svc.price } })}
                className="bg-surface-container-lowest rounded-xl p-3.5 border border-outline-variant/50 shadow-xs hover:shadow-md hover:border-primary transition text-left group flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-on-primary transition">
                  <span className="material-symbols-outlined text-[18px]">{svc.icon}</span>
                </div>
                <div>
                  <span className="font-bold text-xs text-on-surface block truncate">{svc.name}</span>
                  <span className="font-mono text-[11px] text-primary font-bold">from ₹{svc.price}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      {bookingModal.isOpen && (
        <BookingModal
          isOpen={bookingModal.isOpen}
          onClose={() => setBookingModal({ isOpen: false, service: null, worker: null })}
          service={bookingModal.service}
          worker={bookingModal.worker}
          onSuccess={loadDashboard}
        />
      )}

      {paymentModal.isOpen && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, booking: null })}
          booking={paymentModal.booking}
          onSuccess={loadDashboard}
        />
      )}

      {invoiceModal.isOpen && (
        <InvoiceModal
          isOpen={invoiceModal.isOpen}
          onClose={() => setInvoiceModal({ isOpen: false, invoiceId: null })}
          invoiceId={invoiceModal.invoiceId}
        />
      )}

      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ isOpen: false, booking: null })}
          booking={reviewModal.booking}
          onSuccess={loadDashboard}
        />
      )}

      {disputeModal.isOpen && (
        <DisputeModal
          isOpen={disputeModal.isOpen}
          onClose={() => setDisputeModal({ isOpen: false, booking: null })}
          booking={disputeModal.booking}
          onDisputeCreated={loadDashboard}
        />
      )}
    </div>
  )
}
