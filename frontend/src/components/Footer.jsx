import { Link } from 'react-router-dom'
import { Mail, Phone, ShieldCheck } from 'lucide-react'
import Logo from './Logo'

const COLUMNS = [
  {
    heading: 'Cooperative Platform',
    links: [
      { to: '/services', label: 'Service Catalogue (20+ Trades)' },
      { to: '/services?mode=workers', label: 'Artisan & Worker Directory' },
      { to: '/cooperatives', label: 'Affiliated Labour Societies' },
      { to: '/register', label: 'Worker Membership Application' },
    ],
  },
  {
    heading: 'Democratic Model',
    links: [
      { to: '/about', label: 'Cooperative Federation Charter' },
      { to: '/about', label: '85/10/5 Fair-Split Formula' },
      { to: '/about', label: 'Artisan Welfare Fund Ledger' },
      { to: '/about', label: 'Zero Algorithmic Penalties' },
    ],
  },
  {
    heading: 'Civic Support & Help',
    links: [
      { to: '/help', label: 'Dispute Arbitration Desk' },
      { to: '/help', label: 'Payment & Receipt Help' },
      { to: '/help', label: 'Worker Health & Safety Net' },
      { to: '/help', label: 'RWA & Resident Welfare FAQs' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-outline-variant/60 bg-surface-container-low/50">
      <div className="max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 2xl:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
              The first worker-owned digital service federation in India. Replacing extractive corporate gig aggregator commissions with direct community ownership, healthcare equity, and audited civic trust.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed text-xs font-semibold">
              <ShieldCheck size={14} className="text-primary" />
              Registered under Multi-State Cooperative Societies Act, 2002
            </div>
            <div className="space-y-2 text-xs text-on-surface-variant pt-2">
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-primary" /> federation-desk@need.coop.in
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-primary" /> 1800-NEED-COOP (Toll Free Civic Line)
              </p>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="font-label-caps text-xs uppercase tracking-wider text-on-surface font-bold">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-outline-variant/50 pt-6 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} NEED Worker-Owned Cooperative Federation. All rights reserved.</p>
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full text-[11px] font-mono font-medium text-on-surface">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Demo Environment • Simulated Financial Flow &amp; Real State DB
          </div>
        </div>
      </div>
    </footer>
  )
}
