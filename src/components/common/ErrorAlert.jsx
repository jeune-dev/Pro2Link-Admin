import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

/** Erreur API affichée telle que rédigée par le serveur (+ détails et identifiant de requête). */
export default function ErrorAlert({ erreur, titre, className = '' }) {
  if (!erreur) return null;
  const message = typeof erreur === 'string' ? erreur : erreur.message;
  const details = Array.isArray(erreur?.details) ? erreur.details : [];
  return (
    <div role="alert" className={`flex gap-3 rounded-champ border border-danger/30 bg-danger-fond p-3 text-petit text-danger ${className}`}>
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        {titre ? <p className="font-semibold">{titre}</p> : null}
        <p>{message}</p>
        {details.length ? (
          <ul className="list-disc pl-4">
            {details.slice(0, 6).map((d) => <li key={d}>{d}</li>)}
          </ul>
        ) : null}
        {erreur?.requestId ? <p className="text-legende opacity-80">Référence : {erreur.requestId}</p> : null}
      </div>
    </div>
  );
}

/** Bloc d'erreur d'une section qui n'a pas pu se charger, avec bouton « Réessayer ». */
export function ErrorState({ erreur, onRetry, compact = false }) {
  const message = erreur?.message || 'Le chargement a échoué.';
  const refusee = erreur?.status === 403;
  return (
    <div role="alert" className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-6' : 'py-14'}`}>
      <span className="flex size-11 items-center justify-center rounded-full bg-danger-fond text-danger">
        <AlertTriangle aria-hidden className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-texte">{refusee ? 'Accès refusé' : 'Impossible de charger les données'}</p>
        <p className="mt-1 max-w-md text-petit text-texte-secondaire">{message}</p>
        {erreur?.requestId ? <p className="mt-1 text-legende text-texte-discret">Référence : {erreur.requestId}</p> : null}
      </div>
      {onRetry && !refusee ? <Button variante="neutre" taille="sm" icone={RefreshCw} onClick={onRetry}>Réessayer</Button> : null}
    </div>
  );
}
