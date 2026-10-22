import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import ErrorAlert from '../common/ErrorAlert.jsx';
import Notice from '../common/Notice.jsx';
import { Field, Input, Select, Textarea } from '../forms/Field.jsx';
import { listerPlans } from '../../services/planService.js';
import { activerAbonnementEntreprise } from '../../services/subscriptionService.js';
import { nouvelleCleIdempotence } from '../../services/api.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { formatMontant } from '../../utils/format.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';

const schema = z.object({
  plan_code: z.string().min(1, 'Choisissez un forfait.'),
  months: z.coerce.number({ message: 'Durée invalide.' }).int('Nombre entier de mois.').min(1, '1 mois minimum.').max(24, '24 mois maximum.'),
  amount: z.union([z.literal(''), z.coerce.number().int('Montant entier en FCFA.').min(0, 'Montant positif.').max(1e12)]).optional(),
  note: z.string().trim().max(1000).optional(),
});

/**
 * Activation, renouvellement ou changement de forfait d'une entreprise :
 * POST /admin/entreprises/:companyId/abonnement/activer (paiement manuel
 * enregistré). Une clé d'idempotence par ouverture : un nouvel essai après une
 * coupure réutilise la même clé (pas de double enregistrement).
 */
export default function ActivateSubscriptionDialog({ ouvert, onFermer, entreprise, planActuel, onSucces }) {
  const plans = useApiQuery((s) => listerPlans({ status: 'actif' }, s), [ouvert], { enabled: ouvert });
  const { libelle } = useReferentiels();
  const cle = useRef(null);
  const [erreur, setErreur] = useState(null);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { plan_code: '', months: 1, amount: '', note: '' },
  });

  useEffect(() => {
    if (ouvert) {
      cle.current = nouvelleCleIdempotence();
      setErreur(null);
      reset({ plan_code: planActuel || '', months: 1, amount: '', note: '' });
    }
  }, [ouvert, planActuel, reset]);

  const listePlans = useMemo(() => plans.data?.plans || [], [plans.data]);
  const plan = listePlans.find((p) => p.code === watch('plan_code'));

  async function soumettre(v) {
    setErreur(null);
    try {
      const corps = {
        plan_code: v.plan_code,
        months: v.months,
        ...(v.amount !== '' && v.amount !== undefined ? { amount: v.amount } : {}),
        ...(v.note ? { note: v.note } : {}),
      };
      const res = await activerAbonnementEntreprise(entreprise.id, corps, cle.current);
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
      titre="Activer ou renouveler l’abonnement"
      description={entreprise ? `Entreprise : ${entreprise.name}` : undefined}
      pied={(
        <>
          <Button variante="neutre" onClick={onFermer} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" form="form-activation" chargement={isSubmitting}>Enregistrer l’activation</Button>
        </>
      )}
    >
      <form id="form-activation" onSubmit={handleSubmit(soumettre)} className="space-y-4" noValidate>
        <Notice>
          Enregistre un paiement manuel confirmé (virement, espèces…) et prolonge l’abonnement du nombre de mois indiqué.
          Choisir un autre forfait change le forfait de l’entreprise. L’opération est tracée dans le journal d’audit.
        </Notice>
        <Field label="Forfait" erreur={errors.plan_code?.message} obligatoire>
          {(p) => (
            <Select {...p} disabled={plans.loading} {...register('plan_code')}>
              <option value="">{plans.loading ? 'Chargement des forfaits…' : 'Choisir un forfait…'}</option>
              {listePlans.map((pl) => (
                <option key={pl.id} value={pl.code}>
                  {pl.name} ({pl.code}) — {formatMontant(pl.price, pl.currency)} / {libelle('periode_facturation', pl.billing_period).toLowerCase()}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {plans.error ? <ErrorAlert erreur={plans.error} /> : null}
        {!plans.loading && !plans.error && !listePlans.length ? (
          <Notice ton="avertissement">Aucun forfait actif : créez ou activez un forfait dans l’onglet « Forfaits ».</Notice>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durée (mois)" erreur={errors.months?.message} obligatoire aide="De 1 à 24 mois.">
            {(p) => <Input {...p} type="number" min={1} max={24} step={1} {...register('months')} />}
          </Field>
          <Field label="Montant encaissé (FCFA)" erreur={errors.amount?.message} aide={plan ? `Tarif du forfait : ${formatMontant(plan.price, plan.currency)} / ${libelle('periode_facturation', plan.billing_period).toLowerCase()}` : 'Facultatif.'}>
            {(p) => <Input {...p} type="number" min={0} step={1} inputMode="numeric" {...register('amount')} />}
          </Field>
        </div>
        <Field label="Note" erreur={errors.note?.message} aide="Référence du virement, contexte…">
          {(p) => <Textarea {...p} rows={2} maxLength={1000} {...register('note')} />}
        </Field>
        <ErrorAlert erreur={erreur} />
      </form>
    </Modal>
  );
}
