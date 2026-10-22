import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Building2, RotateCcw } from 'lucide-react';
import { listerEntreprises, reactiverEntreprise, suspendreEntreprise } from '../../services/companyService.js';
import { listerPlans } from '../../services/planService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import FilterBar, { FilterSelect, SearchInput } from '../../components/tables/FilterBar.jsx';
import { OptionsReferentiel } from '../../components/forms/Field.jsx';
import { formatDate, formatNombre, initiales } from '../../utils/format.js';

const DEFAUTS = { q: '', status: '', type: '', sector: '', abonnement: '', plan: '', tri: '-created_at', page: '1', limit: '20' };

/** Le filtre `abonnement` de l'API accepte aussi « aucun » (pas d'abonnement). */
const AUCUN_ABONNEMENT = { code: 'aucun', label: 'Sans abonnement' };

export default function CompaniesPage() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters(DEFAUTS);
  const { options, libelle } = useReferentiels();
  const toast = useToast();
  const navigate = useNavigate();
  const [action, setAction] = useState(null); // { type: 'suspendre' | 'reactiver', entreprise }

  const cle = JSON.stringify(filtres);
  const liste = useApiQuery((s) => listerEntreprises({ ...filtres, page: Number(filtres.page), limit: Number(filtres.limit) }, s), [cle]);
  const plans = useApiQuery((s) => listerPlans({}, s), []);

  const colonnes = [
    {
      key: 'name', header: 'Entreprise', sortKey: 'name', principal: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          {/* Logo : servi par l'espace entreprise (/documents), inaccessible au super admin — initiales affichées. */}
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-champ bg-primaire-teinte text-legende font-semibold text-primaire md:flex" aria-hidden>{initiales(c.name)}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-texte">{c.name}</p>
            <p className="truncate text-legende text-texte-secondaire">{[c.city, c.email].filter(Boolean).join(' · ') || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (c) => libelle('type_entreprise', c.type) },
    { key: 'sector', header: 'Secteur', masquerMobile: true, render: (c) => (c.sector ? libelle('secteur_activite', c.sector) : '—') },
    { key: 'members_count', header: 'Membres', align: 'right', render: (c) => <span className="chiffres">{formatNombre(c.members_count)}</span> },
    {
      key: 'abonnement', header: 'Abonnement',
      render: (c) => (c.subscription_status ? (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge famille="abonnement" refKey="statut_abonnement" code={c.subscription_status} />
          <span className="text-legende text-texte-secondaire">{c.plan_code}{c.current_period_end ? ` · fin ${formatDate(c.current_period_end)}` : ''}</span>
        </div>
      ) : <span className="text-texte-discret">Aucun</span>),
    },
    { key: 'status', header: 'Statut', render: (c) => <StatusBadge famille="entreprise" refKey="statut_entreprise" code={c.status} /> },
    { key: 'created_at', header: 'Inscrite le', sortKey: 'created_at', render: (c) => <span className="whitespace-nowrap">{formatDate(c.created_at)}</span> },
    {
      key: 'actions', header: 'Actions', masquerMobile: false,
      render: (c) => (c.status === 'suspendu' ? (
        <button type="button" onClick={() => setAction({ type: 'reactiver', entreprise: c })} className="inline-flex items-center gap-1.5 rounded-champ px-2 py-1 text-petit font-medium text-primaire hover:bg-primaire-teinte">
          <RotateCcw className="size-4" aria-hidden /> Réactiver
        </button>
      ) : (
        <button type="button" onClick={() => setAction({ type: 'suspendre', entreprise: c })} className="inline-flex items-center gap-1.5 rounded-champ px-2 py-1 text-petit font-medium text-danger hover:bg-danger-fond">
          <Ban className="size-4" aria-hidden /> Suspendre
        </button>
      )),
    },
  ];

  async function confirmer({ reason }) {
    const { type, entreprise } = action;
    const { message } = type === 'suspendre'
      ? await suspendreEntreprise(entreprise.id, reason)
      : await reactiverEntreprise(entreprise.id);
    toast.succes(message);
    setAction(null);
    liste.reload();
  }

  const e = action?.entreprise;

  return (
    <>
      <PageHeader
        titre="Entreprises"
        ariane={[{ label: 'Entreprises' }]}
        description="Entreprises clientes de la plateforme : profil, abonnement et statut du compte."
      />

      <Card corpsClassName="p-0">
        <FilterBar actifs={actifs} onReinitialiser={reinitialiser}>
          <SearchInput valeur={filtres.q} onChange={(q) => changer({ q })} placeholder="Nom, e-mail, NINEA…" label="Rechercher une entreprise" />
          <FilterSelect label="Statut" valeur={filtres.status} onChange={(status) => changer({ status })}>
            <OptionsReferentiel options={options('statut_entreprise')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Type" valeur={filtres.type} onChange={(type) => changer({ type })}>
            <OptionsReferentiel options={options('type_entreprise')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Secteur" valeur={filtres.sector} onChange={(sector) => changer({ sector })}>
            <OptionsReferentiel options={options('secteur_activite')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Abonnement" valeur={filtres.abonnement} onChange={(abonnement) => changer({ abonnement })}>
            <OptionsReferentiel options={[...options('statut_abonnement'), AUCUN_ABONNEMENT]} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Forfait" valeur={filtres.plan} onChange={(plan) => changer({ plan })}>
            <option value="">Tous</option>
            {(plans.data?.plans || []).map((p) => <option key={p.id} value={p.code}>{p.name}</option>)}
          </FilterSelect>
        </FilterBar>

        <DataTable
          caption="Liste des entreprises"
          colonnes={colonnes}
          lignes={liste.data?.items}
          chargement={liste.loading}
          erreur={liste.error}
          onRetry={liste.reload}
          tri={filtres.tri}
          onTri={(tri) => changer({ tri })}
          onLigne={(c) => navigate(`/entreprises/${c.id}`)}
          libelleLigne={(c) => `Ouvrir la fiche de ${c.name}`}
          vide={<EmptyState icone={Building2} titre="Aucune entreprise" message={actifs ? 'Aucune entreprise ne correspond à ces filtres.' : 'Aucune entreprise n’est encore inscrite.'} />}
        />
        {!liste.error ? (
          <Pagination
            pagination={liste.data?.pagination}
            onPage={(page) => changer({ page: String(page) })}
            onLimit={(limit) => changer({ limit: String(limit) })}
          />
        ) : null}
      </Card>

      <p className="mt-3 text-legende text-texte-discret">
        Le filtre par date d’inscription n’est pas proposé par l’API : triez par « Inscrite le » pour retrouver les plus récentes.
      </p>

      <ActionDialog
        ouvert={Boolean(action)}
        onFermer={() => setAction(null)}
        titre={action?.type === 'suspendre' ? 'Suspendre l’entreprise ?' : 'Réactiver l’entreprise ?'}
        contexte={e ? (
          <>
            <p className="font-semibold">{e.name}</p>
            <p className="text-texte-secondaire">{formatNombre(e.members_count)} membre(s) · {libelle('type_entreprise', e.type)}</p>
            <p className="mt-2 text-texte-secondaire">
              {action.type === 'suspendre'
                ? 'Les membres de cette entreprise perdront l’accès à leur espace tant que la suspension est active.'
                : 'Les membres de cette entreprise retrouveront l’accès à leur espace.'}
            </p>
          </>
        ) : null}
        motif={action?.type === 'suspendre' ? 'obligatoire' : null}
        ton={action?.type === 'suspendre' ? 'danger' : 'primaire'}
        libelleConfirmer={action?.type === 'suspendre' ? 'Suspendre' : 'Réactiver'}
        onConfirmer={confirmer}
      />
    </>
  );
}
