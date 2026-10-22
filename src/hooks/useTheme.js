import { useCallback, useState } from 'react';

const CLE = 'pl-theme';

function lire() {
  try {
    const v = localStorage.getItem(CLE);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Préférence d'affichage (locale au navigateur) : système, clair ou sombre. */
export function useTheme() {
  const [theme, setThemeState] = useState(lire);

  const setTheme = useCallback((valeur) => {
    const racine = document.documentElement;
    if (valeur === 'light' || valeur === 'dark') racine.setAttribute('data-theme', valeur);
    else racine.removeAttribute('data-theme');
    try {
      if (valeur === 'system') localStorage.removeItem(CLE);
      else localStorage.setItem(CLE, valeur);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
    setThemeState(valeur);
  }, []);

  return { theme, setTheme };
}
