import { api, apiAvecMessage, tokenStore } from './api.js';

/** § 2 — compte connecté (profil, mot de passe, double authentification, sessions). */

export const getCompte = (signal) => api({ url: '/compte', signal });

export const modifierProfil = (corps) => apiAvecMessage({ method: 'patch', url: '/compte', data: corps });

/** Le mot de passe changé révoque les autres sessions et renvoie un nouveau jeton. */
export async function changerMotDePasse(corps) {
  const res = await apiAvecMessage({ method: 'post', url: '/compte/mot-de-passe', data: corps });
  if (res.data?.access_token) tokenStore.set(res.data.access_token);
  return res;
}

export const listerSessions = (signal) => api({ url: '/compte/sessions', signal });
export const fermerSession = (id) => apiAvecMessage({ method: 'delete', url: `/compte/sessions/${id}` });
export const revoquerToutesSessions = () => apiAvecMessage({ method: 'post', url: '/compte/sessions/revoquer-toutes', data: {} });

export const initialiserMfa = (current_password) =>
  apiAvecMessage({ method: 'post', url: '/compte/mfa/initialiser', data: { current_password } });

/** Renvoie un nouveau jeton et les codes de secours (affichés une seule fois). */
export async function activerMfa(code) {
  const res = await apiAvecMessage({ method: 'post', url: '/compte/mfa/activer', data: { code } });
  if (res.data?.access_token) tokenStore.set(res.data.access_token);
  return res;
}

export const regenererCodesSecours = (corps) =>
  apiAvecMessage({ method: 'post', url: '/compte/mfa/codes-secours', data: corps });
