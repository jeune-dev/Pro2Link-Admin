import axios from 'axios';
import { config } from '../utils/config.js';

/**
 * Client HTTP unique de l'application.
 *
 * Sécurité de session (contrat API § 0) :
 * - le jeton d'accès (15 min) vit UNIQUEMENT en mémoire (jamais localStorage) ;
 * - le refresh token est un cookie httpOnly SameSite=Strict posé par l'API
 *   (chemin /api/v1/auth) : JavaScript ne le voit jamais ;
 * - sur 401, un seul rafraîchissement est lancé (le refresh token tourne à
 *   chaque usage : deux rafraîchissements parallèles révoqueraient la session).
 */

/** Erreur normalisée : l'interface se branche sur `code`, jamais sur `message`. */
export class ApiError extends Error {
  constructor({ status, code, message, details = [], requestId, retryAfter }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }

  get annulee() {
    return this.code === 'REQUETE_ANNULEE';
  }
}

const MESSAGES_PAR_DEFAUT = {
  400: 'La requête est invalide.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  402: 'Abonnement requis : l’espace est en lecture seule.',
  403: 'Accès refusé.',
  404: 'Élément introuvable.',
  409: 'Cette action est impossible dans l’état actuel.',
  413: 'Le fichier ou la requête est trop volumineux.',
  422: 'Certaines données sont invalides.',
  429: 'Trop de requêtes. Veuillez patienter quelques instants.',
  500: 'Une erreur interne est survenue. Veuillez réessayer.',
  502: 'Le serveur est momentanément injoignable.',
  503: 'Service momentanément indisponible. Veuillez réessayer.',
};

/** Codes 401 qui ne signifient PAS « jeton expiré » : pas de rafraîchissement. */
const CODES_401_METIER = new Set([
  'IDENTIFIANTS_INVALIDES', 'MOT_DE_PASSE_INCORRECT', 'CODE_MFA_INVALIDE', 'JETON_MFA_INVALIDE',
]);

export function toApiError(err) {
  if (err instanceof ApiError) return err;
  if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') {
    return new ApiError({ status: 0, code: 'REQUETE_ANNULEE', message: 'Requête annulée.' });
  }
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      const delai = err.code === 'ECONNABORTED';
      return new ApiError({
        status: 0,
        code: delai ? 'DELAI_DEPASSE' : 'ERREUR_RESEAU',
        message: delai
          ? 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
          : 'Impossible de joindre le serveur. Vérifiez votre connexion.',
      });
    }
    const { status, data, headers } = err.response;
    const corps = data && typeof data === 'object' ? data : {};
    const details = Array.isArray(corps.error?.details) ? corps.error.details.map(String) : [];
    const retry = Number(headers?.['retry-after']);
    // Erreur 5xx : message générique (aucun détail interne exposé) + identifiant de requête.
    const message = status >= 500
      ? MESSAGES_PAR_DEFAUT[status] || MESSAGES_PAR_DEFAUT[500]
      : corps.error?.message || corps.message || MESSAGES_PAR_DEFAUT[status] || 'Une erreur est survenue.';
    return new ApiError({
      status,
      code: corps.error?.code || `HTTP_${status}`,
      message,
      details: status >= 500 ? [] : details,
      requestId: corps.requestId || headers?.['x-request-id'],
      retryAfter: Number.isFinite(retry) ? retry : undefined,
    });
  }
  return new ApiError({ status: 0, code: 'ERREUR_INCONNUE', message: 'Une erreur inattendue est survenue.' });
}

let accessToken = null;
let rafraichissement = null;
let surSessionExpiree = null;
let surAccesBloque = null;

export const tokenStore = {
  get: () => accessToken,
  set: (jeton) => { accessToken = jeton || null; },
};

/** Appelé quand la session ne peut plus être renouvelée (retour à la connexion). */
export const setSessionExpiredHandler = (fn) => { surSessionExpiree = fn; };
/** Appelé sur 403 MFA_REQUISE / CHANGEMENT_MOT_DE_PASSE_REQUIS (étape de connexion à terminer). */
export const setAccessBlockedHandler = (fn) => { surAccesBloque = fn; };

export const http = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true, // cookie du refresh token
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.set('Authorization', `Bearer ${accessToken}`);
  return cfg;
});

/** Une seule requête de rafraîchissement en vol. Renvoie `{ access_token, user }` ou null. */
export function refreshSession() {
  if (!rafraichissement) {
    rafraichissement = http
      .post('/auth/refresh', undefined, { skipAuthRetry: true })
      .then((r) => {
        accessToken = r.data?.data?.access_token || null;
        return accessToken ? r.data.data : null;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        rafraichissement = null;
      });
  }
  return rafraichissement;
}

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const res = error?.response;
    const code = res?.data?.error?.code;
    const cfg = error?.config;
    if (res?.status === 401 && cfg && !cfg.skipAuthRetry && !CODES_401_METIER.has(code)) {
      cfg.skipAuthRetry = true;
      const session = await refreshSession();
      if (session) return http(cfg);
      surSessionExpiree?.();
    } else if (res?.status === 403 && (code === 'MFA_REQUISE' || code === 'CHANGEMENT_MOT_DE_PASSE_REQUIS')) {
      surAccesBloque?.(code);
    }
    return Promise.reject(toApiError(error));
  },
);

/** Appel standard : renvoie `data` de l'enveloppe `{ success, message, data }`. */
export async function api(cfg) {
  const res = await http.request(cfg);
  return res.data?.data;
}

/** Variante qui conserve le message de succès (à afficher tel quel à l'utilisateur). */
export async function apiAvecMessage(cfg) {
  const res = await http.request(cfg);
  return { data: res.data?.data, message: res.data?.message || 'Opération effectuée' };
}

/** Retire les paramètres vides d'une query string (l'API rejette les valeurs invalides). */
export function nettoyerParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

/** Clé d'idempotence : un UUID neuf par action utilisateur, réutilisé pour un nouvel essai. */
export const nouvelleCleIdempotence = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`);
