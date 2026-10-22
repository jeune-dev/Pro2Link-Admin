import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import ErrorAlert from '../common/ErrorAlert.jsx';
import Notice from '../common/Notice.jsx';
import { Checkbox, Field, Input, OptionsReferentiel, Select, Textarea } from '../forms/Field.jsx';
import { entierOuNull } from '../forms/validation.js';
import { creerPlan, modifierPlan } from '../../services/planService.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';

const limite = z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1000000), 'Entier de 1 à 1 000 000, ou vide pour illimité.');

const schema = z.object({
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,29}$/, 'Majuscules, chiffres et _ (2 à 30 caractères, commence par une lettre).'),
  name: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  description: z.string().trim().max(2000).optional(),
  price: z.string().refine((v) => /^\d+$/.test(v) && Number(v) <= 1e12, 'Montant entier en FCFA.'),
  billing_period: z.string().min(1),
  max_users: limite,
  max_products: limite,
  max_partners: limite,
  max_orders_per_month: limite,
  features: z.array(z.string()).max(3, '3 fonctionnalités maximum.'),
  sort_order: z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 10000), 'Entier de 0 à 10 000.'),
  status: z.string().optional(),
});

const vide = (v) => (v === null || v === undefined ? '' : String(v));

/**
 * Création (POST /admin/plans) ou modification (PATCH /admin/plans/:id) d'un
 * forfait. Aucune valeur commerciale n'est préremplie : les tarifs sont définis
 * par l'équipe Pro2Link. Le code n'est pas modifiable après création.
 */
export default function PlanFormDialog({ ouvert, onFermer, plan, onSucces }) {
  const { options } = useReferentiels();
  const edition = Boolean(plan);
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!ouvert) return;
    setErreur(null);
    reset({
      code: plan?.code || '',
      name: plan?.name || '',
      description: plan?.description || '',
      price: vide(plan?.price),
      billing_period: plan?.billing_period || 'mensuel',
      max_users: vide(plan?.max_users),
      max_products: vide(plan?.max_products),
      max_partners: vide(plan?.max_partners),
      max_orders_per_month: vide(plan?.max_orders_per_month),
      features: plan?.features || [],
      sort_order: vide(plan?.sort_order ?? ''),
      status: plan?.status || 'inactif',
    });
  }, [ouvert, plan, reset]);

  async function soumettre(v) {
    setErreur(null);
    const corps = {
      name: v.name.trim(),
      description: v.description?.trim() ? v.description.trim() : null,
      price: Number(v.price),
      billing_period: v.billing_period,
      max_users: entierOuNull(v.max_users),
      max_products: entierOuNull(v.max_products),
      max_partners: entierOuNull(v.max_partners),
      max_orders_per_month: entierOuNull(v.max_orders_per_month),
      features: v.features,
      ...(v.sort_order !== '' ? { sort_order: Number(v.sort_order) } : {}),
    };
    try {
      const res = edition
        ? await modifierPlan(plan.id, corps)
        : await creerPlan({ ...corps, code: v.code.trim(), status: v.status });
      onSucces?.(res);
    } catch (e) {
      setErreur(e);
    }
  }

  const champLimite = (nom, label) => (
    <Field label={label} erreur={errors[nom]?.message} aide="Vide = illimité">
      {(p) => <Input {...p} type="number" min={1} step={1} inputMode="numeric" {...register(nom)} />}
    </Field>
  );

  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={isSubmitting}
      large
      titre={edition ? `Modifier le forfait ${plan.name}` : 'Nouveau forfait'}
      pied={(
        <>
          <Button variante="neutre" onClick={onFermer} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" form="form-plan" chargement={isSubmitting}>{edition ? 'Enregistrer' : 'Créer le forfait'}</Button>
        </>
      )}
    >
      <form id="form-plan" onSubmit={handleSubmit(soumettre)} className="space-y-5" noValidate>
        {edition && plan.subscribers_count ? (
          <Notice ton="avertissement">Ce forfait compte {plan.subscribers_count} abonné(s) : les modifications de limites s’appliquent à leurs espaces.</Notice>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" erreur={errors.code?.message} aide={edition ? 'Non modifiable.' : 'Ex. ESSENTIEL, BUSINESS.'} obligatoire>
            {(p) => <Input {...p} disabled={edition} className="font-mono uppercase" {...register('code', { setValueAs: (x) => String(x || '').toUpperCase() })} />}
          </Field>
          <Field label="Nom" erreur={errors.name?.message} obligatoire>{(p) => <Input {...p} {...register('name')} />}</Field>
        </div>
        <Field label="Description" erreur={errors.description?.message}>{(p) => <Textarea {...p} rows={2} {...register('description')} />}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prix (FCFA)" erreur={errors.price?.message} obligatoire>{(p) => <Input {...p} type="number" min={0} step={1} inputMode="numeric" {...register('price')} />}</Field>
          <Field label="Périodicité" erreur={errors.billing_period?.message} obligatoire>
            {(p) => <Select {...p} {...register('billing_period')}><OptionsReferentiel options={options('periode_facturation')} /></Select>}
          </Field>
          <Field label="Ordre d’affichage" erreur={errors.sort_order?.message}>{(p) => <Input {...p} type="number" min={0} step={1} {...register('sort_order')} />}</Field>
        </div>
        <fieldset>
          <legend className="mb-3 text-petit font-semibold text-texte">Limites</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {champLimite('max_users', 'Utilisateurs')}
            {champLimite('max_products', 'Produits')}
            {champLimite('max_partners', 'Partenaires')}
            {champLimite('max_orders_per_month', 'Commandes / mois')}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-petit font-semibold text-texte">Fonctionnalités incluses</legend>
          <div className="flex flex-col gap-2">
            {options('fonctionnalite').map((f) => <Checkbox key={f.code} label={f.label} value={f.code} {...register('features')} />)}
          </div>
          {errors.features?.message ? <p className="mt-1 text-legende font-medium text-danger">{errors.features.message}</p> : null}
        </fieldset>
        {!edition ? (
          <Field label="Statut à la création" aide="Un forfait inactif n’est pas proposé aux entreprises.">
            {(p) => <Select {...p} {...register('status')}><OptionsReferentiel options={options('statut_plan')} /></Select>}
          </Field>
        ) : null}
        <ErrorAlert erreur={erreur} />
      </form>
    </Modal>
  );
}
