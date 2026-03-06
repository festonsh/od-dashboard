type BrandLogoProps = {
  className?: string
  showSubtitle?: boolean
}

export function BrandLogo({
  className = '',
  showSubtitle = true
}: BrandLogoProps) {
  return (
    <span className={`brand-logo${className ? ` ${className}` : ''}`}>
      <img
        src="/a-and-m-electric-logo.png"
        alt="A & M Electric Scheduler"
        className="brand-logo__image"
      />
      {showSubtitle && (
        <span className="brand-logo__subtitle">Scheduler</span>
      )}
    </span>
  )
}
