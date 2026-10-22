import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtres, tri et pagination conservés dans l'URL : une liste filtrée se
 * partage, se met en favori et survit au bouton « Précédent ».
 *
 * @param {Record<string, string>} defauts valeurs par défaut (absentes de l'URL)
 */
export function useUrlFilters(defauts) {
  const [params, setParams] = useSearchParams();

  const filtres = useMemo(() => {
    const f = { ...defauts };
    for (const cle of Object.keys(defauts)) {
      const v = params.get(cle);
      if (v !== null) f[cle] = v;
    }
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /** Modifie un ou plusieurs filtres ; revient en page 1 sauf si `page` est fourni. */
  const changer = useCallback((modifs) => {
    setParams((prec) => {
      const suivant = new URLSearchParams(prec);
      const avecPage = Object.prototype.hasOwnProperty.call(modifs, 'page');
      for (const [cle, valeur] of Object.entries(modifs)) {
        if (valeur === '' || valeur === null || valeur === undefined || valeur === defauts[cle]) suivant.delete(cle);
        else suivant.set(cle, String(valeur));
      }
      if (!avecPage) suivant.delete('page');
      return suivant;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams]);

  const reinitialiser = useCallback(() => {
    setParams((prec) => {
      const suivant = new URLSearchParams(prec);
      for (const cle of Object.keys(defauts)) suivant.delete(cle);
      return suivant;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams]);

  const actifs = Object.keys(defauts).filter((c) => c !== 'page' && c !== 'tri' && filtres[c] !== defauts[c]).length;

  return { filtres, changer, reinitialiser, actifs };
}
