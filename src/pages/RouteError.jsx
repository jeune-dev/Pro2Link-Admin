import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { classesBouton } from '../components/common/Button.jsx';

/** Erreur de rendu ou de chargement d'un module (ex. nouvelle version déployée). */
export default function RouteError() {
  const erreur = useRouteError();
  const chunk = erreur instanceof Error && /dynamically imported module|Importing a module script failed/i.test(erreur.message);
  const titre = isRouteErrorResponse(erreur) && erreur.status === 404 ? 'Page introuvable' : 'Une erreur est survenue';

  return (
    <main className="flex min-h-screen items-center justify-center bg-fond px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-fond text-danger">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-titre font-semibold text-texte">{titre}</h1>
        <p className="mt-2 text-petit text-texte-secondaire">
          {chunk
            ? 'Une nouvelle version de Pro2Link a été mise en ligne. Rechargez la page pour continuer.'
            : 'L’affichage de cette page a échoué. Vous pouvez recharger la page ou revenir à l’accueil.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className={classesBouton({ variante: 'primaire' })} onClick={() => window.location.reload()}>Recharger</button>
          <Link to="/" className={classesBouton({ variante: 'neutre' })}>Accueil</Link>
        </div>
      </div>
    </main>
  );
}
