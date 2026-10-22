import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowRight, Building2, Ban, CheckCircle2, CreditCard, Info, RefreshCw, Users } from 'lucide-react';
import { getDashboard, getStatistiques } from '../../services/statisticsService.js';
import { listerEntreprises } from '../../services/companyService.js';
import { listerJournalAudit } from '../../services/auditService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useChartColors } from '../../hooks/useChartColors.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorAlert, { ErrorState } from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ChartCard from '../../components/charts/ChartCard.jsx';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';
import { formatDate, formatDateHeure, formatMois, formatMontant, formatNombre, formatRelatif } from '../../utils/format.js';
import { inscriptionsParMois } from '../../utils/stats.js';

const TYPES = ['acheteur', 'fournisseur', 'mixte'];

export default function DashboardPage() {
  const dash = useApiQuery((s) => getDashboard(s), []);
  const stats = useApiQuery((s) => getStatistiques({}, s), []);
  const dernieres = useApiQuery((s) => listerEntreprises({ tri: '-created_at', limit: 5 }, s), []);
  const journal = useApiQuery((s) => listerJournalAudit({ limit: 8 }, s), []);
  const { libelle } = useReferentiels();
  const couleurs = useChartColors();

  const d = dash.data?.dashboard;
  const chargement = dash.loading;
  const total = d?.companies?.total ?? 0;
  const suspendues = d?.companies?.suspended ?? 0;
  const parStatutAbo = d?.subscriptions?.by_status || {};

  const repartitionStatut = d ? [
    { code: 'actif', label: libelle('statut_entreprise', 'actif'), valeur: total - suspendues, couleur: couleurs.succes },
    { code: 'suspendu', label: libelle('statut_entreprise', 'suspendu'), valeur: suspendues, couleur: couleurs.danger },
  ] : [];

  const st = stats.data?.statistics;
  const inscriptions = st ? inscriptionsParMois(st.signups, st.period, TYPES) : [];
  const seriesTypes = TYPES.map((t, i) => ({ code: t, label: libelle('type_entreprise', t), couleur: couleurs.series[i] }));

  return (
    <>
      <PageHeader
        titre="Tableau de bord"
        description={d ? `Vue d’ensemble de la plateforme · mois en cours du ${formatDate(d.period?.start)} au ${formatDate(d.period?.end)}` : 'Vue d’ensemble de la plateforme Pro2Link.'}
        actions={<Button variante="neutre" icone={RefreshCw} onClick={() => { dash.reload(); stats.reload(); dernieres.reload(); journal.reload(); }}>Actualiser</Button>}
      />

      {dash.error ? <ErrorAlert erreur={dash.error} titre="Le tableau de bord n’a pas pu être chargé" className="mb-6" /> : null}

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Entreprises" icone={Building2} chargement={chargement} valeur={formatNombre(total)} note={d ? `+${formatNombre(d.companies?.new_this_month)} ce mois-ci` : ''} to="/entreprises" />
        <StatCard label="Entreprises actives" icone={CheckCircle2} ton="succes" chargement={chargement} valeur={formatNombre(total - suspendues)} note="Statut actif" to="/entreprises?status=actif" />
        <StatCard label="Entreprises suspendues" icone={Ban} ton="danger" chargement={chargement} valeur={formatNombre(suspendues)} note="Accès suspendu" to="/entreprises?status=suspendu" />
        <StatCard label="Utilisateurs" icone={Users} ton="info" chargement={chargement} valeur={formatNombre(d?.users?.total)} note={d ? `${formatNombre(d.users?.active_this_month)} actifs ce mois-ci` : ''} to="/utilisateurs" />
        <StatCard label="Abonnements actifs" icone={CreditCard} ton="secondaire" chargement={chargement} valeur={formatNombre(parStatutAbo.actif ?? 0)} note={`${formatNombre(parStatutAbo.essai ?? 0)} en période d’essai`} to="/abonnements?status=actif" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          titre="Évolution des inscriptions"
          description={st ? `Nouvelles entreprises par mois et par type · ${formatMois(st.period?.start?.slice(0, 7))} – ${formatMois(st.period?.end?.slice(0, 7))}` : 'Nouvelles entreprises par mois et par type'}
          chargement={stats.loading}
          erreur={stats.error}
          onRetry={stats.reload}
          vide={!inscriptions.some((l) => l.total > 0)}
          legende={seriesTypes.map((s) => ({ label: s.label, couleur: s.couleur }))}
          tableau={{
            colonnes: [
              { header: 'Mois', value: (l) => formatMois(l.month) },
              ...seriesTypes.map((s) => ({ header: s.label, value: (l) => l[s.code], align: 'right' })),
              { header: 'Total', value: (l) => l.total, align: 'right' },
            ],
            lignes: inscriptions,
          }}
          exportNom="pro2link-inscriptions"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inscriptions} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={couleurs.grille} />
              <XAxis dataKey="month" tickFormatter={formatMois} tick={{ fill: couleurs.axe, fontSize: 12 }} tickLine={false} axisLine={{ stroke: couleurs.grille }} />
              <YAxis allowDecimals={false} tick={{ fill: couleurs.axe, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: couleurs.grille, opacity: 0.4 }} content={<ChartTooltip formatLabel={formatMois} />} />
              {seriesTypes.map((s, i) => (
                <Bar
                  key={s.code}
                  dataKey={s.code}
                  name={s.label}
                  stackId="types"
                  fill={s.couleur}
                  stroke={couleurs.surface}
                  strokeWidth={2}
                  radius={i === seriesTypes.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titre="Répartition par statut"
          description="Entreprises actives et suspendues (situation actuelle)"
          chargement={chargement}
          erreur={dash.error}
          onRetry={dash.reload}
          vide={!total}
          hauteur={220}
          legende={repartitionStatut.map((r) => ({ label: `${r.label} · ${formatNombre(r.valeur)}`, couleur: r.couleur }))}
          tableau={{ colonnes: [{ header: 'Statut', value: (r) => r.label }, { header: 'Entreprises', value: (r) => r.valeur, align: 'right' }], lignes: repartitionStatut }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={repartitionStatut} dataKey="valeur" nameKey="label" innerRadius="62%" outerRadius="88%" paddingAngle={repartitionStatut.every((r) => r.valeur) ? 2 : 0} stroke={couleurs.surface} strokeWidth={2}>
                {repartitionStatut.map((r) => <Cell key={r.code} fill={r.couleur} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatValeur={(v) => formatNombre(v)} />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card titre="Activité du mois" description="Volumes agrégés de la plateforme (toutes entreprises)" className="xl:col-span-1">
          {chargement ? <div className="squelette h-48" /> : d ? (
            <dl className="divide-y divide-bordure text-petit">
              {[
                ['Partenariats', formatNombre(d.partnerships)],
                ['Produits', formatNombre(d.products)],
                ['Bons de commande envoyés', formatNombre(d.orders?.sent)],
                ['Commandes validées', formatNombre(d.orders?.validated)],
                ['Volume commandé', formatMontant(d.orders?.volume)],
                ['Factures émises', `${formatNombre(d.invoices?.count)} · ${formatMontant(d.invoices?.amount)}`],
                ['Paiements enregistrés', formatMontant(d.payments)],
                ['Revenu mensuel récurrent (abonnements)', formatMontant(d.subscriptions?.mrr)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-texte-secondaire">{k}</dt>
                  <dd className="text-right font-semibold text-texte chiffres">{v}</dd>
                </div>
              ))}
            </dl>
          ) : <ErrorState erreur={dash.error} onRetry={dash.reload} compact />}
          {d ? <p className="mt-4 text-legende text-texte-discret">Calculé le {formatDateHeure(d.generated_at)}</p> : null}
        </Card>

        <Card
          titre="Dernières entreprises inscrites"
          actions={<Link to="/entreprises?tri=-created_at" className="inline-flex items-center gap-1 text-petit font-semibold text-primaire hover:underline">Tout voir <ArrowRight className="size-4" aria-hidden /></Link>}
          corpsClassName="p-0"
        >
          {dernieres.loading ? <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="squelette h-10" />)}</div> : null}
          {dernieres.error ? <ErrorState erreur={dernieres.error} onRetry={dernieres.reload} compact /> : null}
          {!dernieres.loading && !dernieres.error && !dernieres.data?.items?.length ? <EmptyState compact titre="Aucune entreprise inscrite" /> : null}
          <ul className="divide-y divide-bordure">
            {(dernieres.loading ? [] : dernieres.data?.items || []).map((c) => (
              <li key={c.id}>
                <Link to={`/entreprises/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-alt">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-petit font-semibold text-texte">{c.name}</span>
                    <span className="block text-legende text-texte-secondaire">{libelle('type_entreprise', c.type)} · {formatRelatif(c.created_at)}</span>
                  </span>
                  <StatusBadge famille="entreprise" refKey="statut_entreprise" code={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          titre="Activité récente"
          description="Journal d’audit de la plateforme"
          actions={<Link to="/activite" className="inline-flex items-center gap-1 text-petit font-semibold text-primaire hover:underline">Journal <ArrowRight className="size-4" aria-hidden /></Link>}
          corpsClassName="p-0"
        >
          {journal.loading ? <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="squelette h-10" />)}</div> : null}
          {journal.error ? <ErrorState erreur={journal.error} onRetry={journal.reload} compact /> : null}
          {!journal.loading && !journal.error && !journal.data?.items?.length ? <EmptyState compact icone={Activity} titre="Aucune activité enregistrée" /> : null}
          <ol className="divide-y divide-bordure">
            {(journal.loading ? [] : journal.data?.items || []).map((a) => (
              <li key={a.id} className="flex gap-3 px-5 py-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primaire" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate font-mono text-legende text-texte">{a.action}</p>
                  <p className="text-legende text-texte-secondaire">
                    {libelle('roles', a.actor_role)} · {a.entity_type || '—'} · <time dateTime={a.created_at}>{formatRelatif(a.created_at)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {d?.subscriptions?.by_plan?.length ? (
        <Card titre="Abonnements par forfait" className="mt-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {d.subscriptions.by_plan.map((p) => (
              <li key={p.code} className="rounded-champ border border-bordure p-4">
                <p className="text-petit text-texte-secondaire">{p.name}</p>
                <p className="mt-1 text-titre font-semibold text-texte chiffres">{formatNombre(p.count)}</p>
                <p className="font-mono text-legende text-texte-discret">{p.code}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="mt-6 flex items-center gap-2 text-legende text-texte-discret">
        <Info className="size-3.5" aria-hidden />
        Toutes les valeurs proviennent de l’API Pro2Link (aucune donnée de démonstration).
      </p>
    </>
  );
}
