import { CheckCircle2, ShieldCheck, Star } from 'lucide-react'

function getInitials(fullName) {
  return fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'W'
}

export default function WorkerIdCard({
  name = 'Rajesh Kumar Verma',
  trade = 'Master Electrician & Solar Wireman',
  society = 'Noida Shramik Electric Co-op',
  memberId = 'ND-ELE-8812',
  rating = 4.95,
  jobs = 342,
  area = 'Sector 62, Noida (NCR)',
  status = 'verified',
  onBook,
  showBookingTrigger = false,
  photoUrl,
}) {
  const isVerified = status === 'verified'

  return (
    <article className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/60 relative">
      {/* Badge Header: Credential Style */}
      <div className="bg-inverse-surface text-inverse-on-surface px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
          <span className="font-label-caps text-[10px] uppercase tracking-widest text-secondary-fixed font-bold">
            NEED FEDERATION CREDENTIAL
          </span>
        </div>
        <span className="font-label-caps text-[11px] text-surface-variant font-mono font-bold">
          ID: {memberId || 'ND-ELE-0000'}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* Worker Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover shadow-md bg-surface-container"
              />
            ) : (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-primary text-2xl shadow-sm">
                {getInitials(name)}
              </div>
            )}
            {isVerified && (
              <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-1.5 shadow-md">
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-headline-sm text-lg sm:text-xl text-on-surface font-bold truncate">
              {name}
            </h3>
            <p className="font-body-sm text-sm text-on-surface-variant mt-0.5 truncate">
              {trade}
            </p>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-secondary font-bold text-sm bg-secondary-container/15 px-2.5 py-0.5 rounded-full">
                <Star size={14} className="fill-secondary text-secondary" />
                {rating}
              </span>
              <span className="text-on-surface-variant font-body-sm text-sm">
                ({jobs} verified jobs)
              </span>
            </div>
          </div>
        </div>

        {/* Cooperative Guild Affiliation Box */}
        <div className="bg-surface-container-low rounded-xl p-3.5 mb-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-on-surface">
            <span className="text-on-surface-variant">Affiliated Guild:</span>
            <span className="font-semibold text-primary truncate max-w-[200px]">{society}</span>
          </div>
          <div className="flex justify-between items-center text-on-surface">
            <span className="text-on-surface-variant">Police Verification:</span>
            <span className="text-primary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> UP Police Clear
            </span>
          </div>
          <div className="flex justify-between items-center text-on-surface">
            <span className="text-on-surface-variant">Co-op Stakeholder Share:</span>
            <span className="font-mono font-bold text-on-surface">Class-A (Full Voting)</span>
          </div>
        </div>

        {/* Micro Live Split on Artisan Card */}
        <div className="bg-primary/5 rounded-xl p-3.5 mb-4 border border-primary/10">
          <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
            <span className="font-label-caps text-[11px] text-primary uppercase font-bold">Standard Job Fair Split</span>
            <span className="font-label-md text-xs sm:text-sm text-primary font-bold">₹500 Benchmark</span>
          </div>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex mb-2">
            <div className="h-full bg-primary" style={{ width: '85%' }} title="Worker takes 85%"></div>
            <div className="h-full bg-secondary-container" style={{ width: '10%' }} title="Welfare Fund 10%"></div>
            <div className="h-full bg-outline-variant" style={{ width: '5%' }} title="Tech Ops 5%"></div>
          </div>
          <div className="flex justify-between text-on-surface-variant text-[11px] sm:text-xs font-medium">
            <span className="text-primary font-semibold">₹425 To Worker (85%)</span>
            <span className="text-secondary font-semibold">₹50 Welfare (10%)</span>
            <span>₹25 Ops (5%)</span>
          </div>
        </div>

        {/* Action Trigger */}
        {showBookingTrigger && onBook && (
          <button
            type="button"
            onClick={onBook}
            className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl font-label-md text-sm font-bold text-center transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Book {name.split(' ')[0]} Directly
          </button>
        )}
      </div>

      {/* Member ID Footer */}
      <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-low px-5 py-3 text-xs sm:text-sm text-on-surface-variant">
        <span className="font-label-caps text-[10px] uppercase font-bold">Jurisdiction</span>
        <span className="font-medium text-on-surface truncate">{area}</span>
      </div>
    </article>
  )
}
