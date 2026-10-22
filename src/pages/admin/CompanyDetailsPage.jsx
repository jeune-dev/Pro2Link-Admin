import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, Ban, Boxes, ClipboardList, CreditCard, Handshake, RotateCcw, Users } from 'lucide-react';
import { getEntreprise, reactiverEntreprise, suspendreEntreprise } from '../../services/companyService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { DetailList } from '../../components/common/Card.jsx';
import Button, { ButtonLink } from '../../components/common/Button.jsx';
import StatusBadge, { Badge } from '../../components/common/StatusBadge.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import Notice from '../../components/common/Notice.jsx';
import { ErrorState } from '../../components/common/ErrorAlert.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import ActivateSubscriptionDialog from '../../components/admin/ActivateSubscriptionDialog.jsx';
import { formatDate, formatDateHeure, formatMontant, formatNombre, formatRelatif, initiales, nomComplet } from '../../utils/format.js';

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApiQuery((s) => getEntreprise(id, s), [id]);
  const { libelle } = useReferentiels();
  const toast = useToast();
  const [dialogue, setDialogue] = useState(null); // 'suspendre' | 'reactiver' | 'abonnement'

  const c = data?.company;

  if (loading && !c) return <PageSpinner />;
  if (error && !c) {
    return (
      <>
        <PageHeader titre="Entreprise" ariane={[{ label: 'Entreprises', to: '/entreprises' }, { label: 'Fiche' }]} />
        <Card><ErrorState erreur={error} onRetry={reload} /></Card>
        <ButtonLink to="/entreprises" variante="neutre" className="mt-4">Retour à la liste</ButtonLink>
      </>
    );
  }
  if (!c) return null;

  const abo = c.subscription;
  const suspendue = c.status === 'suspendu';

  async function confirmerStatut({ reason }) {
    const { message } = dialogue === 'suspendre' ? await suspendreEntreprise(c.id, reason) : await reactiverEntreprise(c.id);
    toast.succes(message);
    setDialogue(null);
    reload();
  }

  const colonnesMembres = [
    {
      key: 'nom', header: 'Utilisateur', principal: true,
      render: (m) => (
        <Link to={`/utilisateurs/${m.user?.id}`} className="group block min-w-0">
          <span className="block font-semibold text-texte group-hover:text-primaire">{nomComplet(m.user)}</span>
          <span className="block truncate text-legende text-texte-secondaire">{m.user?.email || m.user?.phone || '—'}</span>
        </Link>
      ),
    },
    { key: 'role', header: 'Rôle dans l’entreprise', render: (m) => libelle('roles_entreprise', m.role_code) },
    { key: 'status', header: 'Statut', render: (m) => <StatusBadge famille="membre" refKey="statut_membre" code={m.status} /> },
    { key: 'login', header: 'Dernière connexion', render: (m) => (m.user?.last_login_at ? formatRelatif(m.user.last_login_at) : 'Jamais') },
    { key: 'depuis', header: 'Membre depuis', render: (m) => formatDate(m.created_at) },
  ];

  return (
    <>
      <PageHeader
        titre={c.name}
        ariane={[{ label: 'Entreprises', to: '/entreprises' }, { label: c.name }]}
        badge={<StatusBadge famille="entreprise" refKey="statut_entreprise" code={c.status} />}
        description={[libelle('type_entreprise', c.type), c.sector ? libelle('secteur_activite', c.sector) : null, `inscrite le ${formatDate(c.created_at)}`].filter(Boolean).join(' · ')}
        actions={(
          <>
            <Button variante="neutre" icone={CreditCard} onClick={() => setDialogue('abonnement')}>Activer / renouveler l’abonnement</Button>
            {suspendue
              ? <Button icone={RotateCcw} onClick={() => setDialogue('reactiver')}>Réactiver</Button>
              : <Button variante="danger-contour" icone={Ban} onClick={() => setDialogue('suspendre')}>Suspendre</Button>}
          </>
        )}
      />

      {suspendue && c.suspended_reason ? (
        <Notice ton="avertissement" titre="Entreprise suspendue" className="mb-6">Motif : {c.suspended_reason}</Notice>
      ) : null}

      <section aria-label="Indicateurs de l’entreprise" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Membres', valeur: c.members_count, icone: Users },
          { label: 'Partenaires', valeur: c.partners_count, icone: Handshake },
          { label: 'Produits', valeur: c.products_count, icone: Boxes },
          { label: 'Commandes', valeur: c.orders_count, icone: ClipboardList },
        ].map(({ label, valeur, icone: Icone }) => (
          <div key={label} className="flex items-center gap-4 rounded-carte border border-bordure bg-surface p-4">
            <span className="flex size-10 items-center justify-center rounded-champ bg-primaire-teinte text-primaire"><Icone className="size-5" aria-hidden /></span>
            <div>
              <p className="text-petit text-texte-secondaire">{label}</p>
              <p className="text-titre font-semibold text-texte chiffres">{formatNombre(valeur)}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card titre="Informations professionnelles">
            <div className="mb-5 flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-carte bg-primaire-teinte text-sous-titre font-semibold text-primaire" aria-hidden>{initiales(c.name)}</span>
              <div>
                <p className="font-semibold text-texte">{c.legal_name || c.name}</p>
                <p className="text-legende text-texte-secondaire">
                  {c.logo_document_id ? 'Logo déposé (non consultable depuis le back-office)' : 'Aucun logo déposé'}
                </p>
              </div>
            </div>
            <DetailList
              items={[
                { label: 'Nom commercial', value: c.name },
                { label: 'Raison sociale', value: c.legal_name },
                { label: 'NINEA', value: c.ninea },
                { label: 'RCCM', value: c.rccm },
                { label: 'Régime fiscal', value: c.tax_regime ? libelle('regime_fiscal', c.tax_regime) : null },
                { label: 'Assujettie à la TVA', value: c.vat_registered === undefined ? null : c.vat_registered ? `Oui · taux par défaut ${c.default_tax_rate} %` : 'Non' },
                { label: 'Devise', value: c.currency === 'XOF' ? 'Franc CFA (XOF)' : c.currency },
                { label: 'Visible dans l’annuaire', value: c.is_listed ? 'Oui' : 'Non' },
                { label: 'Description', value: c.description, large: true },
              ]}
            />
          </Card>

          <Card titre="Coordonnées">
            <DetailList
              items={[
                { label: 'Adresse', value: c.address },
                { label: 'Ville', value: [c.city, c.country].filter(Boolean).join(', ') },
                { label: 'Téléphone', value: c.phone ? <a href={`tel:${c.phone}`} className="text-primaire hover:underline">{c.phone}</a> : null },
                { label: 'E-mail', value: c.email ? <a href={`mailto:${c.email}`} className="text-primaire hover:underline">{c.email}</a> : null },
                { label: 'Site web', value: c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primaire hover:underline">{c.website}</a> : null },
              ]}
            />
          </Card>

          <Card titre="Utilisateurs associés" description={`${formatNombre(c.members?.length ?? 0)} membre(s) · rôles internes de l’entreprise`} corpsClassName="p-0">
            <DataTable colonnes={colonnesMembres} lignes={c.members || []} caption="Membres de l’entreprise" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            titre="Abonnement"
            actions={abo ? <Link to={`/abonnements?company_id=${c.id}`} className="text-petit font-semibold text-primaire hover:underline">Historique</Link> : null}
          >
            {abo ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sous-titre font-semibold text-texte">{abo.plan?.name || c.plan_code}</p>
                    {abo.plan ? (
                      <p className="text-petit text-texte-secondaire">{formatMontant(abo.plan.price)} / {libelle('periode_facturation', abo.plan.billing_period).toLowerCase()}</p>
                    ) : null}
                  </div>
                  <StatusBadge famille="abonnement" refKey="statut_abonnement" code={abo.status} />
                </div>
                <DetailList
                  colonnes={1}
                  items={[
                    { label: 'Période en cours', value: `${formatDate(abo.current_period_start)} → ${formatDate(abo.current_period_end)}` },
                    { label: 'Fin de la période d’essai', value: abo.trial_ends_at ? formatDate(abo.trial_ends_at) : null },
                    { label: 'Souscrit le', value: formatDateHeure(abo.started_at) },
                    abo.suspended_reason ? { label: 'Motif de suspension', value: abo.suspended_reason } : null,
                    abo.cancelled_at ? { label: 'Annulé le', value: formatDateHeure(abo.cancelled_at) } : null,
                  ]}
                />
              </div>
            ) : (
              <p className="text-petit text-texte-secondaire">Aucun abonnement pour cette entreprise.</p>
            )}
          </Card>

          <Card titre="Activité commerciale">
            <DetailList
              colonnes={1}
              items={[
                { label: 'Bons de commande émis (achats)', value: formatNombre(c.activity?.purchase_orders) },
                { label: 'Commandes reçues (ventes)', value: formatNombre(c.activity?.sales_orders) },
                { label: 'Factures émises', value: formatNombre(c.activity?.invoices_issued) },
                { label: 'Dernière commande', value: c.activity?.last_order_at ? formatDateHeure(c.activity.last_order_at) : 'Aucune' },
              ]}
            />
            <p className="mt-4 text-legende text-texte-discret">Compteurs fournis par l’API ; le détail des commandes reste propre à l’entreprise.</p>
          </Card>

          <Card titre="Paramètres et journal">
            <div className="space-y-3 text-petit">
              <p className="flex items-center gap-2 text-texte-secondaire">
                Paramètres de l’entreprise :
                <Badge ton={c.settings_customized ? 'info' : 'neutre'} icone={false}>{c.settings_customized ? 'personnalisés' : 'par défaut'}</Badge>
              </p>
              <ButtonLink to={`/activite?company_id=${c.id}`} variante="neutre" taille="sm" icone={Activity}>Voir le journal d’audit de l’entreprise</ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      <ActionDialog
        ouvert={dialogue === 'suspendre' || dialogue === 'reactiver'}
        onFermer={() => setDialogue(null)}
        titre={dialogue === 'suspendre' ? 'Suspendre l’entreprise ?' : 'Réactiver l’entreprise ?'}
        contexte={(
          <>
            <p className="font-semibold">{c.name}</p>
            <p className="mt-1 text-texte-secondaire">
              {dialogue === 'suspendre'
                ? `Les ${formatNombre(c.members_count)} membre(s) perdront l’accès à leur espace tant que la suspension est active.`
                : 'Les membres retrouveront l’accès à leur espace.'}
            </p>
          </>
        )}
        motif={dialogue === 'suspendre' ? 'obligatoire' : null}
        ton={dialogue === 'suspendre' ? 'danger' : 'primaire'}
        libelleConfirmer={dialogue === 'suspendre' ? 'Suspendre' : 'Réactiver'}
        onConfirmer={confirmerStatut}
      />

      <ActivateSubscriptionDialog
        ouvert={dialogue === 'abonnement'}
        onFermer={() => setDialogue(null)}
        entreprise={c}
        planActuel={c.plan_code}
        onSucces={({ message }) => { toast.succes(message); setDialogue(null); reload(); }}
      />
    </>
  );
}
