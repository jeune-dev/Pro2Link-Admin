import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { compterNonLues, listerNotifications, marquerLue, toutMarquerLu } from '../../services/notificationService.js';
import { useDropdown } from '../../hooks/useDropdown.js';
import { formatRelatif } from '../../utils/format.js';
import Spinner from '../common/Spinner.jsx';

const INTERVALLE_MS = 60000;

/** Centre de notifications du compte (GET /notifications, compteur rafraîchi chaque minute si l'onglet est visible). */
export default function NotificationsMenu() {
  const [nonLues, setNonLues] = useState(0);
  const [items, setItems] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const { ouvert, basculer, conteneur, declencheur } = useDropdown();

  const actualiserCompteur = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    compterNonLues().then((d) => setNonLues(d?.non_lues ?? 0)).catch(() => {});
  }, []);

  useEffect(() => {
    actualiserCompteur();
    const t = setInterval(actualiserCompteur, INTERVALLE_MS);
    document.addEventListener('visibilitychange', actualiserCompteur);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', actualiserCompteur);
    };
  }, [actualiserCompteur]);

  useEffect(() => {
    if (!ouvert) return undefined;
    const ctrl = new AbortController();
    setChargement(true);
    setErreur(null);
    listerNotifications({ limit: 10 }, ctrl.signal)
      .then((d) => setItems(d?.items || []))
      .catch((e) => { if (!e.annulee) setErreur(e); })
      .finally(() => { if (!ctrl.signal.aborted) setChargement(false); });
    return () => ctrl.abort();
  }, [ouvert]);

  async function lire(n) {
    if (n.read_at) return;
    try {
      const d = await marquerLue(n.id);
      setItems((l) => l.map((x) => (x.id === n.id ? d?.notification || { ...x, read_at: new Date().toISOString() } : x)));
      setNonLues((c) => Math.max(0, c - 1));
    } catch (e) {
      setErreur(e);
    }
  }

  async function toutLire() {
    try {
      await toutMarquerLu();
      setItems((l) => l.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
      setNonLues(0);
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <div ref={conteneur} className="relative">
      <button
        ref={declencheur}
        type="button"
        onClick={basculer}
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-label={nonLues ? `Notifications : ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Notifications'}
        className="relative rounded-champ p-2 text-texte-secondaire hover:bg-surface-alt hover:text-texte"
      >
        <Bell className="size-5" aria-hidden />
        {nonLues ? (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white chiffres">
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        ) : null}
      </button>
      {ouvert ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-carte border border-bordure bg-surface shadow-elevee">
          <div className="flex items-center justify-between border-b border-bordure px-4 py-3">
            <p className="font-semibold text-texte">Notifications</p>
            {nonLues ? (
              <button type="button" onClick={toutLire} className="inline-flex items-center gap-1.5 text-legende font-semibold text-primaire hover:underline">
                <CheckCheck className="size-4" aria-hidden /> Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            {chargement ? <div className="p-4 text-primaire"><Spinner label="Chargement…" /></div> : null}
            {!chargement && erreur ? <p className="p-4 text-petit text-danger">{erreur.message}</p> : null}
            {!chargement && !erreur && items.length === 0 ? <p className="p-6 text-center text-petit text-texte-secondaire">Aucune notification.</p> : null}
            {!chargement && items.length ? (
              <ul className="divide-y divide-bordure">
                {items.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => lire(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-alt ${n.read_at ? '' : 'bg-primaire-teinte/40'}`}>
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-primaire'}`} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-petit font-semibold text-texte">{n.title}</span>
                        {n.body ? <span className="mt-0.5 block text-petit text-texte-secondaire">{n.body}</span> : null}
                        <span className="mt-1 block text-legende text-texte-discret">
                          {formatRelatif(n.created_at)}{n.read_at ? '' : ' · non lue'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
