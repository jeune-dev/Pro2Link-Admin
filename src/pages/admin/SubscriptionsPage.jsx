import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Ban, CreditCard, Eye, Layers, Pencil, Plus, Power, PowerOff, Receipt, RotateCcw, Trash2, XCircle } from 'lucide-react';
import {
  annulerAbonnement, getAbonnement, listerAbonnements, listerPaiementsAbonnements, reactiverAbonnement, suspendreAbonnement,
} from '../../services/subscriptionService.js';
import { activerPlan, desactiverPlan, listerPlans, supprimerPlan } from '../../services/planService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { DetailList } from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Tabs from '../../components/common/Tabs.jsx';
import Modal from '../../components/common/Modal.jsx';
import Notice from '../../components/common/Notice.jsx';
import StatusBadge, { Badge } from '../../components/common/StatusBadge.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { ErrorState } from '../../components/common/ErrorAlert.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import FilterBar, { FilterDate, FilterSelect } from '../../components/tables/FilterBar.jsx';
import { OptionsReferentiel } from '../../components/forms/Field.jsx';
import ActivateSubscriptionDialog from '../../components/admin/ActivateSubscriptionDialog.jsx';
import PlanFormDialog from '../../components/admin/PlanFormDialog.jsx';
import { formatDate, formatDateHeure, formatMontant, formatNombre } from '../../utils/format.js';

const ONGLETS = [
  { id: 'abonnements', label: 'Abonnements', icone: CreditCard },
  { id: 'paiements', label: 'Paiements', icone: Receipt },
  { id: 'forfaits', label: 'Forfaits', icone: Layers },
];

/** Moyens de paiement d'abonnement renvoyés par l'API (`provider`). */
const PROVIDERS = [{ code: 'manuel', label: 'Manuel' }, { code: 'paydunya', label: 'PayDunya' }];
const libelleProvider = (c) => PROVIDERS.find((p) => p.code === c)?.label || c;

export default function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const onglet = ONGLETS.some((o) => o.id === params.get('onglet')) ? params.get('onglet') : 'abonnements';

  return (
    <>
      <PageHeader
        titre="Abonnements"
        ariane={[{ label: 'Abonnements' }]}
        description="Abonnements SaaS des entreprises, paiements d’abonnement et configuration des forfaits."
      />
      <div className="mb-5">
        <Tabs label="Sections des abonnements" onglets={ONGLETS} actif={onglet} onChange={(id) => setParams(id === 'abonnements' ? {} : { onglet: id })} />
      </div>
      {onglet === 'abonnements' ? <OngletAbonnements /> : null}
      {onglet === 'paiements' ? <OngletPaiements /> : null}
      {onglet === 'forfaits' ? <OngletForfaits /> : null}
    </>
  );
}

/* ─────────────────────────── Abonnements ─────────────────────────── */

const DEFAUTS_ABO = { status: '', plan: '', company_id: '', fin_avant: '', tri: '-created_at', page: '1', limit: '20' };

function OngletAbonnements() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters(DEFAUTS_ABO);
  const { options, libelle } = useReferentiels();
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState(null); // { type, abo }
  const [renouveler, setRenouveler] = useState(null);

  const requete = filtres;
  const cle = JSON.stringify(requete);
  const liste = useApiQuery((s) => listerAbonnements({ ...requete, page: Number(filtres.page), limit: Number(filtres.limit) }, s), [cle]);
  const plans = useApiQuery((s) => listerPlans({}, s), []);

  const colonnes = [
    {
      key: 'company', header: 'Entreprise', principal: true,
      render: (a) => (
        <Link to={`/entreprises/${a.company_id}`} className="font-semibold text-texte hover:text-primaire">{a.company?.name || 'Entreprise'}</Link>
      ),
    },
    { key: 'plan', header: 'Forfait', render: (a) => (a.plan ? <span>{a.plan.name} <span className="font-mono text-legende text-texte-discret">{a.plan.code}</span></span> : '—') },
    { key: 'status', header: 'Statut', render: (a) => <StatusBadge famille="abonnement" refKey="statut_abonnement" code={a.status} /> },
    { key: 'periode', header: 'Période en cours', render: (a) => <span className="whitespace-nowrap">{formatDate(a.current_period_start)} → {formatDate(a.current_period_end)}</span> },
    { key: 'current_period_end', header: 'Échéance', sortKey: 'current_period_end', masquerMobile: true, render: (a) => formatDate(a.current_period_end) },
    { key: 'trial', header: 'Fin d’essai', masquerMobile: true, render: (a) => (a.trial_ends_at ? formatDate(a.trial_ends_at) : '—') },
    { key: 'created_at', header: 'Créé le', sortKey: 'created_at', render: (a) => formatDate(a.created_at) },
    {
      key: 'actions', header: 'Actions',
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          <IconAction icone={Eye} label="Détail" onClick={() => setDetail(a.id)} />
          <IconAction icone={RotateCcw} label="Renouveler / changer de forfait" onClick={() => setRenouveler(a)} />
          {['actif', 'essai'].includes(a.status) ? <IconAction icone={Ban} label="Suspendre" danger onClick={() => setAction({ type: 'suspendre', abo: a })} /> : null}
          {a.status === 'suspendu' ? <IconAction icone={Power} label="Rétablir" onClick={() => setAction({ type: 'reactiver', abo: a })} /> : null}
          {!['annule', 'expire'].includes(a.status) ? <IconAction icone={XCircle} label="Annuler" danger onClick={() => setAction({ type: 'annuler', abo: a })} /> : null}
        </div>
      ),
    },
  ];

  const CONF = {
    suspendre: { titre: 'Suspendre l’abonnement ?', libelle: 'Suspendre', ton: 'danger', motif: 'obligatoire', texte: 'L’espace de l’entreprise passe en lecture seule (402 ABONNEMENT_REQUIS) jusqu’au rétablissement.' },
    reactiver: { titre: 'Rétablir l’abonnement ?', libelle: 'Rétablir', texte: 'L’entreprise retrouve un accès complet en écriture.' },
    annuler: { titre: 'Annuler l’abonnement ?', libelle: 'Annuler l’abonnement', ton: 'danger', motif: 'facultatif', texte: 'L’abonnement est clôturé. Une nouvelle activation sera nécessaire pour le reprendre.' },
  };
  const conf = action ? CONF[action.type] : null;

  async function confirmer({ reason }) {
    const { type, abo } = action;
    const res = type === 'suspendre' ? await suspendreAbonnement(abo.id, reason)
      : type === 'reactiver' ? await reactiverAbonnement(abo.id)
        : await annulerAbonnement(abo.id, reason);
    toast.succes(res.message);
    setAction(null);
    liste.reload();
  }

  return (
    <>
      <Card corpsClassName="p-0">
        <FilterBar actifs={actifs} onReinitialiser={reinitialiser}>
          <FilterSelect label="Statut" valeur={filtres.status} onChange={(status) => changer({ status })}>
            <OptionsReferentiel options={options('statut_abonnement')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Forfait" valeur={filtres.plan} onChange={(plan) => changer({ plan })}>
            <option value="">Tous</option>
            {(plans.data?.plans || []).map((p) => <option key={p.id} value={p.code}>{p.name}</option>)}
          </FilterSelect>
          <FilterDate label="Échéance avant le" valeur={filtres.fin_avant} onChange={(fin_avant) => changer({ fin_avant })} />
          {filtres.company_id ? (
            <div className="flex flex-col gap-1">
              <span className="text-legende font-medium text-texte-secondaire">Entreprise</span>
              <button type="button" onClick={() => changer({ company_id: '' })} className="inline-flex min-h-10 items-center gap-2 rounded-champ border border-bordure px-3 text-petit text-texte hover:bg-surface-alt">
                Entreprise filtrée <XCircle className="size-4" aria-label="Retirer" />
              </button>
            </div>
          ) : null}
        </FilterBar>
        <DataTable
          caption="Liste des abonnements"
          colonnes={colonnes}
          lignes={liste.data?.items}
          chargement={liste.loading}
          erreur={liste.error}
          onRetry={liste.reload}
          tri={filtres.tri}
          onTri={(tri) => changer({ tri })}
          vide={<EmptyState icone={CreditCard} titre="Aucun abonnement" message="Aucun abonnement ne correspond à ces critères." />}
        />
        {!liste.error ? <Pagination pagination={liste.data?.pagination} onPage={(page) => changer({ page: String(page) })} onLimit={(limit) => changer({ limit: String(limit) })} /> : null}
      </Card>

      <DetailAbonnement id={detail} onFermer={() => setDetail(null)} libelle={libelle} />

      <ActionDialog
        ouvert={Boolean(action)}
        onFermer={() => setAction(null)}
        titre={conf?.titre}
        contexte={action ? (
          <>
            <p className="font-semibold">{action.abo.company?.name} · {action.abo.plan?.name}</p>
            <p className="mt-1 text-texte-secondaire">{conf.texte}</p>
          </>
        ) : null}
        motif={conf?.motif || null}
        ton={conf?.ton}
        libelleConfirmer={conf?.libelle || 'Confirmer'}
        onConfirmer={confirmer}
      />

      <ActivateSubscriptionDialog
        ouvert={Boolean(renouveler)}
        onFermer={() => setRenouveler(null)}
        entreprise={renouveler ? { id: renouveler.company_id, name: renouveler.company?.name } : null}
        planActuel={renouveler?.plan?.code}
        onSucces={({ message }) => { toast.succes(message); setRenouveler(null); liste.reload(); }}
      />
    </>
  );
}

function IconAction({ icone: Icone, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-champ p-1.5 ${danger ? 'text-danger hover:bg-danger-fond' : 'text-texte-secondaire hover:bg-primaire-teinte hover:text-primaire'}`}
    >
      <Icone className="size-4" aria-hidden />
    </button>
  );
}

function DetailAbonnement({ id, onFermer, libelle }) {
  const { data, error, loading, reload } = useApiQuery((s) => getAbonnement(id, s), [id], { enabled: Boolean(id) });
  const a = data?.subscription;
  return (
    <Modal ouvert={Boolean(id)} onFermer={onFermer} large titre="Détail de l’abonnement" description={a?.company?.name}>
      {loading ? <div className="py-10 text-center text-primaire"><Spinner label="Chargement…" /></div> : null}
      {error ? <ErrorState erreur={error} onRetry={reload} compact /> : null}
      {a && !loading ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge famille="abonnement" refKey="statut_abonnement" code={a.status} />
            <span className="text-petit text-texte-secondaire">{a.plan?.name} · {formatMontant(a.plan?.price)} / {libelle('periode_facturation', a.plan?.billing_period).toLowerCase()}</span>
          </div>
          <DetailList
            items={[
              { label: 'Période en cours', value: `${formatDate(a.current_period_start)} → ${formatDate(a.current_period_end)}` },
              { label: 'Fin de la période d’essai', value: a.trial_ends_at ? formatDate(a.trial_ends_at) : null },
              { label: 'Souscrit le', value: formatDateHeure(a.started_at) },
              { label: 'Annulé le', value: a.cancelled_at ? formatDateHeure(a.cancelled_at) : null },
              { label: 'Motif de suspension', value: a.suspended_reason, large: true },
            ]}
          />
          <div>
            <h3 className="mb-2 text-petit font-semibold text-texte">Paiements ({a.payments?.length || 0})</h3>
            {a.payments?.length ? (
              <ul className="divide-y divide-bordure rounded-champ border border-bordure">
                {a.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-petit">
                    <span className="font-mono text-legende text-texte">{p.reference}</span>
                    <span className="text-texte-secondaire">{p.plan?.name} · {p.months} mois · {libelleProvider(p.provider)}</span>
                    <span className="ml-auto font-semibold text-texte chiffres">{formatMontant(p.amount, p.currency)}</span>
                    <StatusBadge famille="paiementAbonnement" refKey="statut_paiement_abonnement" code={p.status} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-petit text-texte-secondaire">Aucun paiement enregistré.</p>}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

/* ─────────────────────────── Paiements ─────────────────────────── */

const DEFAUTS_PAIEMENTS = { status: '', provider: '', du: '', au: '', tri: '-created_at', page: '1', limit: '20' };

function OngletPaiements() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters(DEFAUTS_PAIEMENTS);
  const { options } = useReferentiels();
  const requete = filtres;
  const cle = JSON.stringify(requete);
  const liste = useApiQuery((s) => listerPaiementsAbonnements({ ...requete, page: Number(filtres.page), limit: Number(filtres.limit) }, s), [cle]);

  const colonnes = [
    { key: 'reference', header: 'Référence', principal: true, render: (p) => <span className="font-mono text-legende font-semibold text-texte">{p.reference}</span> },
    { key: 'company', header: 'Entreprise', render: (p) => (p.company ? <Link to={`/entreprises/${p.company.id}`} className="hover:text-primaire">{p.company.name}</Link> : '—') },
    { key: 'plan', header: 'Forfait', render: (p) => p.plan?.name || '—' },
    { key: 'months', header: 'Durée', align: 'right', render: (p) => `${p.months} mois` },
    { key: 'amount', header: 'Montant', sortKey: 'amount', align: 'right', render: (p) => <span className="font-semibold chiffres">{formatMontant(p.amount, p.currency)}</span> },
    { key: 'provider', header: 'Moyen', render: (p) => libelleProvider(p.provider) },
    { key: 'status', header: 'Statut', render: (p) => <StatusBadge famille="paiementAbonnement" refKey="statut_paiement_abonnement" code={p.status} /> },
    { key: 'created_at', header: 'Date', sortKey: 'created_at', render: (p) => <span className="whitespace-nowrap">{formatDateHeure(p.paid_at || p.created_at)}</span> },
  ];

  return (
    <Card corpsClassName="p-0">
      <FilterBar actifs={actifs} onReinitialiser={reinitialiser}>
        <FilterSelect label="Statut" valeur={filtres.status} onChange={(status) => changer({ status })}>
          <OptionsReferentiel options={options('statut_paiement_abonnement')} vide="Tous" />
        </FilterSelect>
        <FilterSelect label="Moyen" valeur={filtres.provider} onChange={(provider) => changer({ provider })}>
          <OptionsReferentiel options={PROVIDERS} vide="Tous" />
        </FilterSelect>
        <FilterDate label="Du" valeur={filtres.du} max={filtres.au || undefined} onChange={(du) => changer({ du })} />
        <FilterDate label="Au" valeur={filtres.au} min={filtres.du || undefined} onChange={(au) => changer({ au })} />
      </FilterBar>
      <DataTable
        caption="Paiements d’abonnement"
        colonnes={colonnes}
        lignes={liste.data?.items}
        chargement={liste.loading}
        erreur={liste.error}
        onRetry={liste.reload}
        tri={filtres.tri}
        onTri={(tri) => changer({ tri })}
        vide={<EmptyState icone={Receipt} titre="Aucun paiement" message="Aucun paiement d’abonnement sur ces critères." />}
      />
      {!liste.error ? <Pagination pagination={liste.data?.pagination} onPage={(page) => changer({ page: String(page) })} onLimit={(limit) => changer({ limit: String(limit) })} /> : null}
    </Card>
  );
}

/* ─────────────────────────── Forfaits ─────────────────────────── */

function OngletForfaits() {
  const [statut, setStatut] = useState('');
  const { data, error, loading, reload } = useApiQuery((s) => listerPlans({ status: statut }, s), [statut]);
  const { libelle } = useReferentiels();
  const toast = useToast();
  const [formulaire, setFormulaire] = useState(null); // { plan } | { plan: null }
  const [action, setAction] = useState(null); // { type, plan }

  const plans = data?.plans || [];

  async function confirmer() {
    const { type, plan } = action;
    const res = type === 'activer' ? await activerPlan(plan.id) : type === 'desactiver' ? await desactiverPlan(plan.id) : await supprimerPlan(plan.id);
    toast.succes(res.message);
    setAction(null);
    reload();
  }

  const limites = (p) => [
    ['Utilisateurs', p.max_users], ['Produits', p.max_products], ['Partenaires', p.max_partners], ['Commandes / mois', p.max_orders_per_month],
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <FilterSelect label="Statut des forfaits" valeur={statut} onChange={setStatut}>
          <option value="">Tous</option>
          <option value="actif">{libelle('statut_plan', 'actif')}</option>
          <option value="inactif">{libelle('statut_plan', 'inactif')}</option>
        </FilterSelect>
        <Button variante="secondaire" icone={Plus} onClick={() => setFormulaire({ plan: null })}>Nouveau forfait</Button>
      </div>

      <Notice className="mb-5">
        Les tarifs et les formules commerciales sont définis par l’équipe Pro2Link : cette interface n’en propose aucun par défaut.
        Les forfaits affichés sont ceux enregistrés dans l’API.
      </Notice>

      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="squelette h-64 rounded-carte" />)}</div> : null}
      {error ? <Card><ErrorState erreur={error} onRetry={reload} /></Card> : null}
      {!loading && !error && !plans.length ? (
        <Card><EmptyState icone={Layers} titre="Aucun forfait" message="Créez un premier forfait lorsque l’offre commerciale sera définie." /></Card>
      ) : null}

      {!loading && plans.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <li key={p.id} className="flex flex-col rounded-carte border border-bordure bg-surface p-5 shadow-douce">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sous-titre font-semibold text-texte">{p.name}</p>
                  <p className="font-mono text-legende text-texte-discret">{p.code}</p>
                </div>
                <StatusBadge famille="plan" refKey="statut_plan" code={p.status} />
              </div>
              <p className="mt-4 text-titre font-semibold text-texte chiffres">
                {formatMontant(p.price, p.currency)}
                <span className="text-petit font-normal text-texte-secondaire"> / {libelle('periode_facturation', p.billing_period).toLowerCase()}</span>
              </p>
              {p.description ? <p className="mt-2 text-petit text-texte-secondaire">{p.description}</p> : null}
              <dl className="mt-4 grid grid-cols-2 gap-2 text-petit">
                {limites(p).map(([k, v]) => (
                  <div key={k} className="rounded-petit bg-surface-alt px-2.5 py-1.5">
                    <dt className="text-legende text-texte-secondaire">{k}</dt>
                    <dd className="font-semibold text-texte chiffres">{v === null || v === undefined ? 'Illimité' : formatNombre(v)}</dd>
                  </div>
                ))}
              </dl>
              {p.features?.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.features.map((f) => <li key={f}><Badge ton="info" icone={false}>{libelle('fonctionnalite', f)}</Badge></li>)}
                </ul>
              ) : null}
              <p className="mt-4 text-legende text-texte-secondaire">{formatNombre(p.subscribers_count ?? 0)} abonné(s)</p>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-bordure pt-4">
                <Button variante="neutre" taille="sm" icone={Pencil} onClick={() => setFormulaire({ plan: p })}>Modifier</Button>
                {p.status === 'actif'
                  ? <Button variante="neutre" taille="sm" icone={PowerOff} onClick={() => setAction({ type: 'desactiver', plan: p })}>Désactiver</Button>
                  : <Button variante="neutre" taille="sm" icone={Power} onClick={() => setAction({ type: 'activer', plan: p })}>Activer</Button>}
                <Button variante="danger-contour" taille="sm" icone={Trash2} onClick={() => setAction({ type: 'supprimer', plan: p })}>Supprimer</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <PlanFormDialog
        ouvert={Boolean(formulaire)}
        plan={formulaire?.plan || null}
        onFermer={() => setFormulaire(null)}
        onSucces={({ message }) => { toast.succes(message); setFormulaire(null); reload(); }}
      />

      <ActionDialog
        ouvert={Boolean(action)}
        onFermer={() => setAction(null)}
        titre={action?.type === 'supprimer' ? 'Supprimer ce forfait ?' : action?.type === 'desactiver' ? 'Désactiver ce forfait ?' : 'Activer ce forfait ?'}
        contexte={action ? (
          <>
            <p className="font-semibold">{action.plan.name} ({action.plan.code})</p>
            <p className="mt-1 text-texte-secondaire">
              {action.type === 'supprimer' && 'Suppression définitive. L’API la refuse si le forfait est utilisé.'}
              {action.type === 'desactiver' && 'Le forfait ne sera plus proposé. Les abonnements existants ne sont pas modifiés ; le forfait d’essai ne peut pas être désactivé.'}
              {action.type === 'activer' && 'Le forfait pourra être proposé et attribué aux entreprises.'}
            </p>
          </>
        ) : null}
        ton={action?.type === 'activer' ? 'primaire' : 'danger'}
        libelleConfirmer={action?.type === 'supprimer' ? 'Supprimer' : action?.type === 'desactiver' ? 'Désactiver' : 'Activer'}
        onConfirmer={confirmer}
      />
    </>
  );
}
