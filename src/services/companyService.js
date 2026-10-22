import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 6 — Admin : entreprises (permission admin.entreprises). */

export const listerEntreprises = (params, signal) =>
  api({ url: '/admin/entreprises', params: nettoyerParams(params), signal });

export const getEntreprise = (id, signal) => api({ url: `/admin/entreprises/${id}`, signal });

export const suspendreEntreprise = (id, reason) =>
  apiAvecMessage({ method: 'post', url: `/admin/entreprises/${id}/suspendre`, data: { reason } });

export const reactiverEntreprise = (id) =>
  apiAvecMessage({ method: 'post', url: `/admin/entreprises/${id}/reactiver`, data: {} });
