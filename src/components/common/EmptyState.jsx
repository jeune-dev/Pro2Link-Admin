import { Inbox } from 'lucide-react';

export default function EmptyState({ titre = 'Aucun élément', message, icone: Icone = Inbox, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-6' : 'py-14'}`}>
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-alt text-texte-secondaire">
        <Icone aria-hidden className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-texte">{titre}</p>
        {message ? <p className="mt-1 max-w-md text-petit text-texte-secondaire">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}
