import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { ApiError, nettoyerParams, toApiError } from './api.js';

function erreurAxios(status, data, headers = {}) {
  const e = new AxiosError('échec', 'ERR_BAD_RESPONSE');
  e.response = { status, data, headers, statusText: '', config: {} };
  return e;
}

describe('toApiError', () => {
  it('reprend le code stable et le message rédigé par l’API', () => {
    const e = toApiError(erreurAxios(409, {
      success: false, message: 'Déjà suspendue', error: { code: 'DEJA_SUSPENDU', message: 'Déjà suspendue', details: [] }, requestId: 'req-1',
    }));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(409);
    expect(e.code).toBe('DEJA_SUSPENDU');
    expect(e.message).toBe('Déjà suspendue');
    expect(e.requestId).toBe('req-1');
  });

  it('conserve les détails de validation (422)', () => {
    const e = toApiError(erreurAxios(422, { error: { code: 'DONNEES_INVALIDES', message: 'Données invalides', details: ['"reason" is required'] } }));
    expect(e.details).toEqual(['"reason" is required']);
  });

  it('masque les détails internes d’une erreur 5xx', () => {
    const e = toApiError(erreurAxios(500, { error: { code: 'ERREUR_INTERNE', message: 'SequelizeDatabaseError: relation…', details: ['stack'] }, requestId: 'r' }));
    expect(e.message).not.toMatch(/Sequelize/);
    expect(e.details).toEqual([]);
    expect(e.requestId).toBe('r');
  });

  it('lit Retry-After (429)', () => {
    const e = toApiError(erreurAxios(429, { error: { code: 'TROP_DE_REQUETES', message: 'Trop de requêtes' } }, { 'retry-after': '120' }));
    expect(e.retryAfter).toBe(120);
  });

  it('distingue l’erreur réseau et l’annulation', () => {
    const reseau = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(toApiError(reseau).code).toBe('ERREUR_RESEAU');
    const annulee = new AxiosError('canceled', 'ERR_CANCELED');
    expect(toApiError(annulee).annulee).toBe(true);
  });
});

describe('nettoyerParams', () => {
  it('retire les filtres vides', () => {
    expect(nettoyerParams({ q: '', status: 'actif', page: 1, plan: null, type: undefined })).toEqual({ status: 'actif', page: 1 });
  });
});
