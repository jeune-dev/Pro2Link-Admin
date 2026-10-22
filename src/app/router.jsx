import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { PageSpinner } from '../components/common/Spinner.jsx';
import RequireSuperAdmin from '../routes/RequireSuperAdmin.jsx';
import RouteError from '../pages/RouteError.jsx';

// Chargement paresseux : chaque écran (et Recharts) n'est téléchargé qu'à l'ouverture.
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage.jsx'));
const CompaniesPage = lazy(() => import('../pages/admin/CompaniesPage.jsx'));
const CompanyDetailsPage = lazy(() => import('../pages/admin/CompanyDetailsPage.jsx'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage.jsx'));
const UserDetailsPage = lazy(() => import('../pages/admin/UserDetailsPage.jsx'));
const SubscriptionsPage = lazy(() => import('../pages/admin/SubscriptionsPage.jsx'));
const StatisticsPage = lazy(() => import('../pages/admin/StatisticsPage.jsx'));
const ActivityPage = lazy(() => import('../pages/admin/ActivityPage.jsx'));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage.jsx'));
const AccountPage = lazy(() => import('../pages/admin/AccountPage.jsx'));

const s = (el) => <Suspense fallback={<PageSpinner />}>{el}</Suspense>;

/**
 * Le back-office est servi à la racine de son domaine (ex. admin.pro2link.sn)
 * ou sous un chemin (ex. /admin/) : VITE_BASE_PATH règle à la fois le `base`
 * de Vite et le `basename` du routeur.
 */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [{ path: 'connexion', element: s(<LoginPage />) }],
  },
  {
    path: '/',
    element: <RequireSuperAdmin>{s(<AdminLayout />)}</RequireSuperAdmin>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: s(<DashboardPage />) },
      { path: 'entreprises', element: s(<CompaniesPage />) },
      { path: 'entreprises/:id', element: s(<CompanyDetailsPage />) },
      { path: 'utilisateurs', element: s(<UsersPage />) },
      { path: 'utilisateurs/:id', element: s(<UserDetailsPage />) },
      { path: 'abonnements', element: s(<SubscriptionsPage />) },
      { path: 'statistiques', element: s(<StatisticsPage />) },
      { path: 'activite', element: s(<ActivityPage />) },
      { path: 'parametres', element: s(<SettingsPage />) },
      { path: 'compte', element: s(<AccountPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], { basename });
