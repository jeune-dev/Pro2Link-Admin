import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getReferentiels } from '../services/referentielService.js';

/**
 * Énumérations de l'API (GET /referentiels) : libellés des statuts, types,
 * secteurs, rôles… Un code inconnu s'affiche tel quel (jamais de libellé inventé).
 */
const ReferentielsContext = createContext(null);

export function ReferentielsProvider({ children }) {
  const [enumerations, setEnumerations] = useState({});
  const [etat, setEtat] = useState('chargement');

  useEffect(() => {
    const ctrl = new AbortController();
    getReferentiels(ctrl.signal)
      .then((data) => {
        setEnumerations(data?.enumerations || {});
        setEtat('pret');
      })
      .catch((e) => {
        if (!e?.annulee) setEtat('erreur');
      });
    return () => ctrl.abort();
  }, []);

  const options = useCallback((cle) => enumerations[cle] || [], [enumerations]);

  const libelle = useCallback((cle, code) => {
    if (code === null || code === undefined || code === '') return '—';
    return enumerations[cle]?.find((e) => e.code === code)?.label || code;
  }, [enumerations]);

  const valeur = useMemo(() => ({ etat, options, libelle }), [etat, options, libelle]);
  return <ReferentielsContext.Provider value={valeur}>{children}</ReferentielsContext.Provider>;
}

export function useReferentiels() {
  const ctx = useContext(ReferentielsContext);
  if (!ctx) throw new Error('useReferentiels doit être utilisé dans <ReferentielsProvider>');
  return ctx;
}
