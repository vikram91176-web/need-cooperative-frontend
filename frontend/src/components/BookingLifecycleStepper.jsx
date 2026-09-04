/**
 * BookingLifecycleStepper.jsx — Stitch Cooperative Dispatch Lifecycle Stepper.
 */
import { CheckCircle2, Clock, MapPin, Play, UserCheck, Wrench, ShieldCheck, AlertCircle } from 'lucide-react'

const STAGES = [
  { key: 'requested', label: 'Requested', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { key: 'worker_assigned', label: 'Dispatched', icon: UserCheck },
  { key: 'on_the_way', label: 'In Transit', icon: MapPin },
  { key: 'arrived', label: 'On Site', icon: ShieldCheck },
  { key: 'in_progress', label: 'In Progress', icon: Play },
  { key: 'completed', label: 'Fulfilled', icon: Wrench },
  { key: 'confirmed', label: 'Settled', icon: CheckCircle2 },
]

export default function BookingLifecycleStepper({ status, currentStageIndex = 0 }) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="rounded-xl border border-error/30 bg-error-container/40 p-3.5 text-on-error-container flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-error shrink-0" />
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider">Booking {status === 'cancelled' ? 'Cancelled' : 'Declined'}</h4>
          <p className="text-xs text-error leading-tight">This service request is archived in federation records.</p>
        </div>
      </div>
    )
  }

  const statusMap = {
    pending: 0,
    requested: 0,
    accepted: 1,
    worker_assigned: 2,
    on_the_way: 3,
    arrived: 4,
    in_progress: 5,
    completed: 6,
    confirmed: 7,
  }

  const activeIdx = statusMap[status] ?? currentStageIndex

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative overflow-x-auto pb-2 scrollbar-none gap-1">
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx
          const isCurrent = idx === activeIdx
          const Icon = stage.icon

          return (
            <div key={stage.key} className="flex flex-col items-center text-center min-w-[70px] sm:min-w-[85px] relative z-10 px-1">
              <div
                className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                    : isCurrent
                    ? 'bg-primary-container text-on-primary-container ring-4 ring-primary-fixed/40 scale-105 animate-pulse'
                    : 'bg-surface-container text-outline border border-outline-variant/60'
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span
                className={`mt-1.5 text-[10px] sm:text-xs font-semibold leading-tight ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isDone
                    ? 'text-primary'
                    : 'text-on-surface-variant/70'
                }`}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
