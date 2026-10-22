import { api } from './api.js';

/**
 * GET /referentiels (public) : `{ enumerations: { cle: [{ code, label }] }, correspondances }`.
 * Source unique des libellés de statuts, types, secteurs… (jamais réécrits côté client).
 */
export const getReferentiels = (signal) => api({ url: '/referentiels', signal, skipAuthRetry: true });
