/**
 * InvoiceModal.jsx — Stitch Cooperative Tax Invoice & Itemized Receipt.
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react'
import { getInvoice } from '../services/api'

export default function InvoiceModal({
  isOpen,
  onClose,
  invoiceId,
}) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (isOpen && invoiceId) {
      setLoading(true)
      setError('')
      getInvoice(invoiceId)
        .then(setData)
        .catch(err => {
          setError(err?.response?.data?.error || 'Could not load invoice details.')
        })
        .finally(() => setLoading(false))
    } else if (isOpen) {
      setLoading(false)
      setError('This booking does not have an invoice yet.')
    }
  }, [isOpen, invoiceId])

  if (!isOpen) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0">
      <div
        className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 z-10 my-8 animate-fade-in print:max-h-none print:shadow-none print:border-none print:m-0">
        {/* Tactile Header Strip */}
        <div className="bg-inverse-surface text-inverse-on-surface px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">receipt_long</span>
            <span className="font-label-caps text-[11px] tracking-wider text-secondary-fixed uppercase font-bold">
              Official Federation Tax Invoice
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close invoice"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-on-surface-variant font-medium">Retrieving verified invoice…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle size={36} className="text-error mx-auto" />
            <p className="text-sm text-on-surface font-semibold">{error}</p>
            <button onClick={onClose} className="btn btn-outline text-xs">
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6 text-on-surface max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
            {/* Top Federation Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/50 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">diversity_3</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-lg text-primary font-black tracking-tight leading-none">
                      NEED
                    </span>
                    <span className="font-label-caps text-[10px] text-secondary font-bold uppercase block tracking-wider mt-0.5">
                      Worker-Owned Federation
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Shramik Kalyan Sahakari Samiti Ltd.<br />
                  Reg. #COOP-UP-2022-1082 • Multi-State Act, 2002<br />
                  Sector 62, Noida, Gautam Buddha Nagar, UP
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed px-2.5 py-0.5 text-[11px] font-bold">
                  <ShieldCheck size={12} className="text-primary" />
                  Statutory Receipt
                </div>
                <h3 className="font-mono text-base font-bold text-on-surface mt-1.5">
                  {data?.invoice_number || invoiceId}
                </h3>
                <p className="font-mono text-xs text-on-surface-variant">
                  Date: {data?.paid_at ? new Date(data.paid_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Bill To / Service Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4 text-xs border border-outline-variant/40">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  Citizen Resident
                </span>
                <p className="font-bold text-on-surface">{data?.customer_name || 'Resident Customer'}</p>
                <p className="text-on-surface-variant mt-0.5">{data?.customer_address || 'Noida Sector 62'}</p>
              </div>

              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  Assigned Guild Worker
                </span>
                <p className="font-bold text-primary">{data?.worker_name || 'Cooperative Worker'}</p>
                <p className="text-on-surface-variant mt-0.5 font-mono">
                  Member ID: {data?.worker_member_id || 'ND-ELE-8812'}
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-outline-variant/50 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-caps uppercase border-b border-outline-variant/50 text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-center">Share Type</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-bold text-on-surface">{data?.service_name || 'Home Service'}</p>
                      <p className="text-[11px] text-on-surface-variant">Standard skilled trade execution</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-[10px]">
                        90% Direct
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      ₹{data?.worker_earnings || Math.round((data?.amount || 299) * 0.9)}
                    </td>
                  </tr>

                  <tr className="bg-secondary-fixed/15">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-on-surface">Worker Welfare Fund Allocation</p>
                      <p className="text-[10px] text-secondary font-medium">Health cover, safety tools &amp; reserve wallet</p>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="bg-secondary-container/20 text-secondary px-2 py-0.5 rounded font-bold text-[10px]">
                        10% Welfare
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-secondary">
                      ₹{data?.welfare_amount || Math.round((data?.amount || 299) * 0.1)}
                    </td>
                  </tr>

                  {Number(data?.tip_amount || 0) > 0 && (
                    <tr>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-on-surface">Direct Citizen Tip</p>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-[10px]">
                          100% Worker
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-primary">
                        ₹{data?.tip_amount}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-surface-container-low font-bold border-t border-outline-variant/50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-xs">
                      Grand Total Paid:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base text-primary">
                      ₹{data?.total_amount || data?.amount || 299}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/40 print:hidden">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <CheckCircle2 size={14} className="text-primary" />
                <span>Simulated zero-surge cooperative payment verified.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-outline text-xs flex items-center gap-1.5 font-bold"
                >
                  <Printer size={14} />
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary text-xs font-bold"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
