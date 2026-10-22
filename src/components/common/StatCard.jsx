import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

/** Indicateur clé (tuile). Cliquable vers la page correspondante quand `to` est fourni. */
export default function StatCard({ label, valeur, note, icone: Icone, to, chargement = false, ton = 'primaire' }) {
  const pastille = {
    primaire: 'bg-primaire-teinte text-primaire',
    succes: 'bg-succes-fond text-succes',
    danger: 'bg-danger-fond text-danger',
    info: 'bg-info-fond text-info',
    secondaire: 'bg-secondaire-teinte text-secondaire-survol',
  }[ton];

  const corps = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-petit font-medium text-texte-secondaire">{label}</p>
        {Icone ? <span className={`flex size-9 shrink-0 items-center justify-center rounded-champ ${pastille}`}><Icone className="size-[18px]" aria-hidden /></span> : null}
      </div>
      {chargement ? <div className="squelette mt-2 h-8 w-24" /> : (
        <p className="mt-1 text-chiffre-cle font-semibold leading-tight tracking-tight text-texte chiffres">{valeur}</p>
      )}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-legende text-texte-secondaire">{chargement ? ' ' : note}</p>
        {to ? <ArrowUpRight className="size-4 text-texte-discret transition-colors group-hover:text-primaire" aria-hidden /> : null}
      </div>
    </>
  );

  const classes = 'group block rounded-carte border border-bordure bg-surface p-5 shadow-douce';
  if (to) {
    return <Link to={to} className={`${classes} transition-all hover:-translate-y-0.5 hover:border-primaire/30 hover:shadow-elevee`}>{corps}</Link>;
  }
  return <div className={classes}>{corps}</div>;
}
