/**
 * SectionHeading.jsx — Stitch Civic section header component.
 */
export default function SectionHeading({ eyebrow, title, description, align = 'left', className = '' }) {
  const isCentre = align === 'center'

  return (
    <div className={`${isCentre ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow && (
        <div className={`flex items-center gap-2 mb-2 ${isCentre ? 'justify-center' : ''}`}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps uppercase font-bold tracking-wider">
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-2.5 font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
