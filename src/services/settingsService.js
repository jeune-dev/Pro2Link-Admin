import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 10 — paramètres de la plateforme : le corps est validé par le schéma propre à la clé. */
export const listerParametres = (signal) => api({ url: '/admin/parametres', signal });
export const modifierParametre = (cle, valeur) =>
  apiAvecMessage({ method: 'put', url: `/admin/parametres/${encodeURIComponent(cle)}`, data: valeur });

/** § 11 — diffusion de notifications (permission admin.notifications). */
export const diffuserNotification = (corps) => apiAvecMessage({ method: 'post', url: '/admin/notifications', data: corps });
export const listerDiffusions = (params, signal) =>
  api({ url: '/admin/notifications', params: nettoyerParams(params), signal });
