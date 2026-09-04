/**
 * SupportPage.jsx — Help & Support Desk page for Customers & Workers.
 * Redesigned using Stitch Cooperative Federation design language.
 *
 * WHAT: Provides FAQ knowledge base, support ticket submission form, and live ticket tracker.
 * WHY:  Ensures transparent dispute arbitration, payment help, and cooperative support.
 * HOW:  Calls getUserTickets() and createSupportTicket() from api.js.
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  HelpCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createSupportTicket, getUserTickets } from '../services/api'
import SectionHeading from '../components/SectionHeading'

const CATEGORIES = [
  'General Inquiry',
  'Payment Issue',
  'Service Dispute',
  'Account & Verification',
  'Welfare Wallet',
  'Safety & Emergency',
]

const FAQS = [
  {
    q: 'How does the 90/10 Cooperative split work?',
    a: 'Unlike private gig apps that keep 25-30% platform profit margin, NEED routes 90% directly to the worker and 10% into the worker’s personal Welfare Wallet (70% liquid emergency pool + 30% insurance reserve).',
  },
  {
    q: 'How do I request an Emergency Cash Withdrawal from my Welfare Wallet?',
    a: 'Verified workers can request emergency cash withdrawals directly from their Worker Dashboard under the Welfare Wallet card. The Cooperative Board reviews and approves requests within 2 hours.',
  },
  {
    q: 'What should I do if a service provider is delayed or cancels?',
    a: 'You can track dispatch status live on your Customer Dashboard. If needed, submit a ticket under "Service Dispute" with your Booking ID for immediate tribunal arbitration.',
  },
  {
    q: 'How long does Member Verification take?',
    a: 'Federation district administrators verify submitted Aadhaar e-KYC and ITI trade certificates within 12-24 hours.',
  },
]

export default function SupportPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0])
  const [subject, setSubject] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [description, setDescription] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    try {
      setLoading(true)
      const data = await getUserTickets()
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load support tickets.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!subject.trim()) {
      setFormError('Please enter a ticket subject.')
      return
    }

    if (!description.trim()) {
      setFormError('Please provide ticket details or description.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        category,
        subject: subject.trim(),
        description: description.trim(),
        booking_id: bookingId ? Number(bookingId) : null,
      }

      const res = await createSupportTicket(payload)
      setFormSuccess(res.message || 'Support inquiry submitted to Cooperative Tribunal!')
      setSubject('')
      setBookingId('')
      setDescription('')
      loadTickets()
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Failed to submit support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-surface-container-low px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-surface-container-high">
        <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <LifeBuoy size={16} />
              <span>NEED FEDERATION ARBITRATION &amp; HELP DESK</span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Civic Dispute Tribunal &amp; Support
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Transparent peer arbitration, payment settlement help, and member grievance resolution governed by the Cooperative Council.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm shrink-0">
            <p className="font-bold text-xs text-primary flex items-center gap-1.5">
              <ShieldCheck size={16} />
              Cooperative Support Guarantee
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Average resolution response: &lt; 2 hours</p>
          </div>
        </div>
      </section>

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Knowledge Base FAQs ────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Knowledge Base"
            title="Frequently Asked Questions"
            description="Clear answers on transparent rupee splits, welfare withdrawals, and booking guarantees."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm space-y-2 hover:border-primary/40 transition-colors"
              >
                <h3 className="font-bold text-on-surface text-sm flex items-start gap-2">
                  <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form & Ticket Tracker Grid ─────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">

          {/* Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                Create Support Ticket
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Submit an inquiry or grievance to the Federation tribunal.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container-high shadow-sm">
              {formSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-700 font-semibold">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Category */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Grievance Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-stitch text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Subject / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Clarification on Invoice for Booking #12"
                    className="input-stitch text-xs"
                  />
                </div>

                {/* Booking ID */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Related Booking ID <span className="text-on-surface-variant font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. 15"
                    className="input-stitch text-xs font-mono"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Detailed Explanation *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide full details of your issue or question..."
                    className="input-stitch text-xs"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      <span>Submit Grievance to Tribunal</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* My Tickets Tracker List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                My Grievance &amp; Inquiry Docket
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Track live status and formal written resolutions from the cooperative council.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-surface-container-high shadow-sm">
              {loading ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-xs">Loading docket...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant px-4">
                  <MessageSquare size={36} className="mx-auto mb-3 text-on-surface-variant/50" />
                  <p className="font-bold text-on-surface text-sm">No Support Inquiries Submitted</p>
                  <p className="text-xs max-w-xs mx-auto mt-1">
                    Use the form to file an inquiry or report a service issue.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-surface-container-high">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-5 space-y-2 hover:bg-surface-container-low/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-on-surface">#{t.id}</span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                            {t.category}
                          </span>
                          {t.booking_id && (
                            <span className="text-[11px] font-mono text-on-surface-variant">
                              Booking #{t.booking_id}
                            </span>
                          )}
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                            t.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                              : t.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-800 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                          }`}
                        >
                          {t.status === 'resolved' && <CheckCircle2 size={12} />}
                          {t.status === 'in_progress' && <Clock size={12} />}
                          {t.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-on-surface text-sm">{t.subject}</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{t.description}</p>

                      {/* Admin Response Box */}
                      {t.admin_response && (
                        <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
                          <div className="font-bold text-primary flex items-center gap-1.5">
                            <ShieldCheck size={15} />
                            Federation Tribunal Resolution:
                          </div>
                          <p className="text-on-surface leading-relaxed">{t.admin_response}</p>
                        </div>
                      )}

                      <div className="text-[11px] text-on-surface-variant pt-1">
                        Submitted on{' '}
                        {new Date(t.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
