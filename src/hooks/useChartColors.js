import { useEffect, useState } from 'react';
import { couleurCalculee } from '../theme/statuts.js';

function lireVar(nom) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
}

function lire() {
  return {
    series: [lireVar('--viz-1'), lireVar('--viz-2'), lireVar('--viz-3')],
    grille: couleurCalculee('bordure'),
    axe: couleurCalculee('texte-secondaire'),
    texte: couleurCalculee('texte'),
    surface: couleurCalculee('surface'),
    succes: couleurCalculee('succes'),
    danger: couleurCalculee('danger'),
    info: couleurCalculee('info'),
    avertissement: couleurCalculee('avertissement'),
    neutre: couleurCalculee('neutre'),
  };
}

/**
 * Couleurs RÉELLES du thème courant pour Recharts (qui n'accepte pas les
 * variables CSS dans tous les navigateurs). Relues au changement de thème
 * (préférence système ou attribut data-theme).
 */
export function useChartColors() {
  const [couleurs, setCouleurs] = useState(lire);

  useEffect(() => {
    const maj = () => setCouleurs(lire());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', maj);
    const obs = new MutationObserver(maj);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', maj);
      obs.disconnect();
    };
  }, []);

  return couleurs;
}
