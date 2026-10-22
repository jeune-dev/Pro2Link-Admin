export default function Card({ titre, description, actions, children, className = '', corpsClassName = '', as: Tag = 'section' }) {
  return (
    <Tag className={`rounded-carte border border-bordure bg-surface shadow-douce ${className}`}>
      {titre || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-bordure px-5 py-4">
          <div className="min-w-0">
            {titre ? <h2 className="text-corps font-semibold text-texte">{titre}</h2> : null}
            {description ? <p className="mt-0.5 text-petit text-texte-secondaire">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={corpsClassName || 'p-5'}>{children}</div>
    </Tag>
  );
}

/** Liste de propriétés « libellé : valeur » (fiches détaillées). */
export function DetailList({ items, colonnes = 2 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${colonnes === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.filter(Boolean).map((it) => (
        <div key={it.label} className={it.large ? 'sm:col-span-2' : ''}>
          <dt className="text-legende font-medium uppercase tracking-wide text-texte-secondaire">{it.label}</dt>
          <dd className="mt-1 break-words text-petit text-texte">
            {it.value === null || it.value === undefined || it.value === '' ? <span className="text-texte-discret">Non renseigné</span> : it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
