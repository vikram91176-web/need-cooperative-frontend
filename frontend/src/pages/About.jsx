/**
 * About.jsx — The NEED Cooperative Federation Democratic Charter & Philosophy.
 * Redesigned using Stitch Cooperative Federation design language.
 */

import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  HeartHandshake,
  IndianRupee,
  Scale,
  Shield,
  ShieldCheck,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react'
import SectionHeading from '../components/SectionHeading'

const DIFFERENCES = [
  {
    them: 'Private venture capital platform captures 25% to 35% commission margins as corporate profit.',
    us: '85% to 90% goes directly to the worker. 10% auto-funds their democratic personal Welfare Wallet.',
  },
  {
    them: 'Algorithms arbitrarily de-rank or deactivate workers without human tribunal recourse or explanation.',
    us: 'Accountable to elected peer assemblies with recorded restorative tripartite arbitration.',
  },
  {
    them: 'Medical emergencies, off-season lulls, and equipment breakages are solely the worker’s burden.',
    us: 'Every job automatically contributes to group health insurance, tool grants, and instant emergency liquidity.',
  },
  {
    them: 'Anonymous gig workers with no collective identity or ownership stake in the platform.',
    us: 'Certified cooperative members with government-issued physical ID cards under MSCS Act 2002.',
  },
]

export default function About() {
  return (
    <div className="w-full bg-surface text-on-surface pb-16">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-surface-container-low px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-surface-container-high">
        <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-secondary-container/10 blur-2xl" />

        <div className="relative z-10 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary mx-auto">
            <Scale size={14} />
            <span>DEMOCRATIC COOPERATIVE CHARTER • MSCS ACT 2002</span>
          </div>

          <h1 className="font-headline-xl text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight max-w-3xl mx-auto">
            A Civic Marketplace Owned by the People Who Do the Work.
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            NEED is India’s first worker-owned digital service federation. We replace speculative gig commissions
            with mutual ownership, statutory welfare security, and transparent fair-split pricing.
          </p>
        </div>
      </section>

      {/* ── Main Philosophy & Comparison ─────────────────────────────────── */}
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Narrative Column (6 cols) */}
          <div className="lg:col-span-6 space-y-6 text-sm text-on-surface-variant leading-relaxed">
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface">
              Why We Are Building a Cooperative Federation
            </h2>

            <p>
              Local home service workers — electricians, plumbers, carpenters, technicians — have traditionally
              depended on word of mouth or informal local contacts. When commercial gig platforms entered, they promised
              steady demand but introduced opaque algorithmic penalties, unpredictable surges, and 25-35% commission skims
              that siphon wealth out of local communities.
            </p>

            <p>
              NEED is chartered under the <strong>Multi-State Co-operative Societies Act, 2002</strong>. Workers are not
              disposable independent contractors; they are voting co-op partners with democratic equity in the federation.
              Every completed job contributes transparently into their personal welfare wallet, funding group medical insurance
              and instant cash emergency relief.
            </p>

            <p>
              For citizens, the benefit is guaranteed peace of mind. Every artisan arrives with government Aadhaar e-KYC
              and ITI State Technical certification verified by local union boards. You know exactly where your rupees go:
              straight to the family of the craftsman servicing your home.
            </p>

            {/* Prototype Notice Card */}
            <div className="rounded-3xl border border-secondary/30 bg-secondary-container/10 p-5 text-xs text-on-surface space-y-1.5">
              <div className="font-bold text-secondary flex items-center gap-1.5 text-sm">
                <ShieldCheck size={16} />
                Student Project Demonstration Note
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                This website is a functioning prototype built for university presentation. While database records,
                split math, invoice generators, and role permissions are real and live, banking remittances are simulated.
              </p>
            </div>
          </div>

          {/* Comparison Cards (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-primary">
              The Fundamental Structural Difference
            </h3>

            <div className="space-y-3.5">
              {DIFFERENCES.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm space-y-2.5"
                >
                  <div className="flex items-start gap-2 text-xs text-on-surface-variant/80">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="line-through">{row.them}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-semibold text-on-surface border-t border-surface-container-high pt-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-primary font-bold">{row.us}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <Link to="/register" className="btn btn-primary text-xs py-3 px-6 shadow-md flex items-center gap-2">
                <span>Join the Cooperative Movement</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
