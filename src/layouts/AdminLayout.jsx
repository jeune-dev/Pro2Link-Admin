import { useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar.jsx';
import AdminTopbar from '../components/layout/AdminTopbar.jsx';

const CLE_REPLI = 'pl-sidebar-repliee';

function lireRepli() {
  try { return localStorage.getItem(CLE_REPLI) === '1'; } catch { return false; }
}

/** Mise en page du back-office : barre latérale (repliable / tiroir mobile) + en-tête + contenu. */
export default function AdminLayout() {
  const [repliee, setRepliee] = useState(lireRepli);
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMobileOuvert(false); }, [pathname]);

  function basculerRepli() {
    setRepliee((r) => {
      try { localStorage.setItem(CLE_REPLI, r ? '0' : '1'); } catch { /* préférence non conservée */ }
      return !r;
    });
  }

  return (
    <div className="min-h-screen bg-fond">
      <a href="#contenu-admin" className="lien-evitement">Aller au contenu</a>
      <AdminSidebar repliee={repliee} onBasculer={basculerRepli} mobileOuvert={mobileOuvert} onFermerMobile={() => setMobileOuvert(false)} />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${repliee ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <AdminTopbar onMenu={() => setMobileOuvert(true)} />
        <main id="contenu-admin" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
