import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Building2, CreditCard, ShieldCheck } from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import { config } from '../utils/config.js';

/** Mise en page de la connexion au back-office : panneau de marque + formulaire. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <a href="#contenu" className="lien-evitement">Aller au contenu</a>
      <aside className="relative hidden overflow-hidden bg-primaire px-12 py-12 text-sur-primaire lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full border-[48px] border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[420px] rounded-full border-[48px] border-secondaire/20" />
        <span className="relative inline-flex w-fit items-center gap-2.5 rounded-champ bg-white/95 px-3 py-2"><Logo /></span>
        <div className="relative mt-auto max-w-md">
          <p className="text-petit font-semibold uppercase tracking-[0.12em] text-secondaire">Back-office</p>
          <h2 className="mt-3 text-[30px] font-semibold leading-tight">Supervision de la plateforme Pro2Link.</h2>
          <ul className="mt-8 space-y-3 text-sur-primaire/90">
            {[
              [Building2, 'Entreprises clientes et utilisateurs'],
              [CreditCard, 'Abonnements, paiements et forfaits'],
              [ShieldCheck, 'Accès protégé par double authentification'],
            ].map(([Icone, t]) => (
              <li key={t} className="flex items-center gap-3"><Icone className="size-5 text-secondaire" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-legende text-sur-primaire/70">© {new Date().getFullYear()} Pro2Link</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo />
        </header>
        <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[440px]"><Outlet /></div>
        </main>
        {config.siteUrl ? (
          <footer className="px-6 py-5 text-center text-legende text-texte-secondaire">
            <a href={config.siteUrl} className="hover:text-primaire">Retour au site Pro2Link</a>
          </footer>
        ) : null}
      </div>
      <ScrollRestoration />
    </div>
  );
}
