import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/** Messages éphémères (succès / erreur), annoncés aux lecteurs d'écran. */
const ToastContext = createContext(null);

const ICONES = { succes: CheckCircle2, danger: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const compteur = useRef(0);

  const fermer = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const afficher = useCallback((message, ton = 'info', duree = 5000) => {
    const id = ++compteur.current;
    setToasts((t) => [...t.slice(-3), { id, message, ton }]);
    if (duree) setTimeout(() => fermer(id), duree);
  }, [fermer]);

  const valeur = useMemo(() => ({
    succes: (m) => afficher(m, 'succes'),
    erreur: (m) => afficher(m, 'danger', 8000),
    info: (m) => afficher(m, 'info'),
  }), [afficher]);

  return (
    <ToastContext.Provider value={valeur}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6">
        {toasts.map((t) => {
          const Icone = ICONES[t.ton] || Info;
          return (
            <div
              key={t.id}
              role={t.ton === 'danger' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-carte border border-bordure bg-surface p-3 pr-2 shadow-elevee apparition"
            >
              <Icone aria-hidden className={`mt-0.5 size-5 shrink-0 ${t.ton === 'succes' ? 'text-succes' : t.ton === 'danger' ? 'text-danger' : 'text-info'}`} />
              <p className="flex-1 text-petit text-texte">{t.message}</p>
              <button type="button" onClick={() => fermer(t.id)} className="rounded-petit p-1 text-texte-secondaire hover:bg-surface-alt" aria-label="Fermer le message">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}
