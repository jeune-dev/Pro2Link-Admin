import { Activity, BarChart3, Building2, CreditCard, LayoutDashboard, Settings, Users } from 'lucide-react';

/** Menu du back-office (chaque entrée correspond à une permission admin.* côté API). */
export const NAVIGATION_ADMIN = [
  { to: '/', label: 'Tableau de bord', icone: LayoutDashboard, fin: true },
  { to: '/entreprises', label: 'Entreprises', icone: Building2 },
  { to: '/utilisateurs', label: 'Utilisateurs', icone: Users },
  { to: '/abonnements', label: 'Abonnements', icone: CreditCard },
  { to: '/statistiques', label: 'Statistiques', icone: BarChart3 },
  { to: '/activite', label: 'Activité et audit', icone: Activity },
  { to: '/parametres', label: 'Paramètres', icone: Settings },
];
