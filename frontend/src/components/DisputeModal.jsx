/**
 * DisputeModal.jsx — Stitch Tripartite Cooperative Dispute Tribunal Modal.
 */

import { useState } from 'react'
import { AlertTriangle, Loader2, ShieldAlert, X } from 'lucide-react'
import { createDispute } from '../services/api'

export default function DisputeModal({ isOpen, onClose, booking, onDisputeCreated }) {
  const [category, setCategory]       = useState('Quality Dispute')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  if (!isOpen || !booking) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please provide a description of the issue.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await createDispute({
        booking_id: booking.id,
        category,
        description: description.trim(),
        evidence_url: evidenceUrl.trim(),
      })

      if (onDisputeCreated) {
        onDisputeCreated(res.dispute)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 z-10 my-8 animate-fade-in">
        {/* Tactile Header Strip */}
        <div className="bg-inverse-surface text-inverse-on-surface px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">gavel</span>
            <span className="font-label-caps text-[11px] tracking-wider text-secondary-fixed uppercase font-bold">
              Tripartite Arbitration Tribunal
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-start gap-3 pb-3 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                File Grievance / Service Dispute
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                Booking #{booking.id} • {booking.service_name}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2 font-medium">
              <AlertTriangle size={16} className="text-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Dispute Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Quality Dispute">Quality Dispute (Unsatisfactory Craft)</option>
                <option value="Payment Issue">Payment &amp; Tariff Discrepancy</option>
                <option value="Late Arrival">Unpunctuality / Delay &gt; 30 mins</option>
                <option value="Conduct Issue">Unprofessional Conduct</option>
                <option value="Damage Claim">Property Damage Claim</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Detailed Grievance Statement *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue accurately so the Cooperative Council and Federation Desk can arbitrate fairly..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Evidence Photo or Document URL (Optional)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example.com/photo-evidence.jpg"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="p-3 rounded-xl bg-secondary-fixed/30 border border-secondary-container/40 text-[11px] text-on-secondary-fixed-variant leading-relaxed">
              <strong>Statutory Co-op Guarantee:</strong> Under Section 24 of the Multi-State Co-op Charter, disputes are heard within 24 hours with an elected union coordinator and neutral federation officer to protect both resident and artisan rights.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary text-xs font-bold shadow-sm"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit for Arbitration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
