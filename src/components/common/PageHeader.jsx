import { Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * En-tête de page du back-office : fil d'Ariane, titre, description, actions.
 * Met aussi à jour le titre du document (pages privées : noindex dans index.html non requis,
 * le back-office n'est pas listé dans le sitemap et robots.txt l'exclut).
 */
export default function PageHeader({ titre, description, ariane = [], actions, badge }) {
  useEffect(() => {
    document.title = `${titre} · Administration Pro2Link`;
  }, [titre]);

  const chemin = [{ label: 'Administration', to: '/' }, ...ariane];

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-1 text-legende text-texte-secondaire">
            {chemin.map((c, i) => (
              <Fragment key={`${c.label}-${i}`}>
                <li>
                  {c.to && i < chemin.length - 1 ? <Link to={c.to} className="hover:text-primaire">{c.label}</Link> : <span aria-current={i === chemin.length - 1 ? 'page' : undefined}>{c.label}</span>}
                </li>
                {i < chemin.length - 1 ? <li aria-hidden><ChevronRight className="size-3.5" /></li> : null}
              </Fragment>
            ))}
          </ol>
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-titre font-semibold tracking-tight text-texte sm:text-grand-titre">{titre}</h1>
          {badge}
        </div>
        {description ? <p className="mt-1 max-w-3xl text-petit text-texte-secondaire">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
