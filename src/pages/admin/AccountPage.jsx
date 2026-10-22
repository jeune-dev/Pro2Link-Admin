import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Laptop, LogOut, Save, ShieldCheck, Smartphone } from 'lucide-react';
import { fermerSession, getCompte, listerSessions, modifierProfil, regenererCodesSecours, revoquerToutesSessions } from '../../services/compteService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Notice from '../../components/common/Notice.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ErrorAlert, { ErrorState } from '../../components/common/ErrorAlert.jsx';
import { Badge } from '../../components/common/StatusBadge.jsx';
import { Field, Input, PasswordInput, Select } from '../../components/forms/Field.jsx';
import ChangePasswordForm from '../../components/forms/ChangePasswordForm.jsx';
import BackupCodes from '../../components/forms/BackupCodes.jsx';
import { codeTotp, email, telephoneFacultatif } from '../../components/forms/validation.js';
import { formatDateHeure, formatRelatif } from '../../utils/format.js';

export default function AccountPage() {
  // Profil complet (fonction, date d'activation de la MFA…) : GET /compte.
  const compte = useApiQuery((s) => getCompte(s), []);
  const profil = compte.data?.user;
  return (
    <>
      <PageHeader titre="Mon compte" ariane={[{ label: 'Mon compte' }]} description="Profil, mot de passe, double authentification et sessions ouvertes." />
      <div className="grid gap-6 xl:grid-cols-2">
        {compte.error ? <Card titre="Profil"><ErrorState erreur={compte.error} onRetry={compte.reload} compact /></Card> : <Profil profil={profil} onEnregistre={compte.reload} />}
        <Card titre="Mot de passe" description="Le changement déconnecte vos autres appareils."><ChangePasswordForm /></Card>
        <DoubleAuthentification profil={profil} />
        <Sessions />
      </div>
    </>
  );
}

const schemaProfil = z.object({
  first_name: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
  last_name: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  email,
  phone: telephoneFacultatif,
  job_title: z.string().trim().max(100).optional(),
  language: z.enum(['fr', 'en']),
  current_password: z.string().max(128).optional(),
});

function Profil({ profil: user, onEnregistre }) {
  const { rechargerUtilisateur } = useAuth();
  const toast = useToast();
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm({ resolver: zodResolver(schemaProfil) });

  useEffect(() => {
    reset({
      first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '',
      phone: user?.phone || '', job_title: user?.job_title || '', language: user?.language || 'fr', current_password: '',
    });
  }, [user, reset]);

  const emailModifie = (watch('email') || '').trim() !== (user?.email || '');

  async function soumettre(v) {
    setErreur(null);
    const corps = {
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      phone: v.phone ? v.phone.trim() : null,
      job_title: v.job_title?.trim() ? v.job_title.trim() : null,
      language: v.language,
      ...(emailModifie ? { email: v.email.trim(), current_password: v.current_password } : {}),
    };
    try {
      const { message } = await modifierProfil(corps);
      toast.succes(message);
      await rechargerUtilisateur();
      onEnregistre();
    } catch (e) {
      setErreur(e);
    }
  }

  if (!user) return <Card titre="Profil"><div className="squelette h-72" /></Card>;

  return (
    <Card titre="Profil">
      <form onSubmit={handleSubmit(soumettre)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" erreur={errors.first_name?.message} obligatoire>{(p) => <Input {...p} autoComplete="given-name" {...register('first_name')} />}</Field>
          <Field label="Nom" erreur={errors.last_name?.message} obligatoire>{(p) => <Input {...p} autoComplete="family-name" {...register('last_name')} />}</Field>
        </div>
        <Field label="E-mail" erreur={errors.email?.message} obligatoire>{(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}</Field>
        {emailModifie ? (
          <Field label="Mot de passe actuel" erreur={errors.current_password?.message} aide="Requis pour changer d’adresse e-mail." obligatoire>
            {(p) => <PasswordInput {...p} autoComplete="current-password" {...register('current_password')} />}
          </Field>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone" erreur={errors.phone?.message}>{(p) => <Input {...p} type="tel" autoComplete="tel" {...register('phone')} />}</Field>
          <Field label="Langue" erreur={errors.language?.message}>
            {(p) => <Select {...p} {...register('language')}><option value="fr">Français</option><option value="en">English</option></Select>}
          </Field>
        </div>
        <Field label="Fonction" erreur={errors.job_title?.message}>{(p) => <Input {...p} {...register('job_title')} />}</Field>
        <ErrorAlert erreur={erreur} />
        <Button type="submit" icone={Save} chargement={isSubmitting} disabled={!isDirty}>Enregistrer le profil</Button>
      </form>
    </Card>
  );
}

const schemaCodes = z.object({ current_password: z.string().min(1, 'Saisissez votre mot de passe.').max(128), code: codeTotp });

function DoubleAuthentification({ profil: user }) {
  const [codes, setCodes] = useState(null);
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schemaCodes) });

  async function soumettre(v) {
    setErreur(null);
    try {
      const { data } = await regenererCodesSecours(v);
      setCodes(data?.codes_secours || []);
      reset();
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <Card
      titre="Double authentification"
      actions={<Badge ton="succes">Active</Badge>}
      description={user?.totp_enabled_at ? `Activée le ${formatDateHeure(user.totp_enabled_at)}` : 'Obligatoire pour les super administrateurs.'}
    >
      <p className="flex gap-2 text-petit text-texte-secondaire">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-succes" aria-hidden />
        Elle ne peut pas être désactivée sur un compte super administrateur. En cas de perte du téléphone, un autre super administrateur peut réinitialiser votre accès.
      </p>
      {codes ? (
        <div className="mt-5 space-y-3">
          <Notice ton="avertissement" titre="Nouveaux codes de secours">Les anciens codes ne sont plus valables. Ces codes ne seront plus affichés.</Notice>
          <BackupCodes codes={codes} />
          <Button variante="neutre" taille="sm" onClick={() => setCodes(null)}>J’ai conservé mes codes</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(soumettre)} className="mt-5 space-y-4 border-t border-bordure pt-5" noValidate>
          <p className="text-petit font-semibold text-texte">Générer de nouveaux codes de secours</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot de passe" erreur={errors.current_password?.message} obligatoire>{(p) => <PasswordInput {...p} autoComplete="current-password" {...register('current_password')} />}</Field>
            <Field label="Code de l’application" erreur={errors.code?.message} obligatoire>{(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...register('code')} />}</Field>
          </div>
          <ErrorAlert erreur={erreur} />
          <Button type="submit" variante="neutre" icone={KeyRound} chargement={isSubmitting}>Générer de nouveaux codes</Button>
        </form>
      )}
    </Card>
  );
}

function Sessions() {
  const toast = useToast();
  const { data, error, loading, reload } = useApiQuery((s) => listerSessions(s), []);
  const [cible, setCible] = useState(null); // session | 'toutes'
  const sessions = data?.sessions || [];

  return (
    <Card
      titre="Sessions ouvertes"
      description="Appareils connectés à votre compte."
      actions={sessions.length ? <Button variante="danger-contour" taille="sm" icone={LogOut} onClick={() => setCible('toutes')}>Déconnecter tous les appareils</Button> : null}
      corpsClassName="p-0"
    >
      {loading ? <div className="space-y-3 p-5">{[0, 1].map((i) => <div key={i} className="squelette h-12" />)}</div> : null}
      {error ? <ErrorState erreur={error} onRetry={reload} compact /> : null}
      <ul className="divide-y divide-bordure">
        {(loading ? [] : sessions).map((s) => {
          const Icone = s.platform === 'web' ? Laptop : Smartphone;
          return (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <Icone className="size-5 shrink-0 text-texte-secondaire" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-petit font-semibold text-texte">
                  {s.device_name || 'Appareil'}{s.current ? <Badge ton="succes" icone={false}>Cette session</Badge> : null}
                </p>
                <p className="text-legende text-texte-secondaire">
                  {s.platform || '—'} · {s.ip || 'IP inconnue'} · active {formatRelatif(s.last_used_at)} · expire le {formatDateHeure(s.expires_at)}
                </p>
              </div>
              {!s.current ? (
                <Button variante="fantome" taille="sm" onClick={() => setCible(s)} aria-label={`Fermer la session ${s.device_name || ''}`}>Fermer</Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <ActionDialog
        ouvert={Boolean(cible)}
        onFermer={() => setCible(null)}
        titre={cible === 'toutes' ? 'Déconnecter tous les appareils ?' : 'Fermer cette session ?'}
        description={cible === 'toutes' ? 'Toutes vos sessions, y compris celle-ci, seront révoquées : vous devrez vous reconnecter.' : undefined}
        ton="danger"
        libelleConfirmer={cible === 'toutes' ? 'Tout déconnecter' : 'Fermer la session'}
        onConfirmer={async () => {
          if (cible === 'toutes') {
            const { message } = await revoquerToutesSessions();
            toast.succes(message);
            setCible(null);
            window.location.assign(`${import.meta.env.BASE_URL}connexion`);
            return;
          }
          const { message } = await fermerSession(cible.id);
          toast.succes(message);
          setCible(null);
          reload();
        }}
      />
    </Card>
  );
}
