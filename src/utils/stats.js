/**
 * Mise en forme des séries de GET /admin/statistiques pour les graphiques.
 * Les mois sans donnée sont complétés à zéro sur la période renvoyée par l'API.
 */

/** Liste des mois « AAAA-MM » entre deux dates « AAAA-MM-JJ » (incluses). */
export function moisEntre(debut, fin) {
  if (!debut || !fin) return [];
  let [a, m] = debut.slice(0, 7).split('-').map(Number);
  const [af, mf] = fin.slice(0, 7).split('-').map(Number);
  const mois = [];
  let garde = 0;
  while ((a < af || (a === af && m <= mf)) && garde < 240) {
    mois.push(`${a}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; a += 1; }
    garde += 1;
  }
  return mois;
}

/**
 * signups `[{ month, type, count }]` → `[{ month, total, [type]: count }]`.
 * @param {string[]} types codes des types d'entreprise (ordre d'affichage)
 */
export function inscriptionsParMois(signups = [], period, types = []) {
  const mois = moisEntre(period?.start, period?.end);
  const index = new Map(mois.map((mo) => [mo, Object.fromEntries([['month', mo], ['total', 0], ...types.map((t) => [t, 0])])]));
  for (const s of signups) {
    if (!index.has(s.month)) index.set(s.month, Object.fromEntries([['month', s.month], ['total', 0], ...types.map((t) => [t, 0])]));
    const ligne = index.get(s.month);
    ligne[s.type] = (ligne[s.type] || 0) + Number(s.count || 0);
    ligne.total += Number(s.count || 0);
  }
  return [...index.values()].sort((x, y) => x.month.localeCompare(y.month));
}

/** Cumul de `cle` mois après mois (nouvelles entreprises cumulées sur la période). */
export function cumul(lignes, cle = 'total') {
  let somme = 0;
  return lignes.map((l) => {
    somme += Number(l[cle] || 0);
    return { ...l, cumul: somme };
  });
}

/** Série mensuelle complétée à zéro : `[{ month, ...champs }]`. */
export function serieMensuelle(lignes = [], period, champs = []) {
  const mois = moisEntre(period?.start, period?.end);
  const index = new Map(lignes.map((l) => [l.month, l]));
  const toutes = new Set([...mois, ...index.keys()]);
  return [...toutes].sort().map((mo) => {
    const l = index.get(mo) || {};
    return Object.fromEntries([['month', mo], ...champs.map((c) => [c, Number(l[c] || 0)])]);
  });
}
