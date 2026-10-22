import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageSpinner } from '../components/common/Spinner.jsx';

/**
 * Garde d'affichage du back-office. Ce n'est PAS une barrière de sécurité :
 * chaque route /api/v1/admin/* exige le rôle super_admin, la double
 * authentification et sa permission admin.* côté serveur. Ici on évite
 * seulement d'afficher un écran que l'API refuserait.
 */
export default function RequireSuperAdmin({ children }) {
  const { statut, user, estSuperAdmin, etape } = useAuth();
  const location = useLocation();

  if (statut === 'chargement') return <PageSpinner label="Vérification de la session…" />;

  // Non connecté, compte non super admin, ou étape de connexion à terminer
  // (mot de passe provisoire, double authentification) : écran de connexion.
  if (statut !== 'connecte' || !user || !estSuperAdmin || etape) {
    const chemin = location.pathname + location.search;
    const retour = chemin === '/' ? '' : `?retour=${encodeURIComponent(chemin)}`;
    return <Navigate to={`/connexion${retour}`} replace />;
  }

  return children;
}
