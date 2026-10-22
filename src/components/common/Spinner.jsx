const TAILLES = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-10 border-[3px]' };

export default function Spinner({ taille = 'md', label, className = '' }) {
  return (
    <span role={label ? 'status' : undefined} className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className={`${TAILLES[taille]} animate-spin rounded-full border-current border-r-transparent opacity-80`} />
      {label ? <span className="text-petit text-texte-secondaire">{label}</span> : null}
    </span>
  );
}

/** Chargement d'une page entière. */
export function PageSpinner({ label = 'Chargement…' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-primaire">
      <Spinner taille="lg" label={label} />
    </div>
  );
}
