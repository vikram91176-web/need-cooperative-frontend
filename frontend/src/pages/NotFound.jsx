/**
 * NotFound.jsx — 404 Error page.
 * Redesigned using Stitch design system.
 */

import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="w-full bg-surface flex items-center justify-center py-12 sm:py-16 px-4">
      <div className="max-w-md w-full text-center space-y-5 bg-surface-container-lowest p-8 sm:p-10 rounded-3xl border border-surface-container-high shadow-xl animate-scaleUp">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
          <Compass size={32} />
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">Error 404 • Lost in Sector</p>
          <h1 className="mt-1 font-headline-xl text-2xl sm:text-3xl font-extrabold text-on-surface">
            Page Not Found
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            The requested resource or sector address could not be located on the NEED Cooperative Federation network.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/" className="btn btn-primary text-xs py-2.5 px-5 shadow-md inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>Return to Federation Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
