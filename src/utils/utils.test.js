import { describe, expect, it } from 'vitest';
import { formatMontant, formatMois, initiales, nomComplet } from './format.js';
import { versCsv } from './csv.js';
import { cumul, inscriptionsParMois, moisEntre, serieMensuelle } from './stats.js';
import { tonDe } from '../theme/statuts.js';
import { etapeRequise, normaliserUtilisateur } from '../contexts/AuthContext.jsx';

describe('format', () => {
  it('affiche les montants en FCFA sans décimale', () => {
    expect(formatMontant(4250000).replace(/\s/g, ' ')).toBe('4 250 000 FCFA');
    expect(formatMontant(null)).toBe('—');
  });
  it('formate un mois et un nom', () => {
    expect(formatMois('2026-10')).toMatch(/oct/);
    expect(nomComplet({ first_name: 'Awa', last_name: 'Diop' })).toBe('Awa Diop');
    expect(initiales('Hôtel Teranga')).toBe('HT');
  });
});

describe('csv', () => {
  it('échappe les séparateurs et neutralise les formules', () => {
    const csv = versCsv([{ header: 'Nom', value: (r) => r.n }], [{ n: 'A;B' }, { n: '=1+1' }]);
    expect(csv).toBe('Nom\r\n"A;B"\r\n\'=1+1');
  });
});

describe('stats', () => {
  it('liste les mois d’une période', () => {
    expect(moisEntre('2025-11-01', '2026-02-10')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
  it('agrège les inscriptions par mois et complète à zéro', () => {
    const lignes = inscriptionsParMois(
      [{ month: '2026-10', type: 'acheteur', count: 3 }, { month: '2026-10', type: 'mixte', count: 1 }],
      { start: '2026-09-01', end: '2026-10-21' },
      ['acheteur', 'fournisseur', 'mixte'],
    );
    expect(lignes).toEqual([
      { month: '2026-09', total: 0, acheteur: 0, fournisseur: 0, mixte: 0 },
      { month: '2026-10', total: 4, acheteur: 3, fournisseur: 0, mixte: 1 },
    ]);
    expect(cumul(lignes).map((l) => l.cumul)).toEqual([0, 4]);
  });
  it('complète une série mensuelle', () => {
    const s = serieMensuelle([{ month: '2026-10', count: 2, amount: 10 }], { start: '2026-09-01', end: '2026-10-01' }, ['count']);
    expect(s).toEqual([{ month: '2026-09', count: 0 }, { month: '2026-10', count: 2 }]);
  });
});

describe('statuts (charte § 5)', () => {
  it('donne le ton d’un statut et neutre pour un code inconnu', () => {
    expect(tonDe('entreprise', 'suspendu')).toBe('danger');
    expect(tonDe('abonnement', 'essai')).toBe('info');
    expect(tonDe('abonnement', 'nouveau_code')).toBe('neutre');
  });
});

describe('session', () => {
  it('exige le changement du mot de passe provisoire avant la MFA', () => {
    const u = normaliserUtilisateur({ role: 'super_admin', must_change_password: true, mfa_active: false });
    expect(etapeRequise(u)).toBe('mot_de_passe');
  });
  it('exige la double authentification d’un super admin', () => {
    expect(etapeRequise(normaliserUtilisateur({ role_code: 'super_admin', totp_enabled_at: null }))).toBe('configuration_mfa');
    expect(etapeRequise(normaliserUtilisateur({ role_code: 'super_admin', totp_enabled_at: '2026-10-01T00:00:00Z' }))).toBeNull();
  });
  it('n’impose pas la MFA à un compte entreprise', () => {
    expect(etapeRequise(normaliserUtilisateur({ role: 'utilisateur', mfa_active: false }))).toBeNull();
  });
});
