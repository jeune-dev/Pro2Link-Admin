import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ChevronDown, ChevronRight, X } from 'lucide-react';
import { listerJournalAudit } from '../../services/auditService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Notice from '../../components/common/Notice.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { ErrorState } from '../../components/common/ErrorAlert.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import FilterBar, { FilterDate, SearchInput } from '../../components/tables/FilterBar.jsx';
import { formatDateHeure, idCourt } from '../../utils/format.js';

const DEFAUTS = { action: '', entity_type: '', company_id: '', user_id: '', du: '', au: '', page: '1', limit: '50' };

/**
 * Journal d'audit immuable, écrit par le serveur (GET /admin/journal-audit).
 * Lecture seule : rien n'est journalisé ni fabriqué côté navigateur.
 * Le contenu de `details` est affiché comme TEXTE (jamais interprété en HTML).
 */
export default function ActivityPage() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters(DEFAUTS);
  const { libelle } = useReferentiels();
  const [ouvert, setOuvert] = useState(null);
  const cle = JSON.stringify(filtres);
  const { data, error, loading, reload } = useApiQuery((s) => listerJournalAudit({ ...filtres, page: Number(filtres.page), limit: Number(filtres.limit) }, s), [cle]);
  const items = data?.items || [];

  return (
    <>
      <PageHeader
        titre="Activité et audit"
        ariane={[{ label: 'Activité et audit' }]}
        description="Actions importantes enregistrées par le serveur sur l’ensemble de la plateforme."
      />

      <Card corpsClassName="p-0">
        <FilterBar actifs={actifs} onReinitialiser={reinitialiser}>
          <SearchInput valeur={filtres.action} onChange={(action) => changer({ action })} placeholder="Action (ex. entreprise.)" label="Filtrer par action" />
          <SearchInput valeur={filtres.entity_type} onChange={(entity_type) => changer({ entity_type })} placeholder="Type de ressource (ex. company)" label="Filtrer par type de ressource" />
          <FilterDate label="Du" valeur={filtres.du} max={filtres.au || undefined} onChange={(du) => changer({ du })} />
          <FilterDate label="Au" valeur={filtres.au} min={filtres.du || undefined} onChange={(au) => changer({ au })} />
        </FilterBar>

        {filtres.company_id || filtres.user_id ? (
          <div className="flex flex-wrap gap-2 border-b border-bordure px-4 py-3">
            {filtres.company_id ? <Puce label={`Entreprise ${idCourt(filtres.company_id)}`} lien={`/entreprises/${filtres.company_id}`} onRetirer={() => changer({ company_id: '' })} /> : null}
            {filtres.user_id ? <Puce label={`Utilisateur ${idCourt(filtres.user_id)}`} lien={`/utilisateurs/${filtres.user_id}`} onRetirer={() => changer({ user_id: '' })} /> : null}
          </div>
        ) : null}

        {error ? <ErrorState erreur={error} onRetry={reload} /> : (
          <div className="overflow-x-auto" aria-busy={loading || undefined}>
            <table className="w-full min-w-[760px] text-left text-petit">
              <caption className="sr-only">Journal d’audit</caption>
              <thead>
                <tr className="border-b border-bordure bg-surface-alt/60 text-legende font-semibold uppercase tracking-wide text-texte-secondaire">
                  <th scope="col" className="w-8 px-3 py-3"><span className="sr-only">Détails</span></th>
                  <th scope="col" className="px-3 py-3">Date et heure</th>
                  <th scope="col" className="px-3 py-3">Utilisateur</th>
                  <th scope="col" className="px-3 py-3">Action</th>
                  <th scope="col" className="px-3 py-3">Ressource</th>
                  <th scope="col" className="px-3 py-3">Entreprise</th>
                  <th scope="col" className="px-3 py-3">Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-bordure">{[0, 1, 2, 3, 4, 5, 6].map((j) => <td key={j} className="px-3 py-3.5"><div className="squelette h-4" /></td>)}</tr>
                )) : items.map((a) => {
                  const deplie = ouvert === a.id;
                  return (
                    <Fragment key={a.id}>
                      <tr className="border-b border-bordure align-top hover:bg-surface-alt/50">
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setOuvert(deplie ? null : a.id)}
                            aria-expanded={deplie}
                            aria-label={deplie ? 'Masquer les détails' : 'Afficher les détails'}
                            className="rounded-petit p-0.5 text-texte-secondaire hover:bg-surface-alt"
                          >
                            {deplie ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-texte">{formatDateHeure(a.created_at)}</td>
                        <td className="px-3 py-3">
                          {a.user_id ? <Link to={`/utilisateurs/${a.user_id}`} className="font-mono text-legende text-primaire hover:underline">{idCourt(a.user_id)}</Link> : <span className="text-texte-discret">Système</span>}
                          <p className="text-legende text-texte-secondaire">{a.actor_role ? libelle('roles', a.actor_role) : '—'}</p>
                        </td>
                        <td className="px-3 py-3"><span className="rounded-petit bg-surface-alt px-1.5 py-0.5 font-mono text-legende text-texte">{a.action}</span></td>
                        <td className="px-3 py-3 text-texte-secondaire">
                          {a.entity_type || '—'}
                          {a.entity_id ? <span className="block font-mono text-legende text-texte-discret">{idCourt(a.entity_id)}</span> : null}
                        </td>
                        <td className="px-3 py-3">
                          {a.company_id ? <Link to={`/entreprises/${a.company_id}`} className="font-mono text-legende text-primaire hover:underline">{idCourt(a.company_id)}</Link> : <span className="text-texte-discret">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-legende text-texte-secondaire">{a.ip || '—'}</td>
                      </tr>
                      {deplie ? (
                        <tr className="border-b border-bordure bg-surface-alt/40">
                          <td />
                          <td colSpan={6} className="px-3 py-3">
                            <dl className="grid gap-2 text-legende sm:grid-cols-3">
                              <div><dt className="text-texte-secondaire">Identifiant de requête</dt><dd className="break-all font-mono text-texte">{a.request_id || '—'}</dd></div>
                              <div className="sm:col-span-2"><dt className="text-texte-secondaire">Navigateur / appareil</dt><dd className="break-all text-texte">{a.user_agent || '—'}</dd></div>
                            </dl>
                            <p className="mt-3 text-legende text-texte-secondaire">Détails enregistrés</p>
                            <pre className="mt-1 max-h-64 overflow-auto rounded-champ border border-bordure bg-surface p-3 font-mono text-legende text-texte">{JSON.stringify(a.details ?? {}, null, 2)}</pre>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!loading && !items.length ? <EmptyState icone={Activity} titre="Aucune action enregistrée" message={actifs ? 'Aucune action ne correspond à ces filtres.' : 'Le journal est vide.'} /> : null}
          </div>
        )}
        {!error ? <Pagination pagination={data?.pagination} limites={[20, 50, 100]} onPage={(page) => changer({ page: String(page) })} onLimit={(limit) => changer({ limit: String(limit) })} /> : null}
      </Card>

      <Notice className="mt-4">
        Le journal est immuable et alimenté uniquement par le serveur. L’API ne fournit pas de champ « résultat » distinct :
        seules les actions abouties y sont enregistrées, avec leurs détails.
      </Notice>
    </>
  );
}

function Puce({ label, lien, onRetirer }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-bordure bg-surface py-0.5 pl-3 pr-1 text-legende text-texte">
      <Link to={lien} className="hover:text-primaire">{label}</Link>
      <button type="button" onClick={onRetirer} className="rounded-full p-1 text-texte-secondaire hover:bg-surface-alt" aria-label={`Retirer le filtre ${label}`}>
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}
