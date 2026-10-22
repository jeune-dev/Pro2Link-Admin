/**
 * Formats d'affichage (charte § 2) : montants FCFA entiers sans décimale,
 * dates en heure de Dakar (UTC+0).
 */
const FUSEAU = 'Africa/Dakar';

const nombreFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatNombre(n) {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  return nombreFr.format(Number(n));
}

/** 4250000 → « 4 250 000 FCFA » (XOF affiché FCFA). */
export function formatMontant(n, devise = 'XOF') {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const unite = !devise || devise === 'XOF' ? 'FCFA' : devise;
  return `${nombreFr.format(Number(n))} ${unite}`;
}

/** Date seule « AAAA-MM-JJ » : construite sans conversion de fuseau. */
function versDate(valeur) {
  if (!valeur) return null;
  if (valeur instanceof Date) return valeur;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    const [a, m, j] = valeur.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, j));
  }
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(valeur, options = {}) {
  const d = versDate(valeur);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: FUSEAU, ...options });
}

export function formatDateHeure(valeur) {
  const d = versDate(valeur);
  if (!d) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: FUSEAU,
  });
}

/** « 2026-10 » → « oct. 2026 ». */
export function formatMois(mois) {
  if (!mois || !/^\d{4}-\d{2}$/.test(mois)) return mois || '—';
  const [a, m] = mois.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

const relatif = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

export function formatRelatif(valeur, maintenant = Date.now()) {
  const d = versDate(valeur);
  if (!d) return '—';
  const secondes = Math.round((d.getTime() - maintenant) / 1000);
  const abs = Math.abs(secondes);
  if (abs < 60) return relatif.format(secondes, 'second');
  if (abs < 3600) return relatif.format(Math.round(secondes / 60), 'minute');
  if (abs < 86400) return relatif.format(Math.round(secondes / 3600), 'hour');
  if (abs < 86400 * 30) return relatif.format(Math.round(secondes / 86400), 'day');
  return formatDate(d);
}

export function nomComplet(u) {
  if (!u) return '—';
  const nom = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return nom || u.email || u.phone || '—';
}

export function initiales(texte) {
  if (!texte) return '?';
  const mots = String(texte).trim().split(/\s+/).filter(Boolean);
  return ((mots[0]?.[0] || '') + (mots[1]?.[0] || '')).toUpperCase() || '?';
}

/** Date du jour au format AAAA-MM-JJ (Dakar = UTC). */
export function aujourdHui(decalageJours = 0) {
  const d = new Date(Date.now() + decalageJours * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Premier jour du mois, n mois avant le mois courant (AAAA-MM-JJ). */
export function debutMois(moisEnArriere = 0) {
  const d = new Date();
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - moisEnArriere, 1));
  return r.toISOString().slice(0, 10);
}

export const idCourt = (id) => (id ? String(id).slice(0, 8) : '—');
