import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Fenêtre modale accessible fondée sur <dialog> natif : piège du focus,
 * touche Échap et restauration du focus fournis par le navigateur.
 */
export default function Modal({ ouvert, onFermer, titre, description, children, pied, large = false, fermetureBloquee = false }) {
  const ref = useRef(null);
  const idTitre = useId();
  const idDesc = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    const surAnnulation = (e) => {
      e.preventDefault();
      if (!fermetureBloquee) onFermer?.();
    };
    d.addEventListener('cancel', surAnnulation);
    return () => d.removeEventListener('cancel', surAnnulation);
  }, [onFermer, fermetureBloquee]);

  return (
    <dialog
      ref={ref}
      className={`pl-modale ${large ? 'pl-modale--large' : ''}`}
      aria-labelledby={idTitre}
      aria-describedby={description ? idDesc : undefined}
      onClick={(e) => {
        if (e.target === ref.current && !fermetureBloquee) onFermer?.();
      }}
    >
      {ouvert ? (
        <div className="flex max-h-[calc(100dvh-48px)] flex-col">
          <header className="flex items-start gap-4 border-b border-bordure px-6 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={idTitre} className="text-sous-titre font-semibold text-texte">{titre}</h2>
              {description ? <p id={idDesc} className="mt-1 text-petit text-texte-secondaire">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onFermer}
              disabled={fermetureBloquee}
              className="-mr-2 rounded-champ p-2 text-texte-secondaire hover:bg-surface-alt disabled:opacity-40"
              aria-label="Fermer"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {pied ? <footer className="flex flex-wrap justify-end gap-3 border-t border-bordure bg-surface-alt/50 px-6 py-4">{pied}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
