import { useEffect, useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';

/** Barre de filtres d'une liste (recherche + sélecteurs + réinitialisation). */
export default function FilterBar({ children, actifs = 0, onReinitialiser }) {
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-bordure p-4 lg:flex lg:flex-row lg:flex-wrap lg:items-end">
      {children}
      {actifs > 0 && onReinitialiser ? (
        <button
          type="button"
          onClick={onReinitialiser}
          className="col-span-2 inline-flex min-h-10 items-center gap-1.5 justify-self-start rounded-champ px-2 text-petit font-medium text-primaire hover:bg-primaire-teinte lg:self-end"
        >
          <X className="size-4" aria-hidden /> Effacer les filtres ({actifs})
        </button>
      ) : null}
    </div>
  );
}

/** Recherche avec temporisation (évite une requête par frappe). */
export function SearchInput({ valeur, onChange, placeholder = 'Rechercher…', label = 'Rechercher', className = '' }) {
  const [texte, setTexte] = useState(valeur || '');
  const temporise = useDebounce(texte, 350);
  const id = useId();

  // Synchronisation depuis l'URL (filtres effacés, retour arrière) sans écraser
  // la saisie en cours (espaces de fin conservés pendant la frappe).
  useEffect(() => {
    setTexte((t) => (t.trim() === (valeur || '') ? t : valeur || ''));
  }, [valeur]);
  useEffect(() => {
    if (temporise.trim() !== (valeur || '')) onChange(temporise.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporise]);

  return (
    <div className={`relative col-span-2 min-w-0 flex-1 lg:min-w-64 ${className}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texte-discret" aria-hidden />
      <input
        id={id}
        type="search"
        value={texte}
        maxLength={100}
        onChange={(e) => setTexte(e.target.value)}
        placeholder={placeholder}
        className="pl-champ pl-9 text-petit"
      />
    </div>
  );
}

/** Sélecteur compact de filtre. */
export function FilterSelect({ label, valeur, onChange, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 lg:w-44 ${className}`}>
      <span className="text-legende font-medium text-texte-secondaire">{label}</span>
      <select className="pl-champ text-petit" value={valeur} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}

/** Filtre de date (AAAA-MM-JJ). */
export function FilterDate({ label, valeur, onChange, min, max }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 lg:w-40">
      <span className="text-legende font-medium text-texte-secondaire">{label}</span>
      <input type="date" className="pl-champ text-petit" value={valeur || ''} min={min} max={max} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
