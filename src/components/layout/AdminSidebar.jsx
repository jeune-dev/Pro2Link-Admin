import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import ActionDialog from '../common/ActionDialog.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { NAVIGATION_ADMIN } from './adminNavigation.js';

function Liens({ repliee, onNaviguer }) {
  return (
    <ul className="space-y-1">
      {NAVIGATION_ADMIN.map(({ to, label, icone: Icone, fin }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={fin}
            onClick={onNaviguer}
            title={repliee ? label : undefined}
            className={({ isActive }) => `group flex items-center gap-3 rounded-champ px-3 py-2.5 text-petit font-medium transition-colors ${
              isActive ? 'bg-primaire-teinte text-primaire' : 'text-texte-secondaire hover:bg-surface-alt hover:text-texte'
            } ${repliee ? 'justify-center' : ''}`}
          >
            <Icone className="size-5 shrink-0" aria-hidden />
            <span className={repliee ? 'sr-only' : ''}>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminSidebar({ repliee, onBasculer, mobileOuvert, onFermerMobile }) {
  const { deconnecter } = useAuth();
  const [confirmer, setConfirmer] = useState(false);

  useEffect(() => {
    if (!mobileOuvert) return undefined;
    const echap = (e) => { if (e.key === 'Escape') onFermerMobile(); };
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [mobileOuvert, onFermerMobile]);

  const boutonDeconnexion = (compact) => (
    <button
      type="button"
      onClick={() => setConfirmer(true)}
      title={compact ? 'Déconnexion' : undefined}
      className={`flex w-full items-center gap-3 rounded-champ px-3 py-2.5 text-petit font-medium text-texte-secondaire hover:bg-danger-fond hover:text-danger ${compact ? 'justify-center' : ''}`}
    >
      <LogOut className="size-5 shrink-0" aria-hidden />
      <span className={compact ? 'sr-only' : ''}>Déconnexion</span>
    </button>
  );

  return (
    <>
      {/* Bureau */}
      <aside
        aria-label="Menu du back-office"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-bordure bg-surface transition-[width] duration-200 lg:flex ${repliee ? 'w-[76px]' : 'w-64'}`}
      >
        <div className={`flex h-16 items-center border-b border-bordure ${repliee ? 'justify-center px-2' : 'px-5'}`}>
          <Link to="/" aria-label="Pro2Link — tableau de bord"><Logo compact={repliee} /></Link>
        </div>
        {!repliee ? <p className="px-5 pt-5 text-legende font-semibold uppercase tracking-wider text-texte-discret">Administration</p> : null}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Navigation du back-office">
          <Liens repliee={repliee} />
        </nav>
        <div className="space-y-1 border-t border-bordure p-3">
          {boutonDeconnexion(repliee)}
          <button
            type="button"
            onClick={onBasculer}
            aria-label={repliee ? 'Déplier le menu' : 'Replier le menu'}
            className={`flex w-full items-center gap-3 rounded-champ px-3 py-2.5 text-petit text-texte-secondaire hover:bg-surface-alt ${repliee ? 'justify-center' : ''}`}
          >
            {repliee ? <ChevronsRight className="size-5" aria-hidden /> : <ChevronsLeft className="size-5" aria-hidden />}
            {!repliee ? <span>Replier</span> : null}
          </button>
        </div>
      </aside>

      {/* Mobile : tiroir */}
      {mobileOuvert ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu du back-office">
          <button type="button" className="absolute inset-0 bg-[rgb(14_22_33/0.55)]" aria-label="Fermer le menu" onClick={onFermerMobile} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-elevee apparition">
            <div className="flex h-16 items-center justify-between border-b border-bordure px-5">
              <Logo />
              <button type="button" onClick={onFermerMobile} className="rounded-champ p-2 text-texte-secondaire hover:bg-surface-alt" aria-label="Fermer le menu" autoFocus>
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation du back-office">
              <Liens repliee={false} onNaviguer={onFermerMobile} />
            </nav>
            <div className="border-t border-bordure p-3">{boutonDeconnexion(false)}</div>
          </aside>
        </div>
      ) : null}

      <ActionDialog
        ouvert={confirmer}
        onFermer={() => setConfirmer(false)}
        titre="Se déconnecter ?"
        description="Votre session sera révoquée sur ce navigateur."
        libelleConfirmer="Se déconnecter"
        onConfirmer={async () => { await deconnecter(); setConfirmer(false); }}
      />
    </>
  );
}
