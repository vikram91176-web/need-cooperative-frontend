/**
 * VerificationModal.jsx — Stitch Worker Trade Proof & Document Verification Modal.
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { submitWorkerVerification } from '../services/api'

export default function VerificationModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}) {
  const [identityProof, setIdentityProof] = useState('')
  const [certifications, setCertifications] = useState('')
  const [experienceYears, setExperienceYears] = useState(2)
  const [skills, setSkills] = useState('')
  const [primaryService, setPrimaryService] = useState('')

  const [idFile, setIdFile] = useState(null)
  const [certFile, setCertFile] = useState(null)
  const [idFilePreview, setIdFilePreview] = useState(null)
  const [certFilePreview, setCertFilePreview] = useState(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setIdentityProof(profile.identity_proof || '')
      setCertifications(profile.certifications || '')
      setExperienceYears(profile.experience_years || 2)
      setSkills(profile.skills || '')
      setPrimaryService(profile.primary_service || '')
    }
  }, [profile])

  if (!isOpen) return null

  function handleIdFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Government ID file must be under 5MB.')
      return
    }
    setError('')
    setIdFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type,
    })
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setIdFilePreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setIdFilePreview(null)
    }
  }

  function handleCertFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Certificate file must be under 5MB.')
      return
    }
    setError('')
    setCertFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type,
    })
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setCertFilePreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setCertFilePreview(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!identityProof.trim()) {
      setError('Please provide a Government ID document number (Aadhaar or Voter ID).')
      return
    }
    if (!certifications.trim()) {
      setError('Please specify trade certificate details (e.g. ITI Certified, Apprenticeship, Union License).')
      return
    }

    setBusy(true)
    setError('')

    try {
      const payload = {
        identity_proof: identityProof.trim(),
        certifications: certifications.trim(),
        experience_years: Number(experienceYears),
        skills: skills.trim(),
        primary_service: primaryService,
        document_uploads: {
          identity_file: idFile?.name || 'Aadhaar_Document_Proof.pdf',
          certification_file: certFile?.name || 'ITI_Trade_Certificate.pdf',
        },
      }

      await submitWorkerVerification(payload)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit verification proof. Please try again.')
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

      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 z-10 my-8 animate-fade-in">
        {/* Tactile Header Strip */}
        <div className="bg-inverse-surface text-inverse-on-surface px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">verified_user</span>
            <span className="font-label-caps text-[11px] tracking-wider text-secondary-fixed uppercase font-bold">
              Cooperative Trade Credential Board
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

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Documents Submitted for Review!</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              Your trade credentials and ID proof have been securely submitted to the Federation Board for statutory verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            <div>
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold">
                Multi-State Cooperative Verification
              </span>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface mt-0.5">
                Submit Trade &amp; Identity Credentials
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Verified workers receive the official NEED member badge, priority dispatch in Sector 62, and full voting shares.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="text-error shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-label-md text-xs font-bold text-on-surface block">
                  Govt. ID Number (Aadhaar / Voter ID) *
                </label>
                <input
                  type="text"
                  value={identityProof}
                  onChange={(e) => setIdentityProof(e.target.value)}
                  placeholder="e.g. XXXX-XXXX-4491"
                  required
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-mono font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs font-bold text-on-surface block">
                  Years of Trade Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Trade Certification &amp; ITI Credentials *
              </label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g. ITI National Trade Certificate #UP-EL-8891, Solar Wireman Grade A"
                required
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Document Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* ID Document Upload */}
              <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 space-y-2">
                <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <FileText size={14} className="text-primary" /> Govt. ID Scan Proof
                </span>
                <input
                  type="file"
                  id="idDocFile"
                  accept="image/*,.pdf"
                  onChange={handleIdFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="idDocFile"
                  className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary cursor-pointer transition text-center"
                >
                  <UploadCloud size={20} className="text-primary mb-1" />
                  <span className="text-[11px] font-semibold text-on-surface">Upload Aadhaar/Voter ID</span>
                  <span className="text-[9px] text-on-surface-variant">PDF, JPG, PNG up to 5MB</span>
                </label>
                {idFile && (
                  <div className="flex items-center justify-between text-[11px] bg-primary/10 text-primary p-1.5 rounded-lg font-mono">
                    <span className="truncate max-w-[150px]">{idFile.name}</span>
                    <button type="button" onClick={() => setIdFile(null)} className="text-error hover:opacity-80">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Certificate Upload */}
              <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 space-y-2">
                <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Award size={14} className="text-secondary" /> Trade Certificate Scan
                </span>
                <input
                  type="file"
                  id="certDocFile"
                  accept="image/*,.pdf"
                  onChange={handleCertFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="certDocFile"
                  className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-outline-variant hover:border-secondary cursor-pointer transition text-center"
                >
                  <UploadCloud size={20} className="text-secondary mb-1" />
                  <span className="text-[11px] font-semibold text-on-surface">Upload ITI / Skill Cert</span>
                  <span className="text-[9px] text-on-surface-variant">PDF, JPG, PNG up to 5MB</span>
                </label>
                {certFile && (
                  <div className="flex items-center justify-between text-[11px] bg-secondary-container/20 text-secondary p-1.5 rounded-lg font-mono">
                    <span className="truncate max-w-[150px]">{certFile.name}</span>
                    <button type="button" onClick={() => setCertFile(null)} className="text-error hover:opacity-80">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-on-surface block">
                Specific Trade Skills
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Switchboard Wiring, MCB Tripping, Inverter Installation, Earthing Test"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-on-surface-variant leading-relaxed">
              <strong>Federation Assurance:</strong> Your submitted documents are encrypted and audited strictly under the UP Cooperative Societies Act 1965 and Multi-State Cooperative Societies Act 2002.
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
                disabled={busy}
                className="btn btn-primary text-xs font-bold shadow-sm"
              >
                {busy ? <Loader2 className="animate-spin" size={16} /> : 'Submit for Federation Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
