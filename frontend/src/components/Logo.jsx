/**
 * Logo.jsx — the NEED Stitch Civic Cooperative Federation brand mark.
 */
export default function Logo({ showText = true, subtitle = true, className = 'w-10 h-10' }) {
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div className={`${className} rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm`}>
        <span className="material-symbols-outlined text-[24px]">diversity_3</span>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-headline-md text-headline-md text-primary tracking-tight leading-none font-extrabold">
            NEED
          </span>
          {subtitle && (
            <span className="font-label-caps text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">
              Worker-Owned Federation
            </span>
          )}
        </div>
      )}
    </div>
  )
}
