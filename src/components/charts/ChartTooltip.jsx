/** Infobulle Recharts aux couleurs de la charte (texte en encre, pastille de couleur pour l'identité). */
export default function ChartTooltip({ active, payload, label, formatLabel, formatValeur }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-champ border border-bordure bg-surface px-3 py-2 text-legende shadow-elevee">
      {label !== undefined ? <p className="mb-1 font-semibold text-texte">{formatLabel ? formatLabel(label) : label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey ?? p.name} className="flex items-center gap-2 text-texte-secondaire">
            <span className="size-2 rounded-sm" style={{ background: p.color || p.payload?.fill }} aria-hidden />
            <span>{p.name}</span>
            <span className="ml-auto pl-3 font-semibold text-texte chiffres">{formatValeur ? formatValeur(p.value, p) : p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
