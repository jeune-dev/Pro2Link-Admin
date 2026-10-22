import { useCallback, useEffect, useRef, useState } from 'react';

/** Menu déroulant : fermeture au clic extérieur et à la touche Échap (focus rendu au déclencheur). */
export function useDropdown() {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef(null);
  const declencheur = useRef(null);

  const fermer = useCallback((rendreFocus = false) => {
    setOuvert(false);
    if (rendreFocus) declencheur.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return undefined;
    const clic = (e) => { if (!conteneur.current?.contains(e.target)) setOuvert(false); };
    const touche = (e) => { if (e.key === 'Escape') fermer(true); };
    document.addEventListener('mousedown', clic);
    document.addEventListener('keydown', touche);
    return () => {
      document.removeEventListener('mousedown', clic);
      document.removeEventListener('keydown', touche);
    };
  }, [ouvert, fermer]);

  return { ouvert, setOuvert, basculer: () => setOuvert((o) => !o), fermer, conteneur, declencheur };
}
