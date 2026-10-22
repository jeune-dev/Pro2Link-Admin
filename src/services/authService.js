import { api, apiAvecMessage, http, tokenStore } from './api.js';

/** Nom de la session affiché dans « Mes sessions » (aucune donnée personnelle). */
const APPAREIL = { device_name: 'Navigateur web', platform: 'web' };

/** § 1 — POST /auth/connexion. Renvoie soit `{ mfa_requis, mfa_token }`, soit une session. */
export async function connexion({ identifiant, password }) {
  const data = await api({ method: 'post', url: '/auth/connexion', data: { identifiant, password, ...APPAREIL }, skipAuthRetry: true });
  if (data?.access_token) tokenStore.set(data.access_token);
  return data;
}

/** § 1 — POST /auth/mfa : exactement un parmi `code` et `code_secours`. */
export async function verifierMfa({ mfa_token, code, code_secours }) {
  const corps = { mfa_token, ...APPAREIL, ...(code ? { code } : { code_secours }) };
  const data = await api({ method: 'post', url: '/auth/mfa', data: corps, skipAuthRetry: true });
  if (data?.access_token) tokenStore.set(data.access_token);
  return data;
}

/** POST /auth/deconnexion : révoque la session (le cookie suffit côté navigateur). */
export async function deconnexion() {
  try {
    await http.post('/auth/deconnexion', {}, { skipAuthRetry: true });
  } finally {
    tokenStore.set(null);
  }
}

/** § 26 — POST /auth/inscription (compte + entreprise). Ouvre une session. */
export async function inscription(corps) {
  const res = await apiAvecMessage({ method: 'post', url: '/auth/inscription', data: { ...corps, ...APPAREIL }, skipAuthRetry: true });
  if (res.data?.access_token) tokenStore.set(res.data.access_token);
  return res;
}

/** POST /auth/mot-de-passe-oublie : réponse volontairement neutre. */
export const motDePasseOublie = (identifiant) =>
  apiAvecMessage({ method: 'post', url: '/auth/mot-de-passe-oublie', data: { identifiant }, skipAuthRetry: true });

/** POST /auth/reinitialiser-mot-de-passe (code à 6 chiffres reçu). */
export const reinitialiserMotDePasse = (corps) =>
  apiAvecMessage({ method: 'post', url: '/auth/reinitialiser-mot-de-passe', data: corps, skipAuthRetry: true });
