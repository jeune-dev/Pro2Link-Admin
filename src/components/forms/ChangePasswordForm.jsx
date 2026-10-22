import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { changerMotDePasse } from '../../services/compteService.js';
import Button from '../common/Button.jsx';
import ErrorAlert from '../common/ErrorAlert.jsx';
import { Field, PasswordInput } from './Field.jsx';
import { MOT_DE_PASSE_REGLE, motDePasseFort } from './validation.js';

const schema = z.object({
  current_password: z.string().min(1, 'Saisissez votre mot de passe actuel.').max(128),
  password: motDePasseFort,
  password_confirmation: z.string(),
}).refine((v) => v.password === v.password_confirmation, {
  path: ['password_confirmation'], message: 'La confirmation ne correspond pas.',
}).refine((v) => v.password !== v.current_password, {
  path: ['password'], message: 'Le nouveau mot de passe doit être différent de l’actuel.',
});

/**
 * POST /compte/mot-de-passe. Les autres sessions sont révoquées par l'API ; un
 * nouveau jeton est renvoyé pour la session courante.
 */
export default function ChangePasswordForm({ apresSucces = 'toast' }) {
  const { rechargerUtilisateur } = useAuth();
  const toast = useToast();
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function soumettre(v) {
    setErreur(null);
    try {
      const { message } = await changerMotDePasse(v);
      reset();
      toast.succes(message);
      await rechargerUtilisateur();
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <form onSubmit={handleSubmit(soumettre)} className="space-y-5" noValidate>
      <Field label={apresSucces === 'session' ? 'Mot de passe provisoire' : 'Mot de passe actuel'} erreur={errors.current_password?.message} obligatoire>
        {(p) => <PasswordInput {...p} autoComplete="current-password" {...register('current_password')} />}
      </Field>
      <Field label="Nouveau mot de passe" erreur={errors.password?.message} aide={MOT_DE_PASSE_REGLE} obligatoire>
        {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('password')} />}
      </Field>
      <Field label="Confirmer le nouveau mot de passe" erreur={errors.password_confirmation?.message} obligatoire>
        {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('password_confirmation')} />}
      </Field>
      <ErrorAlert erreur={erreur} />
      <Button type="submit" pleineLargeur={apresSucces === 'session'} chargement={isSubmitting}>
        Enregistrer le mot de passe
      </Button>
    </form>
  );
}
