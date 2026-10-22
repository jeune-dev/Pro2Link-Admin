import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, User } from 'lucide-react';
import { listerEntreprises } from '../../services/companyService.js';
import { listerUtilisateurs } from '../../services/userService.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDropdown } from '../../hooks/useDropdown.js';
import { nomComplet } from '../../utils/format.js';
import Spinner from '../common/Spinner.jsx';

/**
 * Recherche globale : l'API n'a pas de route de recherche unique ; on interroge
 * les deux listes existantes (paramètre `q`) — entreprises et utilisateurs.
 */
export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const terme = useDebounce(q.trim(), 300);
  const [resultats, setResultats] = useState({ entreprises: [], utilisateurs: [] });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [actif, setActif] = useState(-1);
  const { ouvert, setOuvert, conteneur } = useDropdown();
  const navigate = useNavigate();
  const idListe = useId();
  const champ = useRef(null);

  useEffect(() => {
    if (terme.length < 2) {
      setResultats({ entreprises: [], utilisateurs: [] });
      setErreur(null);
      return undefined;
    }
    const ctrl = new AbortController();
    setChargement(true);
    setErreur(null);
    Promise.allSettled([
      listerEntreprises({ q: terme, limit: 5 }, ctrl.signal),
      listerUtilisateurs({ q: terme, limit: 5 }, ctrl.signal),
    ]).then(([e, u]) => {
      if (ctrl.signal.aborted) return;
      setResultats({
        entreprises: e.status === 'fulfilled' ? e.value?.items || [] : [],
        utilisateurs: u.status === 'fulfilled' ? u.value?.items || [] : [],
      });
      if (e.status === 'rejected' && u.status === 'rejected') setErreur(e.reason);
      setActif(-1);
      setChargement(false);
    });
    return () => ctrl.abort();
  }, [terme]);

  // Raccourci clavier « / » pour rechercher.
  useEffect(() => {
    const raccourci = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        champ.current?.focus();
      }
    };
    document.addEventListener('keydown', raccourci);
    return () => document.removeEventListener('keydown', raccourci);
  }, []);

  const liste = [
    ...resultats.entreprises.map((c) => ({ id: `e-${c.id}`, to: `/entreprises/${c.id}`, titre: c.name, sous: [c.city, c.email].filter(Boolean).join(' · '), icone: Building2 })),
    ...resultats.utilisateurs.map((u) => ({ id: `u-${u.id}`, to: `/utilisateurs/${u.id}`, titre: nomComplet(u), sous: u.email || u.phone, icone: User })),
  ];

  function aller(item) {
    setOuvert(false);
    setQ('');
    navigate(item.to);
  }

  function clavier(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOuvert(true); setActif((a) => Math.min(a + 1, liste.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActif((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && actif >= 0 && liste[actif]) { e.preventDefault(); aller(liste[actif]); }
  }

  const afficher = ouvert && terme.length >= 2;

  return (
    <div ref={conteneur} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texte-discret" aria-hidden />
      <input
        ref={champ}
        type="search"
        role="combobox"
        aria-expanded={afficher}
        aria-controls={idListe}
        aria-autocomplete="list"
        aria-activedescendant={actif >= 0 && liste[actif] ? `${idListe}-${actif}` : undefined}
        aria-label="Rechercher une entreprise ou un utilisateur"
        placeholder="Rechercher une entreprise, un utilisateur…"
        value={q}
        maxLength={100}
        onChange={(e) => { setQ(e.target.value); setOuvert(true); }}
        onFocus={() => setOuvert(true)}
        onKeyDown={clavier}
        className="pl-champ !min-h-9 border-bordure bg-surface-alt pl-9 text-petit focus:bg-surface"
      />
      {afficher ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-carte border border-bordure bg-surface shadow-elevee sm:right-auto sm:w-[28rem]">
          {chargement ? <div className="p-4 text-primaire"><Spinner label="Recherche…" /></div> : null}
          {!chargement && erreur ? <p className="p-4 text-petit text-danger">{erreur.message}</p> : null}
          {!chargement && !erreur && liste.length === 0 ? <p className="p-4 text-petit text-texte-secondaire">Aucun résultat pour « {terme} ».</p> : null}
          {!chargement && liste.length ? (
            <ul id={idListe} role="listbox" className="max-h-96 overflow-y-auto py-1">
              {liste.map((item, i) => (
                <li
                  key={item.id}
                  id={`${idListe}-${i}`}
                  role="option"
                  aria-selected={i === actif}
                  onMouseDown={(e) => { e.preventDefault(); aller(item); }}
                  onMouseEnter={() => setActif(i)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === actif ? 'bg-primaire-teinte' : ''}`}
                >
                  <item.icone className="size-4 shrink-0 text-texte-secondaire" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-petit font-medium text-texte">{item.titre}</span>
                    {item.sous ? <span className="block truncate text-legende text-texte-secondaire">{item.sous}</span> : null}
                  </span>
                  <span className="ml-auto text-legende text-texte-discret">{item.id.startsWith('e-') ? 'Entreprise' : 'Utilisateur'}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
