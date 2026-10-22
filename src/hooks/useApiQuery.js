import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lecture d'une ressource API avec annulation (AbortController) à chaque
 * changement de paramètres ou au démontage : une réponse obsolète n'écrase
 * jamais une réponse plus récente.
 *
 *   const { data, error, loading, reload } = useApiQuery((signal) => listerEntreprises(params, signal), [cle]);
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {unknown[]} deps
 * @param {{ enabled?: boolean }} [options]
 */
export function useApiQuery(fetcher, deps, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef.current(ctrl.signal)
      .then((d) => {
        if (!ctrl.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted && !e?.annulee) setError(e);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, enabled]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload, setData };
}
