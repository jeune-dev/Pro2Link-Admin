import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 3 — notifications du compte connecté. */
export const listerNotifications = (params, signal) =>
  api({ url: '/notifications', params: nettoyerParams(params), signal });
export const compterNonLues = (signal) => api({ url: '/notifications/compteur', signal });
export const marquerLue = (id) => api({ method: 'post', url: `/notifications/${id}/lue`, data: {} });
export const toutMarquerLu = () => apiAvecMessage({ method: 'post', url: '/notifications/tout-lire', data: {} });
