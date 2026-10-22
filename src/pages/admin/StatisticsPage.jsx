import { useMemo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getDashboard, getStatistiques } from '../../services/statisticsService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { useChartColors } from '../../hooks/useChartColors.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Notice from '../../components/common/Notice.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import ChartCard from '../../components/charts/ChartCard.jsx';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';
import { FilterDate } from '../../components/tables/FilterBar.jsx';
import { aujourdHui, debutMois, formatDate, formatMois, formatMontant, formatNombre } from '../../utils/format.js';
import { tonDe } from '../../theme/statuts.js';
import { cumul, inscriptionsParMois, serieMensuelle } from '../../utils/stats.js';

const TYPES = ['acheteur', 'fournisseur', 'mixte'];
const PERIODES = [
  { id: '3', label: '3 mois', du: () => debutMois(2) },
  { id: '6', label: '6 mois', du: () => debutMois(5) },
  { id: '12', label: '12 mois', du: () => debutMois(11) },
  { id: 'annee', label: 'Année en cours', du: () => `${new Date().getUTCFullYear()}-01-01` },
];

/** Formats compacts des axes (montants en FCFA). */
const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

export default function StatisticsPage() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters({ du: '', au: '' });
  const stats = useApiQuery((s) => getStatistiques({ du: filtres.du, au: filtres.au }, s), [filtres.du, filtres.au]);
  const dash = useApiQuery((s) => getDashboard(s), []);
  const { libelle } = useReferentiels();
  const c = useChartColors();

  const st = stats.data?.statistics;
  const d = dash.data?.dashboard;
  const invalide = filtres.du && filtres.au && filtres.du > filtres.au;

  const inscriptions = useMemo(() => (st ? cumul(inscriptionsParMois(st.signups, st.period, TYPES)) : []), [st]);
  const commandes = useMemo(() => (st ? serieMensuelle(st.orders, st.period, ['count', 'amount']) : []), [st]);
  const factures = useMemo(() => (st ? serieMensuelle(st.invoices, st.period, ['count', 'amount', 'paid']) : []), [st]);
  const series = TYPES.map((t, i) => ({ code: t, label: libelle('type_entreprise', t), couleur: c.series[i] }));

  const comptes = d ? [
    { code: 'actif', label: libelle('statut_entreprise', 'actif'), valeur: (d.companies?.total ?? 0) - (d.companies?.suspended ?? 0) },
    { code: 'suspendu', label: libelle('statut_entreprise', 'suspendu'), valeur: d.companies?.suspended ?? 0 },
  ] : [];
  const abonnements = d ? Object.entries(d.subscriptions?.by_status || {}).map(([code, valeur]) => ({ code, label: libelle('statut_abonnement', code), valeur })) : [];
  const couleurTon = (famille, code) => c[tonDe(famille, code)] || c.neutre;

  const periodeActive = PERIODES.find((p) => p.du() === filtres.du && !filtres.au)?.id;
  const axes = {
    x: { dataKey: 'month', tickFormatter: formatMois, tick: { fill: c.axe, fontSize: 12 }, tickLine: false, axisLine: { stroke: c.grille } },
    y: { tick: { fill: c.axe, fontSize: 12 }, tickLine: false, axisLine: false },
  };
  const periodeTexte = st ? `${formatDate(st.period?.start)} – ${formatDate(st.period?.end)}` : '';

  return (
    <>
      <PageHeader
        titre="Statistiques"
        ariane={[{ label: 'Statistiques' }]}
        description="Statistiques globales de la plateforme. Les données commerciales propres à chaque entreprise restent dans son espace."
      />

      <Card className="mb-6" corpsClassName="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-legende font-medium text-texte-secondaire" id="libelle-periode">Période rapide</p>
          <div className="flex flex-wrap gap-1 rounded-champ bg-surface-alt p-1" role="group" aria-labelledby="libelle-periode">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={periodeActive === p.id}
                onClick={() => changer({ du: p.du(), au: '' })}
                className={`rounded-petit px-3 py-1.5 text-petit font-medium ${periodeActive === p.id ? 'bg-surface text-primaire shadow-douce' : 'text-texte-secondaire hover:text-texte'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <FilterDate label="Du" valeur={filtres.du} max={filtres.au || aujourdHui()} onChange={(du) => changer({ du })} />
        <FilterDate label="Au" valeur={filtres.au} min={filtres.du || undefined} max={aujourdHui()} onChange={(au) => changer({ au })} />
        {actifs ? <button type="button" onClick={reinitialiser} className="min-h-10 rounded-champ px-2 text-petit font-medium text-primaire hover:bg-primaire-teinte">Période par défaut</button> : null}
        {st ? <p className="text-petit text-texte-secondaire lg:ml-auto">Période analysée : <span className="font-medium text-texte">{periodeTexte}</span></p> : null}
      </Card>

      {invalide ? <ErrorAlert erreur="La date de début doit précéder la date de fin." className="mb-6" /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          titre="Inscriptions d’entreprises"
          description="Nouvelles entreprises par mois et par type"
          chargement={stats.loading}
          erreur={stats.error}
          onRetry={stats.reload}
          vide={!inscriptions.some((l) => l.total)}
          legende={series.map((s) => ({ label: s.label, couleur: s.couleur }))}
          tableau={{
            colonnes: [{ header: 'Mois', value: (l) => l.month, format: formatMois }, ...series.map((s) => ({ header: s.label, value: (l) => l[s.code], align: 'right' })), { header: 'Total', value: (l) => l.total, align: 'right' }],
            lignes: inscriptions,
          }}
          exportNom={`pro2link-inscriptions-${st?.period?.start}-${st?.period?.end}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inscriptions} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={c.grille} />
              <XAxis {...axes.x} />
              <YAxis allowDecimals={false} {...axes.y} />
              <Tooltip cursor={{ fill: c.grille, opacity: 0.4 }} content={<ChartTooltip formatLabel={formatMois} />} />
              {series.map((s, i) => (
                <Bar key={s.code} dataKey={s.code} name={s.label} stackId="t" fill={s.couleur} stroke={c.surface} strokeWidth={2} radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={36} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titre="Évolution du nombre d’entreprises"
          description="Nouvelles entreprises cumulées depuis le début de la période"
          chargement={stats.loading}
          erreur={stats.error}
          onRetry={stats.reload}
          vide={!inscriptions.some((l) => l.total)}
          tableau={{ colonnes: [{ header: 'Mois', value: (l) => l.month, format: formatMois }, { header: 'Nouvelles', value: (l) => l.total, align: 'right' }, { header: 'Cumul', value: (l) => l.cumul, align: 'right' }], lignes: inscriptions }}
          exportNom={`pro2link-entreprises-cumul-${st?.period?.start}-${st?.period?.end}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inscriptions} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="degrade-cumul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.series[0]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={c.series[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={c.grille} />
              <XAxis {...axes.x} />
              <YAxis allowDecimals={false} {...axes.y} />
              <Tooltip cursor={{ stroke: c.axe, strokeDasharray: '3 3' }} content={<ChartTooltip formatLabel={formatMois} />} />
              <Area type="monotone" dataKey="cumul" name="Entreprises (cumul)" stroke={c.series[0]} strokeWidth={2} fill="url(#degrade-cumul)" activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titre="Bons de commande"
          description="Nombre de commandes par mois (toutes entreprises)"
          chargement={stats.loading}
          erreur={stats.error}
          onRetry={stats.reload}
          vide={!commandes.some((l) => l.count)}
          tableau={{ colonnes: [{ header: 'Mois', value: (l) => l.month, format: formatMois }, { header: 'Commandes', value: (l) => l.count, align: 'right' }, { header: 'Montant (FCFA)', value: (l) => l.amount, align: 'right', format: formatNombre }], lignes: commandes }}
          exportNom={`pro2link-commandes-${st?.period?.start}-${st?.period?.end}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={commandes} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke={c.grille} />
              <XAxis {...axes.x} />
              <YAxis allowDecimals={false} {...axes.y} />
              <Tooltip cursor={{ stroke: c.axe, strokeDasharray: '3 3' }} content={<ChartTooltip formatLabel={formatMois} />} />
              <Line type="monotone" dataKey="count" name="Commandes" stroke={c.series[0]} strokeWidth={2} dot={{ r: 4, fill: c.series[0], stroke: c.surface, strokeWidth: 2 }} activeDot={{ r: 6, stroke: c.surface, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titre="Factures émises et encaissées"
          description="Montants facturés et montants payés par mois (FCFA)"
          chargement={stats.loading}
          erreur={stats.error}
          onRetry={stats.reload}
          vide={!factures.some((l) => l.amount || l.paid)}
          legende={[{ label: 'Facturé', couleur: c.series[0] }, { label: 'Payé', couleur: c.series[2] }]}
          tableau={{ colonnes: [{ header: 'Mois', value: (l) => l.month, format: formatMois }, { header: 'Factures', value: (l) => l.count, align: 'right' }, { header: 'Facturé (FCFA)', value: (l) => l.amount, align: 'right', format: formatNombre }, { header: 'Payé (FCFA)', value: (l) => l.paid, align: 'right', format: formatNombre }], lignes: factures }}
          exportNom={`pro2link-factures-${st?.period?.start}-${st?.period?.end}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={factures} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke={c.grille} />
              <XAxis {...axes.x} />
              <YAxis tickFormatter={(v) => compact.format(v)} {...axes.y} />
              <Tooltip cursor={{ fill: c.grille, opacity: 0.4 }} content={<ChartTooltip formatLabel={formatMois} formatValeur={(v) => formatMontant(v)} />} />
              <Bar dataKey="amount" name="Facturé" fill={c.series[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="paid" name="Payé" fill={c.series[2]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titre="Comptes actifs et suspendus"
          description="Situation actuelle des entreprises (indépendante de la période)"
          chargement={dash.loading}
          erreur={dash.error}
          onRetry={dash.reload}
          vide={!comptes.some((r) => r.valeur)}
          hauteur={200}
          tableau={{ colonnes: [{ header: 'Statut', value: (r) => r.label }, { header: 'Entreprises', value: (r) => r.valeur, align: 'right' }], lignes: comptes }}
          exportNom="pro2link-comptes-par-statut"
        >
          <BarresHorizontales donnees={comptes} couleur={(r) => couleurTon('entreprise', r.code)} c={c} />
        </ChartCard>

        <ChartCard
          titre="Répartition des abonnements"
          description="Abonnements par statut (situation actuelle)"
          chargement={dash.loading}
          erreur={dash.error}
          onRetry={dash.reload}
          vide={!abonnements.some((r) => r.valeur)}
          hauteur={Math.max(160, abonnements.length * 44)}
          tableau={{ colonnes: [{ header: 'Statut', value: (r) => r.label }, { header: 'Abonnements', value: (r) => r.valeur, align: 'right' }], lignes: abonnements }}
          exportNom="pro2link-abonnements-par-statut"
        >
          <BarresHorizontales donnees={abonnements} couleur={(r) => couleurTon('abonnement', r.code)} c={c} />
        </ChartCard>
      </div>

      <Notice className="mt-6">
        Les statistiques de la période proviennent de <code className="font-mono">GET /admin/statistiques</code> (12 derniers mois par défaut) ;
        les répartitions actuelles proviennent du tableau de bord. Les exports CSV contiennent exactement les données affichées.
      </Notice>
    </>
  );
}

/** Barres horizontales libellées (statuts) : valeur affichée en bout de barre. */
function BarresHorizontales({ donnees, couleur, c }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={donnees} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 8 }} barCategoryGap="30%">
        <CartesianGrid horizontal={false} stroke={c.grille} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: c.axe, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fill: c.texte, fontSize: 13 }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: c.grille, opacity: 0.4 }} content={<ChartTooltip formatValeur={(v) => formatNombre(v)} />} />
        <Bar dataKey="valeur" name="Nombre" radius={[0, 4, 4, 0]} maxBarSize={26} label={{ position: 'right', fill: c.texte, fontSize: 12 }}>
          {donnees.map((r) => <Cell key={r.code} fill={couleur(r)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
