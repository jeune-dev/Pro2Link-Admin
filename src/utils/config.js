/** Configuration publique lue dans les variables d'environnement Vite (aucun secret). */
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export const config = Object.freeze({
  apiBaseUrl: clean(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '') || '/api/v1',
  // Site vitrine (lien de retour, connexion des entreprises). Vide : lien masqué.
  siteUrl: clean(import.meta.env.VITE_SITE_URL).replace(/\/$/, ''),
});
