import { api, nettoyerParams } from './api.js';

/** § 12 — journal d'audit immuable, écrit par le serveur (permission admin.audit). */
export const listerJournalAudit = (params, signal) =>
  api({ url: '/admin/journal-audit', params: nettoyerParams(params), signal });
