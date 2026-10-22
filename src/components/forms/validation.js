import { z } from 'zod';

/**
 * Règles reprises des schémas Joi du backend (validation côté client pour le
 * confort uniquement : le serveur reste juge).
 */
export const MOT_DE_PASSE_REGLE = '8 caractères minimum, avec une majuscule, une minuscule et un chiffre.';

export const motDePasseFort = z
  .string()
  .min(8, MOT_DE_PASSE_REGLE)
  .max(128, '128 caractères maximum.')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, MOT_DE_PASSE_REGLE);

export const codeTotp = z.string().trim().regex(/^\d{6}$/, 'Le code contient 6 chiffres.');

export const email = z.string().trim().min(1, 'L’adresse e-mail est obligatoire.').max(254).email('Adresse e-mail invalide.');

/** Téléphone facultatif : E.164 ou numéro sénégalais à 9 chiffres (normalisé par l'API). */
export const telephoneFacultatif = z
  .string()
  .trim()
  .max(25)
  .refine((v) => !v || /^\+?[0-9 ().-]{8,20}$/.test(v), 'Numéro de téléphone invalide.')
  .optional()
  .or(z.literal(''));

/** Convertit '' en null (champs facultatifs « null accepté » côté API). */
export const videVersNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);

/** Entier facultatif : '' → null, sinon nombre. */
export function entierOuNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}
