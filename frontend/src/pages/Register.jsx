/**
 * Register.jsx — account creation page.
 * Redesigned using Stitch Multi-Role Access Identity Portal reference.
 *
 * WHAT: A two-step registration flow:
 *   Step 1: Choose role — Customer, Artisan Member, or Labour Cooperative Union.
 *   Step 2: Fill in personal details, technical qualifications, and region.
 *
 * WHY:  On NEED, every user enters the cooperative network with full statutory dignity.
 * HOW:  Calls register() from AuthContext which hits POST /api/auth/register.
 *       On success the user is automatically authenticated and redirected to their dashboard.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Home,
  IndianRupee,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  User,
  Wrench,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const DASHBOARD = {
  customer: '/customer',
  worker: '/worker',
  cooperative_admin: '/cooperative',
}

// ---------------------------------------------------------------------------
// Step 1 — Choose role
// ---------------------------------------------------------------------------
function RoleStep({ onChoose }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">
          Create Cooperative Account
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Select how you wish to participate in the NEED worker-owned digital federation.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        {/* Customer */}
        <button
          onClick={() => onChoose('customer')}
          className="flex flex-col items-start gap-3 rounded-2xl border border-surface-container-high bg-surface-container-low p-5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Home size={24} />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Citizen Customer</p>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
              Book certified home services with zero middleman price gouging.
            </p>
          </div>
          <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-auto pt-2">
            Register as Resident →
          </span>
        </button>

        {/* Worker */}
        <button
          onClick={() => onChoose('worker')}
          className="flex flex-col items-start gap-3 rounded-2xl border border-surface-container-high bg-surface-container-low p-5 text-left transition-all hover:border-secondary hover:bg-secondary/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-secondary group"
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
            <Wrench size={24} />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Artisan Partner</p>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
              Retain 85-90% direct earnings, insurance shield &amp; democratic welfare wallet.
            </p>
          </div>
          <span className="text-[11px] font-bold text-secondary flex items-center gap-1 mt-auto pt-2">
            Join as Artisan →
          </span>
        </button>

        {/* Co-op Admin */}
        <button
          onClick={() => onChoose('cooperative_admin')}
          className="flex flex-col items-start gap-3 rounded-2xl border border-surface-container-high bg-surface-container-low p-5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary group"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Building2 size={24} />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Labour Union / Co-op</p>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
              Manage artisan rosters, local dispatch hubs &amp; collective reserve funds.
            </p>
          </div>
          <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-auto pt-2">
            Charter Society Hub →
          </span>
        </button>
      </div>

      <div className="pt-2 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Already hold an authorized federation ID?</span>
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign In Here →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Fill details
// ---------------------------------------------------------------------------
function DetailsStep({ role, onBack, onSubmit, busy, error }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    address: '',
    // Worker extras
    skills: '',
    experience_years: '',
    city: '',
    primary_service: 'Electrician',
    // Cooperative Admin extras
    cooperative_name: '',
    registration_number: '',
    service_categories: '',
    accepted_terms: false,
  })
  const [localError, setLocalError] = useState('')

  const set = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  function validate() {
    if (!form.name.trim()) return 'Legal name is required'
    if (!form.email.trim()) return 'Email address is required'
    if (!form.phone.trim()) return 'Phone number is required'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.password !== form.confirm) return 'Passwords do not match'
    if (!form.accepted_terms) return 'Please accept the Cooperative Bylaws and terms to continue'
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setLocalError(err)
      return
    }
    setLocalError('')
    const { confirm, ...rest } = form
    onSubmit({ ...rest, role })
  }

  const displayError = localError || error

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft size={16} /> Change Membership Role
        </button>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold uppercase">
          {role === 'worker' ? 'Artisan Onboarding' : role === 'cooperative_admin' ? 'Co-op Charter' : 'Citizen Access'}
        </span>
      </div>

      <div>
        <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">
          {role === 'worker'
            ? 'Enrol as Cooperative Artisan Partner'
            : role === 'cooperative_admin'
            ? 'Register Labour Cooperative / Trade Union'
            : 'Create Citizen Account'}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Fill in verified details. Under MSCS Act 2002, your data is owned democratically by the cooperative.
        </p>
      </div>

      {displayError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2 animate-shake">
          <AlertCircle size={16} className="shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Common fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Rahul Verma"
              className="input-stitch text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Mobile Phone (Aadhaar Linked)
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={set('phone')}
              placeholder="98765 43210"
              className="input-stitch text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="rahul@example.com"
            className="input-stitch text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Residential Address or Cluster Sector
          </label>
          <input
            type="text"
            value={form.address}
            onChange={set('address')}
            placeholder="Flat / House No., Sector / Ward, Noida NCR"
            className="input-stitch text-xs"
          />
        </div>

        {/* Worker-only fields */}
        {role === 'worker' && (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">
              Trade &amp; Skill Credentials:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Primary Trade</label>
                <select
                  value={form.primary_service}
                  onChange={set('primary_service')}
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
                <label className="block text-xs font-bold text-on-surface mb-1">Field Experience (Years)</label>
                <input
                  type="number"
                  value={form.experience_years}
                  onChange={set('experience_years')}
                  placeholder="e.g. 5"
                  className="input-stitch text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Skills &amp; Specialties</label>
              <input
                type="text"
                value={form.skills}
                onChange={set('skills')}
                placeholder="e.g. Wiring, MCB Tripping, Chandelier, Inverter Backup"
                className="input-stitch text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Operating City / NCR Hub</label>
              <input
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="Noida & Greater Noida"
                className="input-stitch text-xs"
              />
            </div>
          </div>
        )}

        {/* Cooperative Admin fields */}
        {role === 'cooperative_admin' && (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">
              Cooperative Society Charter:
            </p>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Society / Union Name</label>
              <input
                type="text"
                value={form.cooperative_name}
                onChange={set('cooperative_name')}
                placeholder="e.g. Noida Artisans & Electricians Cooperative"
                className="input-stitch text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Registration Number</label>
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={set('registration_number')}
                  placeholder="e.g. COOP-UP-2022-1082"
                  className="input-stitch text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">City / Operating Ward</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Noida Sector 62 & NCR"
                  className="input-stitch text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Password fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Create Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={set('password')}
              placeholder="Min 6 characters"
              className="input-stitch text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Re-enter password"
              className="input-stitch text-xs"
            />
          </div>
        </div>

        {/* Terms agreement checkbox */}
        <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.accepted_terms}
            onChange={set('accepted_terms')}
            className="mt-0.5 accent-primary h-4 w-4 rounded"
          />
          <span className="text-on-surface-variant leading-tight">
            I agree to the democratic principles, privacy guarantee, and{' '}
            <Link to="/about" className="text-primary font-bold hover:underline">
              Cooperative Federation Charter
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full btn btn-primary py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <span>Complete Registration &amp; Enrol</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Register Component
// ---------------------------------------------------------------------------
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function chooseRole(r) {
    setRole(r)
    setStep(2)
  }

  async function handleSubmit(data) {
    setError('')
    setBusy(true)
    try {
      const user = await register(data)
      navigate(DASHBOARD[user.role] || '/', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed. Please review your details and try again.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full bg-surface py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── LEFT COLUMN: Brand Pillar (5 cols) ─────────────────────────── */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-10 rounded-3xl bg-primary text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-container opacity-40 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white text-primary rounded-xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    handshake
                  </span>
                </span>
                <span className="font-headline-sm text-base font-extrabold tracking-tight text-white">
                  NEED FEDERATION
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-container text-primary-fixed font-label-caps text-[10px] uppercase font-bold tracking-wider">
                COOPERATIVE NETWORK
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="font-label-caps text-xs uppercase tracking-widest text-primary-fixed-dim font-bold">
                Join the Federation
              </span>
              <h1 className="font-headline-xl text-2xl sm:text-3xl leading-tight text-white font-extrabold">
                Your skills and community belong in the network.
              </h1>
              <p className="text-xs sm:text-sm text-primary-fixed-dim max-w-md leading-relaxed">
                Choose how you participate, then build a trusted profile backed by real cooperative work, insurance equity, and zero platform exploitation.
              </p>
            </div>

            {/* Federation Pillars */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-primary-container/60 p-3.5 rounded-2xl border border-white/10">
                <ShieldCheck size={20} className="text-primary-fixed shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-white">100% Democratic Oversight</h4>
                  <p className="text-[11px] text-primary-fixed-dim mt-0.5">
                    Governed by verified member assemblies under the Multi-State Co-operative Societies Act 2002.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-primary-container/60 p-3.5 rounded-2xl border border-white/10">
                <IndianRupee size={20} className="text-secondary-container shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-white">Transparent 85/10/5 Revenue Flow</h4>
                  <p className="text-[11px] text-primary-fixed-dim mt-0.5">
                    85% direct artisan payout, 10% emergency welfare wallet, 5% democratic local society reserve.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/15 pt-4 mt-6 text-xs text-primary-fixed-dim flex items-center justify-between">
            <span>NEED Worker Cooperative Federation</span>
            <span className="font-mono text-[10px]">New Delhi • NCR</span>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Registration Form Portal (7 cols) ─────────────── */}
        <div className="lg:col-span-7 flex flex-col justify-center py-2">
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-xl border border-surface-container-high">
            {step === 1 ? (
              <RoleStep onChoose={chooseRole} />
            ) : (
              <DetailsStep
                role={role}
                onBack={() => setStep(1)}
                onSubmit={handleSubmit}
                busy={busy}
                error={error}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
