import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { getServiceIcon } from './serviceIcons'
import { getServiceImage } from '../utils/serviceImages'

export default function ServiceCard({ service, onBook, onViewWorkers, variant = 'default' }) {
  const Icon = getServiceIcon(service?.icon)
  const imageUrl = getServiceImage(service)

  return (
    <article className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group border border-outline-variant/50">
      {/* Visual Header with Real Image & Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-surface-container">
        <img
          src={imageUrl}
          alt={service.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-secondary-container text-[16px]">verified</span>
          Co-op Verified
        </div>
        <div className="absolute bottom-2.5 right-3 bg-surface-container-lowest/95 backdrop-blur-md text-on-surface px-2.5 py-1 rounded-full font-label-md text-xs shadow-sm flex items-center gap-1 font-bold">
          <Star size={14} className="fill-secondary text-secondary" />
          4.9 <span className="text-on-surface-variant text-xs font-normal">(180+)</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-headline-sm text-base sm:text-lg text-on-surface font-bold tracking-tight">
              {service.name}
            </h3>
            <span className="font-label-caps text-[10px] sm:text-[11px] bg-primary-fixed/60 text-on-primary-fixed-variant px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Guild Active
            </span>
          </div>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
            {service.description}
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between pt-2.5 border-t border-outline-variant/40 mb-3.5">
            <div>
              <span className="font-label-caps text-[10px] sm:text-xs uppercase text-on-surface-variant font-semibold">Standard Rate</span>
              <div className="font-metric-val text-xl sm:text-2xl text-primary font-extrabold leading-tight">
                ₹{service.starting_price}
              </div>
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-secondary">
              85% to Member Worker
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onBook ? (
              <button
                type="button"
                onClick={() => onBook(service)}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">bolt</span>
                Book Service
              </button>
            ) : (
              <Link
                to="/services"
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">bolt</span>
                Book Service
              </Link>
            )}

            {onViewWorkers ? (
              <button
                type="button"
                onClick={() => onViewWorkers(service.name)}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-2.5 px-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-center transition-all"
              >
                View Workers
              </button>
            ) : (
              <Link
                to={`/services?trade=${encodeURIComponent(service.name)}&mode=workers`}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-2.5 px-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-center transition-all"
              >
                View Workers
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
