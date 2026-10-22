import { Menu } from 'lucide-react';
import GlobalSearch from './GlobalSearch.jsx';
import NotificationsMenu from './NotificationsMenu.jsx';
import ProfileMenu from './ProfileMenu.jsx';

export default function AdminTopbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-bordure bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button type="button" onClick={onMenu} className="-ml-1 rounded-champ p-2 text-texte lg:hidden" aria-label="Ouvrir le menu">
        <Menu className="size-5" aria-hidden />
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
