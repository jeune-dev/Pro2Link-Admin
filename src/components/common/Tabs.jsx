/** Onglets en liens de navigation (état dans l'URL), accessibles au clavier. */
export default function Tabs({ onglets, actif, onChange, label }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1 border-b border-bordure px-1">
        {onglets.map((o) => {
          const sel = o.id === actif;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={sel}
              tabIndex={sel ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={(e) => {
                const i = onglets.findIndex((x) => x.id === actif);
                if (e.key === 'ArrowRight') onChange(onglets[(i + 1) % onglets.length].id);
                if (e.key === 'ArrowLeft') onChange(onglets[(i - 1 + onglets.length) % onglets.length].id);
              }}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-petit font-semibold transition-colors ${
                sel ? 'border-primaire text-primaire' : 'border-transparent text-texte-secondaire hover:text-texte'
              }`}
            >
              {o.icone ? <o.icone aria-hidden className="size-4" /> : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
