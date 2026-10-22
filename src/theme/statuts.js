/**
 * Ton visuel de chaque statut renvoyé par l'API (section 5 de la charte).
 *
 *   import { tonDe } from './theme/statuts';
 *   <span className="pl-badge" data-ton={tonDe('commande', c.status)}>{libelle}</span>
 *
 * Les LIBELLÉS viennent de `GET /api/v1/referentiels` : ne pas les réécrire ici.
 * Afficher TOUJOURS le libellé avec la couleur (daltonisme, lecteurs d'écran).
 */

/** @typedef {'succes' | 'avertissement' | 'danger' | 'info' | 'neutre'} TonStatut */

export const TONS_DES_STATUTS = Object.freeze({
  commande: { brouillon: 'neutre', envoyee: 'info', en_attente_validation: 'avertissement', proposition_modifiee: 'avertissement', validee: 'info', en_preparation: 'info', prete: 'info', livree_partiellement: 'avertissement', livree: 'info', reception_confirmee: 'succes', facturee: 'info', terminee: 'succes', refusee: 'danger', annulee: 'neutre' },
  version: { brouillon: 'neutre', proposee: 'avertissement', acceptee: 'succes', refusee: 'danger', remplacee: 'neutre' },
  changementLigne: { inchangee: 'neutre', quantite_modifiee: 'avertissement', prix_modifie: 'avertissement', indisponible: 'danger', ajoutee: 'info', substitution: 'info' },
  approbation: { non_requise: 'neutre', en_attente: 'avertissement', approuvee: 'succes', rejetee: 'danger' },
  livraison: { expediee: 'info', receptionnee: 'succes' },
  facture: { emise: 'info', partiellement_payee: 'avertissement', payee: 'succes', en_retard: 'danger', annulee: 'neutre' },
  rapprochement: { conforme: 'succes', ecart: 'avertissement', accepte: 'info', conteste: 'danger' },
  paiement: { declare: 'avertissement', confirme: 'succes', rejete: 'danger', annule: 'neutre' },
  avoir: { emis: 'info', annule: 'neutre' },
  litige: { ouvert: 'avertissement', accepte: 'succes', refuse: 'danger', annule: 'neutre' },
  partenariat: { en_attente: 'avertissement', actif: 'succes', refuse: 'danger', suspendu: 'danger' },
  invitationPartenaire: { en_attente: 'avertissement', acceptee: 'succes', expiree: 'neutre', annulee: 'neutre' },
  disponibilite: { disponible: 'succes', stock_limite: 'avertissement', sur_commande: 'info', rupture: 'danger' },
  modeleDocument: { actif: 'succes', archive: 'neutre' },
  abonnement: { essai: 'info', actif: 'succes', expire: 'danger', suspendu: 'danger', annule: 'neutre' },
  paiementAbonnement: { initie: 'neutre', confirme: 'succes', echoue: 'danger', annule: 'neutre' },
  entreprise: { actif: 'succes', suspendu: 'danger' },
  membre: { actif: 'succes', inactif: 'neutre' },
  plan: { actif: 'succes', inactif: 'neutre' },
});

/**
 * Ton d'un code ; `neutre` pour un code inconnu (nouvelle valeur côté API).
 * @param {keyof typeof TONS_DES_STATUTS} famille
 * @param {string | null | undefined} code
 * @returns {TonStatut}
 */
export function tonDe(famille, code) {
  const tons = TONS_DES_STATUTS[famille] || {};
  return (code && tons[code]) || 'neutre';
}

/** Variables CSS (texte, fond) d'un ton — pour un style en ligne ou un graphique. */
export function couleursDuTon(ton) {
  return { texte: `var(--pl-${ton})`, fond: `var(--pl-${ton}-fond)` };
}

/**
 * Couleurs RÉELLES (hex) — pour les bibliothèques qui n'acceptent pas les
 * variables CSS. Lit la valeur calculée du mode en cours.
 */
export function couleurCalculee(nomVariable) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--pl-${nomVariable}`).trim();
}
