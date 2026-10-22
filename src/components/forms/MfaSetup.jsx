import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { activerMfa, initialiserMfa } from '../../services/compteService.js';
import Button from '../common/Button.jsx';
import ErrorAlert from '../common/ErrorAlert.jsx';
import Notice from '../common/Notice.jsx';
import { Field, Input, PasswordInput, Checkbox } from './Field.jsx';
import { codeTotp } from './validation.js';
import BackupCodes from './BackupCodes.jsx';

/**
 * Configuration de la double authentification (obligatoire pour le super admin) :
 * 1. mot de passe → POST /compte/mfa/initialiser (secret + URL otpauth) ;
 * 2. QR code à scanner, puis code → POST /compte/mfa/activer ;
 * 3. codes de secours affichés UNE SEULE FOIS (jamais stockés côté client).
 */
export default function MfaSetup() {
  const { rechargerUtilisateur } = useAuth();
  const [etape, setEtape] = useState('mot_de_passe');
  const [secret, setSecret] = useState(null);
  const [codes, setCodes] = useState([]);
  const [conserve, setConserve] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [fin, setFin] = useState(false);

  const formMdp = useForm({ resolver: zodResolver(z.object({ current_password: z.string().min(1, 'Saisissez votre mot de passe.').max(128) })) });
  const formCode = useForm({ resolver: zodResolver(z.object({ code: codeTotp })) });

  async function initialiser({ current_password }) {
    setErreur(null);
    try {
      const { data } = await initialiserMfa(current_password);
      setSecret(data);
      setEtape('scanner');
    } catch (e) {
      setErreur(e);
    }
  }

  async function activer({ code }) {
    setErreur(null);
    try {
      const { data } = await activerMfa(code);
      setCodes(data?.codes_secours || []);
      setSecret(null); // le secret n'est plus nécessaire : on l'oublie
      setEtape('codes');
    } catch (e) {
      setErreur(e);
    }
  }

  async function terminer() {
    setFin(true);
    try {
      await rechargerUtilisateur();
    } catch (e) {
      setErreur(e);
      setFin(false);
    }
  }

  if (etape === 'mot_de_passe') {
    return (
      <form onSubmit={formMdp.handleSubmit(initialiser)} className="space-y-5" noValidate>
        <p className="text-petit text-texte-secondaire">
          Vous aurez besoin d’une application d’authentification (Google Authenticator, Microsoft Authenticator, Authy…).
          Confirmez d’abord votre mot de passe.
        </p>
        <Field label="Mot de passe" erreur={formMdp.formState.errors.current_password?.message} obligatoire>
          {(p) => <PasswordInput {...p} autoComplete="current-password" autoFocus {...formMdp.register('current_password')} />}
        </Field>
        <ErrorAlert erreur={erreur} />
        <Button type="submit" pleineLargeur taille="lg" chargement={formMdp.formState.isSubmitting}>Continuer</Button>
      </form>
    );
  }

  if (etape === 'scanner') {
    const cle = secret?.secret || '';
    return (
      <form onSubmit={formCode.handleSubmit(activer)} className="space-y-5" noValidate>
        <ol className="list-decimal space-y-1 pl-5 text-petit text-texte-secondaire">
          <li>Scannez ce QR code avec votre application d’authentification.</li>
          <li>Saisissez le code à 6 chiffres qu’elle affiche.</li>
        </ol>
        <div className="flex justify-center rounded-carte border border-bordure bg-white p-5">
          {secret?.otpauth_url ? <QRCodeSVG value={secret.otpauth_url} size={184} level="M" title="QR code de configuration de la double authentification" /> : null}
        </div>
        <details className="rounded-champ border border-bordure p-3 text-petit">
          <summary className="cursor-pointer font-medium text-texte">Impossible de scanner ? Saisir la clé manuellement</summary>
          <p className="mt-2 break-all rounded-petit bg-surface-alt p-2 font-mono text-legende text-texte">{cle.replace(/(.{4})/g, '$1 ').trim()}</p>
        </details>
        <Field label="Code de vérification" erreur={formCode.formState.errors.code?.message} obligatoire>
          {(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-sous-titre tracking-[0.5em] chiffres" {...formCode.register('code')} />}
        </Field>
        <ErrorAlert erreur={erreur} />
        <Button type="submit" pleineLargeur taille="lg" chargement={formCode.formState.isSubmitting}>Activer</Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <Notice ton="avertissement" titre="Conservez vos codes de secours">
        Ils permettent de vous connecter si vous perdez votre téléphone. Ils ne seront plus jamais affichés.
      </Notice>
      <BackupCodes codes={codes} />
      <Checkbox label="J’ai conservé mes codes de secours en lieu sûr." checked={conserve} onChange={(e) => setConserve(e.target.checked)} />
      <ErrorAlert erreur={erreur} />
      <Button pleineLargeur taille="lg" disabled={!conserve} chargement={fin} onClick={terminer}>Accéder au back-office</Button>
    </div>
  );
}
