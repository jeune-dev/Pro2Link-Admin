/**
 * Export CSV côté navigateur (données déjà chargées depuis l'API).
 * Séparateur « ; » et BOM UTF-8 : ouverture directe dans Excel en français.
 * Les cellules commençant par = + - @ sont neutralisées (injection de formules).
 */
function cellule(valeur) {
  if (valeur === null || valeur === undefined) return '';
  let texte = typeof valeur === 'object' ? JSON.stringify(valeur) : String(valeur);
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  if (/[";\n\r]/.test(texte)) texte = `"${texte.replace(/"/g, '""')}"`;
  return texte;
}

/**
 * @param {Array<{ header: string, value: (row: any) => unknown }>} colonnes
 * @param {any[]} lignes
 */
export function versCsv(colonnes, lignes) {
  const entete = colonnes.map((c) => cellule(c.header)).join(';');
  const corps = lignes.map((l) => colonnes.map((c) => cellule(c.value(l))).join(';'));
  return [entete, ...corps].join('\r\n');
}

export function telechargerCsv(nomFichier, colonnes, lignes) {
  const blob = new Blob(['﻿', versCsv(colonnes, lignes)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier.endsWith('.csv') ? nomFichier : `${nomFichier}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
