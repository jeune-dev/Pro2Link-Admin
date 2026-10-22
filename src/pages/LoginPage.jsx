import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import * as authService from '../services/authService.js';
import Button from '../components/common/Button.jsx';
import ErrorAlert from '../components/common/ErrorAlert.jsx';
import Notice from '../components/common/Notice.jsx';
import { PageSpinner } from '../components/common/Spinner.jsx';
import { Field, Input, PasswordInput } from '../components/forms/Field.jsx';
import { codeTotp } from '../components/forms/validation.js';
import { config } from '../utils/config.js';
import ChangePasswordForm from '../components/forms/ChangePasswordForm.jsx';
import MfaSetup from '../components/forms/MfaSetup.jsx';

/** Destination après connexion : uniquement un chemin interne (pas de redirection ouverte). */
function destinationSure(retour) {
  if (!retour) return '/';
  try {
    const chemin = decodeURIComponent(retour);
    return chemin.startsWith('/') && !chemin.startsWith('//') && !chemin.startsWith('/connexion') ? chemin : '/';
  } catch {
    return '/';
  }
}

export default function LoginPage() {
  const { statut, user, etape, estSuperAdmin, ouvrirSession, sessionExpiree, deconnecter } = useAuth();
  const [mfaToken, setMfaToken] = useState(null);
  const [refus, setRefus] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Connexion · Administration Pro2Link'; }, []);

  // Back-office réservé au rôle super_admin renvoyé par l'API : un compte
  // entreprise est déconnecté aussitôt (l'API refuserait de toute façon /admin/*).
  useEffect(() => {
    if (statut !== 'connecte' || !user) return;
    if (!estSuperAdmin) {
      setRefus(true);
      deconnecter();
      return;
    }
    if (!etape) navigate(destinationSure(params.get('retour')), { replace: true });
  }, [statut, user, etape, estSuperAdmin, navigate, params, deconnecter]);

  if (statut === 'chargement') return <PageSpinner label="Vérification de la session…" />;

  if (mfaToken) {
    return (
      <EtapeMfa
        mfaToken={mfaToken}
        onAnnuler={() => setMfaToken(null)}
        onSucces={(data) => { setMfaToken(null); ouvrirSession(data); }}
      />
    );
  }

  if (statut === 'connecte' && etape === 'mot_de_passe') {
    return (
      <Cadre titre="Choisissez votre mot de passe" sousTitre="Votre compte utilise un mot de passe provisoire. Définissez votre mot de passe personnel pour continuer." icone={KeyRound}>
        <ChangePasswordForm apresSucces="session" />
        <BoutonAutreCompte onClick={deconnecter} />
      </Cadre>
    );
  }

  if (statut === 'connecte' && etape === 'configuration_mfa') {
    return (
      <Cadre titre="Activez la double authentification" sousTitre="Elle est obligatoire pour accéder au back-office Pro2Link." icone={ShieldCheck}>
        <MfaSetup />
        <BoutonAutreCompte onClick={deconnecter} />
      </Cadre>
    );
  }

  if (statut === 'connecte') return <PageSpinner label="Redirection…" />;

  return (
    <EtapeIdentifiants
      refus={refus}
      onNouvelEssai={() => setRefus(false)}
      sessionExpiree={sessionExpiree}
      onMfa={setMfaToken}
      onSession={ouvrirSession}
    />
  );
}

function Cadre({ titre, sousTitre, icone: Icone, children }) {
  return (
    <div>
      {Icone ? (
        <span className="flex size-11 items-center justify-center rounded-champ bg-primaire-teinte text-primaire"><Icone className="size-5" aria-hidden /></span>
      ) : null}
      <h1 className="mt-5 text-grand-titre font-semibold tracking-tight text-texte">{titre}</h1>
      {sousTitre ? <p className="mt-2 text-petit text-texte-secondaire">{sousTitre}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function BoutonAutreCompte({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="mt-6 inline-flex items-center gap-2 text-petit font-medium text-texte-secondaire hover:text-texte">
      <LogOut className="size-4" aria-hidden /> Se connecter avec un autre compte
    </button>
  );
}

const schemaIdentifiants = z.object({
  identifiant: z.string().trim().min(1, 'Saisissez votre e-mail ou votre téléphone.').max(254),
  password: z.string().min(1, 'Saisissez votre mot de passe.').max(128),
});

function EtapeIdentifiants({ refus, onNouvelEssai, sessionExpiree, onMfa, onSession }) {
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schemaIdentifiants) });

  async function soumettre(valeurs) {
    setErreur(null);
    onNouvelEssai();
    try {
      const data = await authService.connexion(valeurs);
      if (data?.mfa_requis) onMfa(data.mfa_token);
      else onSession(data);
    } catch (e) {
      setErreur(e.status === 429 && e.retryAfter
        ? { ...e, message: `${e.message} (réessayez dans ${Math.ceil(e.retryAfter / 60)} min)` }
        : e);
    }
  }

  return (
    <Cadre titre="Administration Pro2Link" sousTitre="Espace réservé aux administrateurs de la plateforme." icone={ShieldCheck}>
      {refus ? (
        <Notice ton="avertissement" titre="Accès réservé" className="mb-6">
          Ce back-office est réservé aux administrateurs de la plateforme Pro2Link. Votre session a été fermée.
          {config.siteUrl ? <> Les entreprises se connectent depuis <a href={`${config.siteUrl}/connexion`} className="font-semibold text-primaire hover:underline">le site Pro2Link</a>.</> : null}
        </Notice>
      ) : null}
      {sessionExpiree ? <Notice className="mb-6" titre="Session expirée">Pour votre sécurité, veuillez vous reconnecter.</Notice> : null}
      <form onSubmit={handleSubmit(soumettre)} className="space-y-5" noValidate>
        <Field label="E-mail ou téléphone" erreur={errors.identifiant?.message} obligatoire>
          {(p) => <Input {...p} autoComplete="username" inputMode="email" autoFocus {...register('identifiant')} />}
        </Field>
        <Field label="Mot de passe" erreur={errors.password?.message} obligatoire>
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...register('password')} />}
        </Field>
        <ErrorAlert erreur={erreur} />
        <Button type="submit" pleineLargeur taille="lg" chargement={isSubmitting}>Se connecter</Button>
      </form>
      <p className="mt-8 flex gap-2 text-legende text-texte-secondaire">
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
        Mot de passe oublié ou téléphone perdu : demandez à un autre super administrateur de réinitialiser votre accès.
      </p>
    </Cadre>
  );
}

const schemaCode = z.object({ code: codeTotp });
const schemaSecours = z.object({ code_secours: z.string().trim().min(4, 'Saisissez un code de secours.').max(20) });

function EtapeMfa({ mfaToken, onAnnuler, onSucces }) {
  const [secours, setSecours] = useState(false);
  return (
    <Cadre
      titre="Vérification en deux étapes"
      sousTitre={secours ? 'Saisissez l’un de vos codes de secours (chacun n’est utilisable qu’une fois).' : 'Saisissez le code à 6 chiffres affiché dans votre application d’authentification.'}
      icone={ShieldCheck}
    >
      {/* Remonté à chaque bascule : un formulaire et un schéma par mode. */}
      <FormulaireMfa key={secours ? 'secours' : 'code'} secours={secours} mfaToken={mfaToken} onSucces={onSucces} />
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-petit">
        <button type="button" className="font-medium text-primaire hover:underline" onClick={() => setSecours((s) => !s)}>
          {secours ? 'Utiliser un code de l’application' : 'Utiliser un code de secours'}
        </button>
        <button type="button" className="font-medium text-texte-secondaire hover:text-texte" onClick={onAnnuler}>Retour</button>
      </div>
    </Cadre>
  );
}

function FormulaireMfa({ secours, mfaToken, onSucces }) {
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(secours ? schemaSecours : schemaCode),
  });

  async function soumettre(v) {
    setErreur(null);
    try {
      const data = await authService.verifierMfa({ mfa_token: mfaToken, ...v });
      onSucces(data);
    } catch (e) {
      if (e.code === 'JETON_MFA_INVALIDE') {
        setErreur({ ...e, message: 'Le délai de vérification (5 minutes) est dépassé. Reconnectez-vous.' });
      } else setErreur(e);
    }
  }

  return (
    <form onSubmit={handleSubmit(soumettre)} className="space-y-5" noValidate>
        {secours ? (
          <Field label="Code de secours" erreur={errors.code_secours?.message} obligatoire>
            {(p) => <Input {...p} autoComplete="one-time-code" autoFocus {...register('code_secours')} />}
          </Field>
        ) : (
          <Field label="Code de vérification" erreur={errors.code?.message} obligatoire>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                className="text-center text-sous-titre tracking-[0.5em] chiffres"
                {...register('code')}
              />
            )}
          </Field>
        )}
        <ErrorAlert erreur={erreur} />
        <Button type="submit" pleineLargeur taille="lg" chargement={isSubmitting}>Vérifier</Button>
    </form>
  );
}
