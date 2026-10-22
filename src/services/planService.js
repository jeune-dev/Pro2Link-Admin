import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 14 — Admin : plans d'abonnement (permission admin.plans). */

export const listerPlans = (params, signal) => api({ url: '/admin/plans', params: nettoyerParams(params), signal });
export const getPlan = (id, signal) => api({ url: `/admin/plans/${id}`, signal });
export const creerPlan = (corps) => apiAvecMessage({ method: 'post', url: '/admin/plans', data: corps });
export const modifierPlan = (id, corps) => apiAvecMessage({ method: 'patch', url: `/admin/plans/${id}`, data: corps });
export const activerPlan = (id) => apiAvecMessage({ method: 'post', url: `/admin/plans/${id}/activer`, data: {} });
export const desactiverPlan = (id) => apiAvecMessage({ method: 'post', url: `/admin/plans/${id}/desactiver`, data: {} });
export const supprimerPlan = (id) => apiAvecMessage({ method: 'delete', url: `/admin/plans/${id}` });
