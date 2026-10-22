import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Monitor, Moon, ShieldCheck, Sun, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useDropdown } from '../../hooks/useDropdown.js';
import { useTheme } from '../../hooks/useTheme.js';
import { initiales, nomComplet } from '../../utils/format.js';

const THEMES = [
  { id: 'system', label: 'Système', icone: Monitor },
  { id: 'light', label: 'Clair', icone: Sun },
  { id: 'dark', label: 'Sombre', icone: Moon },
];

export default function ProfileMenu() {
  const { user, deconnecter } = useAuth();
  const { theme, setTheme } = useTheme();
  const { ouvert, basculer, fermer, conteneur, declencheur } = useDropdown();
  const nom = nomComplet(user);

  return (
    <div ref={conteneur} className="relative">
      <button
        ref={declencheur}
        type="button"
        onClick={basculer}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-champ p-1.5 hover:bg-surface-alt"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primaire text-legende font-semibold text-sur-primaire" aria-hidden>{initiales(nom)}</span>
        <span className="hidden text-left md:block">
          <span className="block max-w-40 truncate text-petit font-semibold text-texte">{nom}</span>
          <span className="block text-legende text-texte-secondaire">Super administrateur</span>
        </span>
        <ChevronDown className="hidden size-4 text-texte-secondaire md:block" aria-hidden />
        <span className="sr-only">Menu du compte</span>
      </button>
      {ouvert ? (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-carte border border-bordure bg-surface shadow-elevee">
          <div className="border-b border-bordure px-4 py-3">
            <p className="truncate font-semibold text-texte">{nom}</p>
            <p className="truncate text-petit text-texte-secondaire">{user?.email}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-legende font-medium text-succes">
              <ShieldCheck className="size-3.5" aria-hidden /> Double authentification active
            </p>
          </div>
          <div className="p-1.5">
            <Link role="menuitem" to="/compte" onClick={() => fermer()} className="flex items-center gap-3 rounded-champ px-3 py-2 text-petit text-texte hover:bg-surface-alt">
              <UserCircle className="size-4 text-texte-secondaire" aria-hidden /> Mon compte et sécurité
            </Link>
          </div>
          <div className="border-t border-bordure px-4 py-3">
            <p className="text-legende font-medium text-texte-secondaire" id="libelle-theme">Affichage</p>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-champ bg-surface-alt p-1" role="radiogroup" aria-labelledby="libelle-theme">
              {THEMES.map(({ id, label, icone: Icone }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  onClick={() => setTheme(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-petit py-1.5 text-legende font-medium ${theme === id ? 'bg-surface text-primaire shadow-douce' : 'text-texte-secondaire hover:text-texte'}`}
                >
                  <Icone className="size-3.5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-bordure p-1.5">
            <button role="menuitem" type="button" onClick={deconnecter} className="flex w-full items-center gap-3 rounded-champ px-3 py-2 text-petit text-danger hover:bg-danger-fond">
              <LogOut className="size-4" aria-hidden /> Se déconnecter
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
