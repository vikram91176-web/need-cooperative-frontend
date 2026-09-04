/**
 * ReviewModal.jsx — Stitch Interactive Rating & Feedback Modal.
 */

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Star,
  X,
} from 'lucide-react'
import { submitReview } from '../services/api'

const RATING_LABELS = {
  1: '1 Star — Unsatisfactory',
  2: '2 Stars — Needs Improvement',
  3: '3 Stars — Average Service',
  4: '4 Stars — Skilled & Courteous',
  5: '5 Stars — Exemplary Master Artisan! 🌟',
}

export default function ReviewModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) {
  const [rating, setRating]           = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment]         = useState('')

  const [busy, setBusy]               = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  if (!isOpen || !booking) return null

  const activeRating = hoverRating || rating

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      const payload = {
        booking_id: booking.id,
        rating:     rating,
        comment:    comment.trim(),
      }

      await submitReview(payload)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit review. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 z-10 my-8 animate-fade-in">
        {/* Tactile Header */}
        <div className="bg-inverse-surface text-inverse-on-surface px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">reviews</span>
            <span className="font-label-caps text-[11px] tracking-wider text-secondary-fixed uppercase font-bold">
              Citizen Review &amp; Trust Rating
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close review modal"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Review Recorded!</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Your {rating}★ rating has been registered directly onto {booking.worker_name || 'the worker'}'s cooperative federation profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="text-center">
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold">
                {booking.service_name || 'Service Fulfilled'}
              </span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface mt-0.5">
                Rate Artisan {booking.worker_name ? booking.worker_name.split(' ')[0] : 'Member'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Your feedback empowers worker standing within their democratic society.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="text-error shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tactile Star Selector */}
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      size={28}
                      className={
                        star <= activeRating
                          ? 'fill-secondary-container text-secondary-container'
                          : 'text-outline-variant/80'
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="font-label-md text-xs font-bold text-secondary">
                {RATING_LABELS[activeRating] || `${activeRating} Stars`}
              </span>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Public Cooperative Feedback
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (punctuality, clean work, fair quotation, craft skill)..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition shadow-md flex items-center justify-center gap-2 font-label-md text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Recording Rating…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Submit Member Review</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
