import { api, nettoyerParams } from './api.js';

/** § 4 — tableau de bord (mois en cours, calculé par l'API). */
export const getDashboard = (signal) => api({ url: '/admin/dashboard', signal });

/** § 5 — statistiques de la plateforme ; `du` / `au` au format AAAA-MM-JJ. */
export const getStatistiques = (params, signal) =>
  api({ url: '/admin/statistiques', params: nettoyerParams(params), signal });
