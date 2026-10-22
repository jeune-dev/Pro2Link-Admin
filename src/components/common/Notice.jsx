import { FlaskConical, Info } from 'lucide-react';

/** Encadré d'information (limites de l'API, éléments à compléter…). */
export default function Notice({ children, titre, ton = 'info', className = '' }) {
  const styles = ton === 'avertissement'
    ? 'border-avertissement/30 bg-avertissement-fond text-avertissement'
    : 'border-info/20 bg-info-fond text-info';
  return (
    <div className={`flex gap-3 rounded-champ border p-3 text-petit ${styles} ${className}`}>
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 text-texte">
        {titre ? <p className="font-semibold">{titre}</p> : null}
        <div className="text-texte-secondaire">{children}</div>
      </div>
    </div>
  );
}

/** Étiquette des contenus illustratifs (maquettes, données d'exemple). */
export function DemoTag({ children = 'Données d’illustration', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-avertissement/40 bg-avertissement-fond px-2 py-0.5 text-legende font-medium text-avertissement ${className}`}>
      <FlaskConical aria-hidden className="size-3" />
      {children}
    </span>
  );
}
