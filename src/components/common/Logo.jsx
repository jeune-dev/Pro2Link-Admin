/**
 * Identité textuelle PROVISOIRE de Pro2Link (aucun logo officiel fourni) :
 * deux anneaux liés (acheteur / fournisseur) + nom. À remplacer par le logo
 * définitif dans src/assets lorsqu'il sera disponible.
 */
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--pl-primaire)" />
      <circle cx="12.5" cy="16" r="5.2" fill="none" stroke="var(--pl-sur-primaire)" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="5.2" fill="none" stroke="#14B8A6" strokeWidth="2.4" />
    </svg>
  );
}

export default function Logo({ compact = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      {compact ? <span className="sr-only">Pro2Link</span> : (
        <span className="text-[19px] font-semibold tracking-tight text-texte">
          Pro<span className="text-secondaire-survol">2</span>Link
        </span>
      )}
    </span>
  );
}
