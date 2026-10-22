import { api, apiAvecMessage, nettoyerParams } from './api.js';

/** § 9 — Admin : utilisateurs et super admins (permission admin.utilisateurs). */

export const listerUtilisateurs = (params, signal) =>
  api({ url: '/admin/utilisateurs', params: nettoyerParams(params), signal });

export const getUtilisateur = (id, signal) => api({ url: `/admin/utilisateurs/${id}`, signal });

/** Création d'un super admin : `current_password` de l'administrateur exigé. */
export const creerSuperAdmin = (corps) =>
  apiAvecMessage({ method: 'post', url: '/admin/utilisateurs', data: corps });

export const desactiverUtilisateur = (id, reason) =>
  apiAvecMessage({ method: 'post', url: `/admin/utilisateurs/${id}/desactiver`, data: { reason } });

export const activerUtilisateur = (id) =>
  apiAvecMessage({ method: 'post', url: `/admin/utilisateurs/${id}/activer`, data: {} });

export const deverrouillerUtilisateur = (id) =>
  apiAvecMessage({ method: 'post', url: `/admin/utilisateurs/${id}/deverrouiller`, data: {} });

/** Renvoie `mot_de_passe_provisoire`, affiché une seule fois. */
export const reinitialiserAcces = (id, corps) =>
  apiAvecMessage({ method: 'post', url: `/admin/utilisateurs/${id}/reinitialiser-acces`, data: corps });

/** § 13 — rôles et permissions (lecture seule). */
export const listerRoles = (signal) => api({ url: '/admin/roles', signal });
