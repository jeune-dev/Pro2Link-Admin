import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 7 — Admin : abonnements (permission admin.abonnements). */

export const listerAbonnements = (params, signal) =>
  api({ url: '/admin/abonnements', params: nettoyerParams(params), signal });

export const getAbonnement = (id, signal) => api({ url: `/admin/abonnements/${id}`, signal });

export const suspendreAbonnement = (id, reason) =>
  apiAvecMessage({ method: 'post', url: `/admin/abonnements/${id}/suspendre`, data: { reason } });

export const reactiverAbonnement = (id) =>
  apiAvecMessage({ method: 'post', url: `/admin/abonnements/${id}/reactiver`, data: {} });

export const annulerAbonnement = (id, reason) =>
  apiAvecMessage({ method: 'post', url: `/admin/abonnements/${id}/annuler`, data: reason ? { reason } : {} });

/**
 * § 6 — activation / renouvellement / changement de forfait d'une entreprise
 * (paiement manuel enregistré). `Idempotency-Key` : une clé par action, réutilisée
 * telle quelle pour un nouvel essai après une coupure réseau.
 */
export const activerAbonnementEntreprise = (companyId, corps, cleIdempotence) =>
  apiAvecMessage({
    method: 'post',
    url: `/admin/entreprises/${companyId}/abonnement/activer`,
    data: corps,
    headers: { 'Idempotency-Key': cleIdempotence },
  });

/** § 8 — paiements d'abonnement (permission admin.paiements). */
export const listerPaiementsAbonnements = (params, signal) =>
  api({ url: '/admin/paiements-abonnements', params: nettoyerParams(params), signal });
