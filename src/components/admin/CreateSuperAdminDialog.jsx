import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import ErrorAlert from '../common/ErrorAlert.jsx';
import Notice from '../common/Notice.jsx';
import { Field, Input, PasswordInput } from '../forms/Field.jsx';
import { MOT_DE_PASSE_REGLE, email, motDePasseFort, telephoneFacultatif } from '../forms/validation.js';
import { creerSuperAdmin } from '../../services/userService.js';

const schema = z.object({
  first_name: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
  last_name: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  email,
  phone: telephoneFacultatif,
  password: motDePasseFort,
  current_password: z.string().min(1, 'Votre mot de passe est requis pour cette action sensible.').max(128),
});

/**
 * POST /admin/utilisateurs — crée un SUPER ADMINISTRATEUR (seul compte que
 * l'API permet de créer ici). Le mot de passe saisi est provisoire : la personne
 * devra le changer puis configurer sa double authentification.
 */
export default function CreateSuperAdminDialog({ ouvert, onFermer, onSucces }) {
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (ouvert) { reset(); setErreur(null); }
  }, [ouvert, reset]);

  async function soumettre(v) {
    setErreur(null);
    try {
      const res = await creerSuperAdmin({ ...v, phone: v.phone ? v.phone : null });
      onSucces?.(res);
    } catch (e) {
      setErreur(e);
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={isSubmitting}
      titre="Nouveau super administrateur"
      description="Accès complet au back-office Pro2Link."
      pied={(
        <>
          <Button variante="neutre" onClick={onFermer} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" form="form-super-admin" chargement={isSubmitting}>Créer le compte</Button>
        </>
      )}
    >
      <form id="form-super-admin" onSubmit={handleSubmit(soumettre)} className="space-y-4" noValidate>
        <Notice ton="avertissement">
          Ce compte aura tous les droits d’administration de la plateforme. Il devra changer ce mot de passe provisoire
          et activer la double authentification à sa première connexion. Transmettez le mot de passe par un canal sûr.
        </Notice>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" erreur={errors.first_name?.message} obligatoire>{(p) => <Input {...p} {...register('first_name')} />}</Field>
          <Field label="Nom" erreur={errors.last_name?.message} obligatoire>{(p) => <Input {...p} {...register('last_name')} />}</Field>
        </div>
        <Field label="E-mail" erreur={errors.email?.message} obligatoire>{(p) => <Input {...p} type="email" autoComplete="off" {...register('email')} />}</Field>
        <Field label="Téléphone" erreur={errors.phone?.message}>{(p) => <Input {...p} type="tel" autoComplete="off" {...register('phone')} />}</Field>
        <Field label="Mot de passe provisoire" erreur={errors.password?.message} aide={MOT_DE_PASSE_REGLE} obligatoire>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('password')} />}
        </Field>
        <div className="border-t border-bordure pt-4">
          <Field label="Votre mot de passe (confirmation)" erreur={errors.current_password?.message} obligatoire>
            {(p) => <PasswordInput {...p} autoComplete="current-password" {...register('current_password')} />}
          </Field>
        </div>
        <ErrorAlert erreur={erreur} />
      </form>
    </Modal>
  );
}
