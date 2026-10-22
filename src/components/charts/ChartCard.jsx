import { useState } from 'react';
import { BarChart3, Download, Table2 } from 'lucide-react';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { ErrorState } from '../common/ErrorAlert.jsx';
import { telechargerCsv } from '../../utils/csv.js';

/**
 * Cadre commun des graphiques : titre, légende (≥ 2 séries), bascule vers une
 * vue tableau (accessibilité, relief des couleurs à faible contraste) et export CSV.
 *
 * @param {{
 *   titre: string, description?: string, chargement?: boolean, erreur?: any, onRetry?: () => void,
 *   vide?: boolean, legende?: Array<{ label: string, couleur: string }>,
 *   tableau?: { colonnes: Array<{ header: string, value: (r) => any, align?: 'right' }>, lignes: any[] },
 *   exportNom?: string, hauteur?: number, children: React.ReactNode
 * }} props
 */
export default function ChartCard({
  titre, description, chargement, erreur, onRetry, vide, legende, tableau, exportNom, hauteur = 280, children, className = '',
}) {
  const [vueTableau, setVueTableau] = useState(false);
  const peutExporter = exportNom && tableau?.lignes?.length;

  const actions = (
    <>
      {tableau ? (
        <button
          type="button"
          onClick={() => setVueTableau((v) => !v)}
          aria-pressed={vueTableau}
          className="inline-flex items-center gap-1.5 rounded-champ px-2 py-1.5 text-legende font-medium text-texte-secondaire hover:bg-surface-alt hover:text-texte"
        >
          {vueTableau ? <BarChart3 className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
          {vueTableau ? 'Graphique' : 'Tableau'}
        </button>
      ) : null}
      {peutExporter ? (
        <button
          type="button"
          onClick={() => telechargerCsv(exportNom, tableau.colonnes, tableau.lignes)}
          className="inline-flex items-center gap-1.5 rounded-champ px-2 py-1.5 text-legende font-medium text-texte-secondaire hover:bg-surface-alt hover:text-texte"
        >
          <Download className="size-4" aria-hidden /> CSV
        </button>
      ) : null}
    </>
  );

  let contenu;
  if (chargement) contenu = <div className="squelette w-full" style={{ height: hauteur }} />;
  else if (erreur) contenu = <ErrorState erreur={erreur} onRetry={onRetry} compact />;
  else if (vide) contenu = <EmptyState compact titre="Aucune donnée sur la période" message="Les données apparaîtront dès que l’activité correspondante sera enregistrée." />;
  else if (vueTableau && tableau) {
    contenu = (
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-left text-petit">
          <caption className="sr-only">{titre}</caption>
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-bordure">
              {tableau.colonnes.map((c) => (
                <th key={c.header} scope="col" className={`px-3 py-2 text-legende font-semibold text-texte-secondaire ${c.align === 'right' ? 'text-right' : ''}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableau.lignes.map((l, i) => (
              <tr key={i} className="border-b border-bordure last:border-0">
                {tableau.colonnes.map((c) => (
                  <td key={c.header} className={`px-3 py-2 text-texte chiffres ${c.align === 'right' ? 'text-right' : ''}`}>{c.format ? c.format(c.value(l)) : c.value(l)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    contenu = (
      <>
        {legende && legende.length > 1 ? (
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Légende">
            {legende.map((l) => (
              <li key={l.label} className="flex items-center gap-2 text-legende text-texte-secondaire">
                <span className="size-2.5 rounded-sm" style={{ background: l.couleur }} aria-hidden />
                {l.label}
              </li>
            ))}
          </ul>
        ) : null}
        <div style={{ height: hauteur }} role="img" aria-label={`${titre}${description ? ` — ${description}` : ''}. Vue tableau disponible.`}>
          {children}
        </div>
      </>
    );
  }

  return (
    <Card titre={titre} description={description} actions={!chargement && !erreur && !vide ? actions : null} className={className}>
      {contenu}
    </Card>
  );
}
