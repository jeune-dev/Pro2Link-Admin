import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, Monitor, Moon, Palette, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Sun } from 'lucide-react';
import { diffuserNotification, listerDiffusions, listerParametres, modifierParametre } from '../../services/settingsService.js';
import { listerRoles } from '../../services/userService.js';
import { listerPlans } from '../../services/planService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Tabs from '../../components/common/Tabs.jsx';
import Button from '../../components/common/Button.jsx';
import Notice from '../../components/common/Notice.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ErrorAlert, { ErrorState } from '../../components/common/ErrorAlert.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Badge } from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import { Checkbox, Field, Input, Select, Textarea } from '../../components/forms/Field.jsx';
import { formatDateHeure, formatNombre } from '../../utils/format.js';

const ONGLETS = [
  { id: 'plateforme', label: 'Plateforme', icone: SlidersHorizontal },
  { id: 'diffusion', label: 'Notifications', icone: Megaphone },
  { id: 'roles', label: 'Rôles et permissions', icone: ShieldCheck },
  { id: 'affichage', label: 'Affichage', icone: Palette },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const onglet = ONGLETS.some((o) => o.id === params.get('onglet')) ? params.get('onglet') : 'plateforme';
  return (
    <>
      <PageHeader titre="Paramètres" ariane={[{ label: 'Paramètres' }]} description="Configuration de la plateforme. Seuls les paramètres exposés par l’API sont modifiables." />
      <div className="mb-5">
        <Tabs label="Sections des paramètres" onglets={ONGLETS} actif={onglet} onChange={(id) => setParams(id === 'plateforme' ? {} : { onglet: id })} />
      </div>
      {onglet === 'plateforme' ? <ParametresPlateforme /> : null}
      {onglet === 'diffusion' ? <Diffusion /> : null}
      {onglet === 'roles' ? <Roles /> : null}
      {onglet === 'affichage' ? <Affichage /> : null}
    </>
  );
}

/* ───────────────────── Paramètres de la plateforme ───────────────────── */

/** Libellés lisibles des clés et champs connus ; une clé inconnue s'affiche telle quelle. */
const TITRES = { essai: 'Période d’essai', invitation: 'Invitations de collaborateurs', otp: 'Codes de vérification (OTP)', paiement: 'Paiement en ligne des abonnements' };
const CHAMPS = {
  plan_code: 'Forfait offert', duree_jours: 'Durée (jours)', duree_minutes: 'Durée de validité (minutes)',
  tentatives_max: 'Tentatives maximum', expiration_minutes: 'Expiration du lien de paiement (minutes)',
};

function ParametresPlateforme() {
  const { data, error, loading, reload } = useApiQuery((s) => listerParametres(s), []);
  const plans = useApiQuery((s) => listerPlans({ status: 'actif' }, s), []);
  if (loading) return <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="squelette h-48 rounded-carte" />)}</div>;
  if (error) return <Card><ErrorState erreur={error} onRetry={reload} /></Card>;
  const settings = data?.settings || [];
  if (!settings.length) return <Card><EmptyState titre="Aucun paramètre exposé" message="L’API ne renvoie aucun paramètre de plateforme modifiable." /></Card>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {settings.map((s) => <CarteParametre key={s.key} parametre={s} plans={plans.data?.plans || []} onEnregistre={reload} />)}
    </div>
  );
}

function CarteParametre({ parametre, plans, onEnregistre }) {
  const toast = useToast();
  const [valeurs, setValeurs] = useState(parametre.value || {});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [confirmerDefaut, setConfirmerDefaut] = useState(false);

  useEffect(() => { setValeurs(parametre.value || {}); }, [parametre.value]);

  const modele = { ...(parametre.default || {}), ...(parametre.value || {}) };
  const modifie = JSON.stringify(valeurs) !== JSON.stringify(parametre.value || {});

  function changer(cle, brut) {
    const type = typeof modele[cle];
    let v = brut;
    if (type === 'number') v = brut === '' ? '' : Number(brut);
    setValeurs((x) => ({ ...x, [cle]: v }));
  }

  async function enregistrer(corps) {
    setEnvoi(true);
    setErreur(null);
    try {
      const { message } = await modifierParametre(parametre.key, corps);
      toast.succes(message);
      onEnregistre();
    } catch (e) {
      setErreur(e);
      throw e;
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Card
      titre={TITRES[parametre.key] || parametre.key}
      description={parametre.description}
      actions={<Badge ton={parametre.customized ? 'info' : 'neutre'} icone={false}>{parametre.customized ? 'Personnalisé' : 'Valeur par défaut'}</Badge>}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); enregistrer(valeurs).catch(() => {}); }}
        className="space-y-4"
        noValidate
      >
        {Object.keys(modele).map((cle) => {
          const type = typeof modele[cle];
          const label = CHAMPS[cle] || cle;
          const defaut = parametre.default?.[cle];
          const aide = defaut !== undefined ? `Par défaut : ${typeof defaut === 'boolean' ? (defaut ? 'oui' : 'non') : defaut}` : undefined;
          if (cle === 'plan_code') {
            return (
              <Field key={cle} label={label} aide={aide}>
                {(p) => (
                  <Select {...p} value={valeurs[cle] ?? ''} onChange={(e) => changer(cle, e.target.value)}>
                    {!plans.some((pl) => pl.code === valeurs[cle]) && valeurs[cle] ? <option value={valeurs[cle]}>{valeurs[cle]}</option> : null}
                    {plans.map((pl) => <option key={pl.id} value={pl.code}>{pl.name} ({pl.code})</option>)}
                  </Select>
                )}
              </Field>
            );
          }
          if (type === 'boolean') {
            return <Checkbox key={cle} label={label} checked={Boolean(valeurs[cle])} onChange={(e) => changer(cle, e.target.checked)} />;
          }
          if (type === 'number') {
            return (
              <Field key={cle} label={label} aide={aide}>
                {(p) => <Input {...p} type="number" step={1} value={valeurs[cle] ?? ''} onChange={(e) => changer(cle, e.target.value)} />}
              </Field>
            );
          }
          if (type === 'string' || modele[cle] === null) {
            return (
              <Field key={cle} label={label} aide={aide}>
                {(p) => <Input {...p} value={valeurs[cle] ?? ''} onChange={(e) => changer(cle, e.target.value)} />}
              </Field>
            );
          }
          return (
            <div key={cle} className="text-petit">
              <p className="font-medium text-texte">{label}</p>
              <pre className="mt-1 overflow-auto rounded-champ bg-surface-alt p-2 font-mono text-legende">{JSON.stringify(valeurs[cle], null, 2)}</pre>
              <p className="mt-1 text-legende text-texte-discret">Valeur structurée : non modifiable depuis cette interface.</p>
            </div>
          );
        })}
        <ErrorAlert erreur={erreur} />
        <div className="flex flex-wrap items-center gap-2 border-t border-bordure pt-4">
          <Button type="submit" taille="sm" icone={Save} chargement={envoi} disabled={!modifie}>Enregistrer</Button>
          <Button variante="neutre" taille="sm" disabled={!modifie || envoi} onClick={() => { setValeurs(parametre.value || {}); setErreur(null); }}>Annuler</Button>
          {parametre.customized && parametre.default ? (
            <Button variante="fantome" taille="sm" icone={RotateCcw} disabled={envoi} onClick={() => setConfirmerDefaut(true)}>Valeur par défaut</Button>
          ) : null}
          {parametre.updated_at ? <span className="ml-auto text-legende text-texte-discret">Modifié le {formatDateHeure(parametre.updated_at)}</span> : null}
        </div>
      </form>
      <ActionDialog
        ouvert={confirmerDefaut}
        onFermer={() => setConfirmerDefaut(false)}
        titre="Rétablir la valeur par défaut ?"
        contexte={<pre className="overflow-auto font-mono text-legende">{JSON.stringify(parametre.default, null, 2)}</pre>}
        libelleConfirmer="Rétablir"
        onConfirmer={async () => { await enregistrer(parametre.default); setConfirmerDefaut(false); }}
      />
    </Card>
  );
}

/* ───────────────────── Diffusion de notifications ───────────────────── */

const CIBLES = [
  { code: 'tous', label: 'Tous les utilisateurs' },
  { code: 'acheteurs', label: 'Entreprises acheteuses' },
  { code: 'fournisseurs', label: 'Entreprises fournisseuses' },
  { code: 'administrateurs', label: 'Administrateurs des entreprises' },
];

function Diffusion() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const historique = useApiQuery((s) => listerDiffusions({ page, limit: 10 }, s), [page]);
  const [form, setForm] = useState({ cible: 'tous', titre: '', corps: '' });
  const [erreurs, setErreurs] = useState({});
  const [confirmer, setConfirmer] = useState(false);

  function valider(e) {
    e.preventDefault();
    const err = {};
    if (form.titre.trim().length < 3) err.titre = 'Titre de 3 à 150 caractères.';
    if (form.corps.trim().length < 3) err.corps = 'Message de 3 à 2 000 caractères.';
    setErreurs(err);
    if (!Object.keys(err).length) setConfirmer(true);
  }

  const libelleCible = (c) => CIBLES.find((x) => x.code === c)?.label || c;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Card titre="Diffuser une notification" description="Message interne envoyé aux comptes ciblés (web et mobile).">
        <form onSubmit={valider} className="space-y-4" noValidate>
          <Field label="Destinataires" obligatoire>
            {(p) => (
              <Select {...p} value={form.cible} onChange={(e) => setForm((f) => ({ ...f, cible: e.target.value }))}>
                {CIBLES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Titre" erreur={erreurs.titre} obligatoire>
            {(p) => <Input {...p} maxLength={150} value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />}
          </Field>
          <Field label="Message" erreur={erreurs.corps} aide={`${form.corps.length} / 2000`} obligatoire>
            {(p) => <Textarea {...p} rows={5} maxLength={2000} value={form.corps} onChange={(e) => setForm((f) => ({ ...f, corps: e.target.value }))} />}
          </Field>
          <Button type="submit" icone={Megaphone}>Diffuser</Button>
        </form>
      </Card>

      <Card titre="Historique des diffusions" corpsClassName="p-0">
        {historique.error ? <ErrorState erreur={historique.error} onRetry={historique.reload} compact /> : null}
        {historique.loading ? <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="squelette h-14" />)}</div> : null}
        {!historique.loading && !historique.error && !historique.data?.items?.length ? <EmptyState compact icone={Megaphone} titre="Aucune diffusion" /> : null}
        <ul className="divide-y divide-bordure">
          {(historique.loading ? [] : historique.data?.items || []).map((h) => (
            <li key={h.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-texte">{h.details?.titre}</p>
                <Badge ton="info" icone={false}>{libelleCible(h.details?.cible)}</Badge>
              </div>
              <p className="mt-1 whitespace-pre-line text-petit text-texte-secondaire">{h.details?.corps}</p>
              <p className="mt-1 text-legende text-texte-discret">{formatDateHeure(h.created_at)} · {formatNombre(h.details?.destinataires)} destinataire(s)</p>
            </li>
          ))}
        </ul>
        {!historique.error ? <Pagination pagination={historique.data?.pagination} onPage={setPage} /> : null}
      </Card>

      <ActionDialog
        ouvert={confirmer}
        onFermer={() => setConfirmer(false)}
        titre="Diffuser cette notification ?"
        contexte={(
          <>
            <p className="text-texte-secondaire">Destinataires : <span className="font-semibold text-texte">{libelleCible(form.cible)}</span></p>
            <p className="mt-2 font-semibold">{form.titre}</p>
            <p className="whitespace-pre-line text-texte-secondaire">{form.corps}</p>
            <p className="mt-2 text-legende text-texte-secondaire">Une notification envoyée ne peut pas être retirée.</p>
          </>
        )}
        libelleConfirmer="Diffuser"
        onConfirmer={async () => {
          const { message, data } = await diffuserNotification({ cible: form.cible, titre: form.titre.trim(), corps: form.corps.trim() });
          toast.succes(`${message} (${formatNombre(data?.diffusion?.destinataires)} destinataire(s))`);
          setConfirmer(false);
          setForm({ cible: form.cible, titre: '', corps: '' });
          setPage(1);
          historique.reload();
        }}
      />
    </div>
  );
}

/* ───────────────────── Rôles et permissions (lecture seule) ───────────────────── */

function Roles() {
  const { data, error, loading, reload } = useApiQuery((s) => listerRoles(s), []);
  if (loading) return <div className="squelette h-72 rounded-carte" />;
  if (error) return <Card><ErrorState erreur={error} onRetry={reload} /></Card>;
  const roles = data?.roles || [];
  const catalogue = data?.catalogue || [];
  return (
    <>
      <Notice className="mb-4">
        Rôles internes des entreprises clientes et leurs permissions, en lecture seule : l’API n’expose aucune modification des rôles depuis le back-office.
      </Notice>
      <Card corpsClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-petit">
            <caption className="sr-only">Matrice des permissions par rôle</caption>
            <thead>
              <tr className="border-b border-bordure bg-surface-alt/60">
                <th scope="col" className="sticky left-0 bg-surface-alt px-4 py-3 text-legende font-semibold uppercase text-texte-secondaire">Permission</th>
                {roles.map((r) => <th key={r.code} scope="col" className="px-3 py-3 text-center text-legende font-semibold text-texte">{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {catalogue.map((perm) => (
                <tr key={perm} className="border-b border-bordure last:border-0">
                  <th scope="row" className="sticky left-0 bg-surface px-4 py-2 text-left font-mono text-legende font-normal text-texte">{perm}</th>
                  {roles.map((r) => {
                    const a = r.permissions?.includes(perm);
                    return (
                      <td key={r.code} className="px-3 py-2 text-center">
                        {a ? <span className="text-succes" title="Accordée">✓<span className="sr-only">Accordée</span></span> : <span className="text-texte-discret" aria-label="Non accordée">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ───────────────────── Affichage (préférence locale) ───────────────────── */

function Affichage() {
  const { theme, setTheme } = useTheme();
  const choix = [
    { id: 'system', label: 'Selon le système', icone: Monitor },
    { id: 'light', label: 'Clair', icone: Sun },
    { id: 'dark', label: 'Sombre', icone: Moon },
  ];
  return (
    <Card titre="Thème" description="Préférence propre à ce navigateur (non enregistrée sur le serveur).">
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Thème d’affichage">
        {choix.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={theme === id}
            onClick={() => setTheme(id)}
            className={`flex items-center gap-3 rounded-carte border p-4 text-left ${theme === id ? 'border-primaire bg-primaire-teinte text-primaire' : 'border-bordure text-texte hover:bg-surface-alt'}`}
          >
            <Icone className="size-5" aria-hidden />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
