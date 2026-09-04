/**
 * Login.jsx — the sign-in page.
 * Redesigned using Stitch Multi-Role Access Identity Portal reference.
 *
 * WHAT: Email + password form with role selector tabs and quick-demo accounts.
 * WHY:  After authentication every dashboard becomes accessible.
 * HOW:  Calls login() from AuthContext which hits POST /api/auth/login.
 *       The `from` location is passed by ProtectedRoute so we can send the
 *       user back to where they were trying to go.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Handshake,
  HelpCircle,
  Home,
  IndianRupee,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  User,
  Wrench,
  Zap,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

// Where each role lands after login.
const DASHBOARD = {
  customer: '/customer',
  worker: '/worker',
  admin: '/admin',
  cooperative_admin: '/cooperative',
}

const DEMO_CREDENTIALS = {
  customer: {
    email: 'ananya@example.com',
    password: 'demo123',
    roleLabel: 'Citizen Customer',
  },
  worker: {
    email: 'rahul@example.com',
    password: 'demo123',
    roleLabel: 'Artisan Member',
  },
  cooperative_admin: {
    email: 'admin@noida-electricians.coop',
    password: 'demo123',
    roleLabel: 'Society Hub Manager',
  },
  admin: {
    email: 'admin@need.in',
    password: 'admin123',
    roleLabel: 'Co-op Council Admin',
  },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedRole, setSelectedRole] = useState('customer') // 'customer' | 'worker' | 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function fillDemo(roleKey) {
    setSelectedRole(roleKey)
    const demo = DEMO_CREDENTIALS[roleKey]
    if (demo) {
      setEmail(demo.email)
      setPassword(demo.password)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      const user = await login(email, password)
      const destination = location.state?.from?.pathname || DASHBOARD[user.role] || '/'
      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.error || 'Authentication failed. Please verify your credentials.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full bg-surface py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── LEFT COLUMN: Brand Pillar / Value Anchor (5 cols) ─────────── */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 sm:p-10 rounded-3xl bg-primary text-white shadow-xl relative overflow-hidden">
          {/* Decorative Backdrop Ambience */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-container opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 top-1/4 w-60 h-60 rounded-full bg-tertiary-fixed-dim opacity-10 blur-2xl pointer-events-none" />

          {/* Top Brand Meta */}
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
                MSCS REG #2024-889
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="font-label-caps text-xs uppercase tracking-widest text-primary-fixed-dim font-bold">
                Democratic Labor Economy
              </span>
              <h1 className="font-headline-xl text-2xl sm:text-3xl leading-tight text-white font-extrabold">
                The First Worker-Owned Digital Federation in India.
              </h1>
              <p className="text-xs sm:text-sm text-primary-fixed-dim max-w-md leading-relaxed">
                Replacing speculative platform commissions with direct community ownership, healthcare equity, and audited civic trust.
              </p>
            </div>

            {/* Pillar Impact Metrics (Bento-style strip) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-primary-container/80 backdrop-blur-md flex flex-col gap-1 border border-white/10">
                <div className="flex items-center gap-1.5 text-secondary-container">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  <span className="font-metric-val text-xl font-extrabold text-white">85-90%</span>
                </div>
                <span className="font-label-md text-xs font-bold text-primary-fixed">Direct Worker Earnings</span>
                <span className="text-[11px] text-primary-fixed-dim opacity-80">0% gig-app skim</span>
              </div>

              <div className="p-4 rounded-2xl bg-primary-container/80 backdrop-blur-md flex flex-col gap-1 border border-white/10">
                <div className="flex items-center gap-1.5 text-secondary-container">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span className="font-metric-val text-xl font-extrabold text-white">100%</span>
                </div>
                <span className="font-label-md text-xs font-bold text-primary-fixed">Statutory Shield</span>
                <span className="text-[11px] text-primary-fixed-dim opacity-80">MSCS Act 2002 certified</span>
              </div>
            </div>
          </div>

          {/* Bottom Pillar: Worker Testimonial Card */}
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-lg space-y-2 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary flex items-center justify-center font-bold text-white text-xs">
                MS
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate text-inverse-on-surface">Manoj Sharma</span>
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
                <span className="text-[11px] text-surface-dim truncate">Master Electrician • Noida Guild #14</span>
              </div>
            </div>
            <p className="text-xs text-inverse-on-surface/90 italic leading-relaxed pt-1">
              “For 6 years private apps took 30% of my hard work. With NEED, I own my cooperative share, receive group health cover, and earn with mutual dignity.”
            </p>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Authentication & Access Portal (7 cols) ───────── */}
        <div className="lg:col-span-7 flex flex-col justify-center py-2">
          {/* Multi-Language Bar + End-to-End Encrypted Badge */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">translate</span>
              <div className="inline-flex p-1 bg-surface-container rounded-xl text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-surface text-primary shadow-xs">English</span>
                <span className="px-2.5 py-1 rounded-lg text-on-surface-variant">हिन्दी</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
              <ShieldCheck size={16} className="text-primary" />
              <span>256-Bit Encrypted</span>
            </div>
          </div>

          {/* Form Container Card */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-xl border border-surface-container-high flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">
                  Sign In to NEED Portal
                </h2>
                <span className="px-2 py-0.5 bg-surface-container-high rounded-full font-mono text-[10px] text-on-surface-variant font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Select your federation role to load your authorized workspace.
              </p>
            </div>

            {/* Role Selector Tabs (4 Roles) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('customer')}
                className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col gap-1.5 border ${
                  selectedRole === 'customer'
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Home size={16} />
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRole === 'customer' ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
                <span className="font-bold text-xs text-on-surface">Customer</span>
                <span className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                  Book verified services &amp; quotes.
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('worker')}
                className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col gap-1.5 border ${
                  selectedRole === 'worker'
                    ? 'border-secondary bg-secondary/5 shadow-xs'
                    : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-8 h-8 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center">
                    <Wrench size={16} />
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRole === 'worker' ? 'bg-secondary' : 'bg-transparent'
                    }`}
                  />
                </div>
                <span className="font-bold text-xs text-on-surface">Artisan</span>
                <span className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                  Welfare wallet &amp; job dispatches.
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('cooperative_admin')}
                className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col gap-1.5 border ${
                  selectedRole === 'cooperative_admin'
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-8 h-8 rounded-xl bg-primary-container/15 text-primary flex items-center justify-center">
                    <Handshake size={16} />
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRole === 'cooperative_admin' ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
                <span className="font-bold text-xs text-on-surface">Society Hub</span>
                <span className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                  Co-op roster, audit &amp; dispatch.
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className={`text-left p-3 rounded-2xl transition-all duration-200 flex flex-col gap-1.5 border ${
                  selectedRole === 'admin'
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-8 h-8 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                    <Building2 size={16} />
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRole === 'admin' ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
                <span className="font-bold text-xs text-on-surface">Council Admin</span>
                <span className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                  Reserve funds, KYC &amp; tribunal.
                </span>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Email Address or Registered Phone
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-stitch pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-on-surface">Account Password</label>
                  <span className="text-[11px] text-primary font-bold hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-stitch pl-10 pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full btn btn-primary py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Authenticate &amp; Enter Gateway</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Switcher Bar */}
            <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container-high">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                1-Click Demo Accounts Pre-Fill:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo('customer')}
                  className="p-1.5 rounded-xl bg-white border border-surface-container-high hover:border-primary text-on-surface font-bold text-center transition"
                >
                  <span className="block text-[11px] text-primary">Ananya (Citizen)</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">demo123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('worker')}
                  className="p-1.5 rounded-xl bg-white border border-surface-container-high hover:border-secondary text-on-surface font-bold text-center transition"
                >
                  <span className="block text-[11px] text-secondary">Rahul (Artisan)</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">demo123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('cooperative_admin')}
                  className="p-1.5 rounded-xl bg-white border border-surface-container-high hover:border-primary text-on-surface font-bold text-center transition"
                >
                  <span className="block text-[11px] text-primary">Noida Co-op</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">demo123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="p-1.5 rounded-xl bg-white border border-surface-container-high hover:border-primary text-on-surface font-bold text-center transition"
                >
                  <span className="block text-[11px] text-primary">Council Admin</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">admin123</span>
                </button>
              </div>
            </div>

            {/* Trust & Zero Data Monetization Guarantee */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-2.5 text-xs text-on-surface-variant">
              <Shield size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="leading-tight text-[11px]">
                <strong className="font-bold text-on-surface">Zero Data Monetization Guarantee:</strong> No third-party ad tracking or broker resale. Governed strictly under National Cooperative Council Charter #2026.
              </p>
            </div>

            {/* Footer switcher */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant">
              <span>First time with the Federation?</span>
              <Link to="/register" className="font-bold text-primary hover:underline">
                Create Member or Citizen Account →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
