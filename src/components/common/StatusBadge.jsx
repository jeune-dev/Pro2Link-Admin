import { AlertTriangle, CheckCircle2, Circle, Info, XCircle } from 'lucide-react';
import { tonDe } from '../../theme/statuts.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';

const ICONES = { succes: CheckCircle2, avertissement: AlertTriangle, danger: XCircle, info: Info, neutre: Circle };

/** Badge générique : un statut n'est jamais une couleur seule (libellé + icône). */
export function Badge({ ton = 'neutre', children, icone = true, className = '' }) {
  const Icone = ICONES[ton] || Circle;
  return (
    <span className={`pl-badge ${className}`} data-ton={ton}>
      {icone ? <Icone aria-hidden className="size-3.5" strokeWidth={2.25} /> : null}
      {children}
    </span>
  );
}

/**
 * Badge d'un statut de l'API : couleur selon la charte (famille), libellé lu
 * dans les référentiels (clé d'énumération).
 *
 *   <StatusBadge famille="entreprise" refKey="statut_entreprise" code={c.status} />
 */
export default function StatusBadge({ famille, refKey, code, className }) {
  const { libelle } = useReferentiels();
  if (!code) return <span className="text-texte-discret">—</span>;
  return (
    <Badge ton={tonDe(famille, code)} className={className}>
      {refKey ? libelle(refKey, code) : code}
    </Badge>
  );
}
