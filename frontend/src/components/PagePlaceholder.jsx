import { Link } from 'react-router-dom'
import { ArrowLeft, Hammer } from 'lucide-react'

/**
 * PagePlaceholder.jsx — a holding page for routes we have not built yet.
 *
 * WHY: The navbar links to /login, /services and /help. If those routes did
 *      not exist, clicking them would show a broken page during a demo. This
 *      component makes the gap look deliberate and says which step fills it.
 */
export default function PagePlaceholder({ title, description, buildingIn }) {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Hammer size={22} />
        </span>

        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">{title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{description}</p>

        {buildingIn && (
          <p className="mt-6 inline-block rounded-lg border border-line bg-white px-4 py-2 font-mono text-xs text-muted">
            Built in: {buildingIn}
          </p>
        )}

        <div className="mt-8">
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={17} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
