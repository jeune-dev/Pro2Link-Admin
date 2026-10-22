import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ErrorState } from '../common/ErrorAlert.jsx';
import EmptyState from '../common/EmptyState.jsx';

/**
 * Tableau de données responsive :
 * - ≥ md : tableau classique (en-têtes triables quand `sortKey` est défini) ;
 * - < md : liste de cartes (chaque colonne = ligne « libellé : valeur »).
 * États gérés : chargement (squelettes), erreur (avec Réessayer), vide.
 *
 * @param {{
 *   colonnes: Array<{ key: string, header: string, render?: (row) => React.ReactNode, sortKey?: string,
 *                     className?: string, masquerMobile?: boolean, principal?: boolean, align?: 'right' }>,
 *   lignes?: any[], chargement?: boolean, erreur?: any, onRetry?: () => void,
 *   tri?: string, onTri?: (t: string) => void, vide?: React.ReactNode, onLigne?: (row) => void,
 *   libelleLigne?: (row) => string, caption?: string
 * }} props
 */
export default function DataTable({
  colonnes, lignes = [], chargement = false, erreur = null, onRetry, tri, onTri, vide, onLigne, libelleLigne, caption, cleLigne = (r) => r.id,
}) {
  if (erreur && !chargement) return <ErrorState erreur={erreur} onRetry={onRetry} />;

  const triActuel = (col) => {
    if (!col.sortKey || !tri) return null;
    if (tri === col.sortKey) return 'asc';
    if (tri === `-${col.sortKey}`) return 'desc';
    return null;
  };
  const basculerTri = (col) => {
    const etat = triActuel(col);
    onTri?.(etat === 'desc' ? col.sortKey : `-${col.sortKey}`);
  };

  const squelettes = Array.from({ length: 6 }, (_, i) => i);
  const estVide = !chargement && lignes.length === 0;

  return (
    <div aria-busy={chargement || undefined}>
      {/* Bureau / tablette */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-petit">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-bordure bg-surface-alt/60">
              {colonnes.map((col) => {
                const etat = triActuel(col);
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={etat === 'asc' ? 'ascending' : etat === 'desc' ? 'descending' : undefined}
                    className={`whitespace-nowrap px-4 py-3 text-legende font-semibold uppercase tracking-wide text-texte-secondaire ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}
                  >
                    {col.sortKey && onTri ? (
                      <button type="button" onClick={() => basculerTri(col)} className="inline-flex items-center gap-1 uppercase hover:text-texte">
                        {col.header}
                        {etat === 'asc' ? <ArrowUp className="size-3.5" aria-hidden /> : etat === 'desc' ? <ArrowDown className="size-3.5" aria-hidden /> : <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />}
                      </button>
                    ) : col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {chargement
              ? squelettes.map((i) => (
                <tr key={i} className="border-b border-bordure last:border-0">
                  {colonnes.map((c) => <td key={c.key} className="px-4 py-3.5"><div className="squelette h-4 w-full max-w-40" /></td>)}
                </tr>
              ))
              : lignes.map((row) => (
                <tr
                  key={cleLigne(row)}
                  className={`border-b border-bordure transition-colors last:border-0 ${onLigne ? 'cursor-pointer hover:bg-primaire-teinte/40' : ''}`}
                  onClick={onLigne ? (e) => {
                    if (e.target.closest('a,button,input,select,label')) return;
                    onLigne(row);
                  } : undefined}
                >
                  {colonnes.map((col) => (
                    <td key={col.key} className={`px-4 py-3 align-middle text-texte ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}>
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile : cartes */}
      <ul className="divide-y divide-bordure md:hidden">
        {chargement
          ? squelettes.slice(0, 4).map((i) => (
            <li key={i} className="space-y-2 p-4"><div className="squelette h-4 w-2/3" /><div className="squelette h-3 w-1/2" /></li>
          ))
          : lignes.map((row) => {
            const principal = colonnes.find((c) => c.principal) || colonnes[0];
            const autres = colonnes.filter((c) => c !== principal && !c.masquerMobile);
            const contenu = (
              <>
                <div className="font-medium text-texte">{principal.render ? principal.render(row) : row[principal.key]}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {autres.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <dt className="text-legende text-texte-secondaire">{col.header}</dt>
                      <dd className="mt-0.5 break-words text-petit text-texte">{col.render ? col.render(row) : (row[col.key] ?? '—')}</dd>
                    </div>
                  ))}
                </dl>
              </>
            );
            return (
              <li key={cleLigne(row)}>
                {onLigne ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={libelleLigne ? libelleLigne(row) : undefined}
                    onClick={(e) => { if (!e.target.closest('a,button')) onLigne(row); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') onLigne(row); }}
                    className="block w-full p-4 text-left hover:bg-surface-alt"
                  >
                    {contenu}
                  </div>
                ) : <div className="p-4">{contenu}</div>}
              </li>
            );
          })}
      </ul>

      {estVide ? (vide || <EmptyState titre="Aucun résultat" message="Aucun élément ne correspond à ces critères." />) : null}
    </div>
  );
}
