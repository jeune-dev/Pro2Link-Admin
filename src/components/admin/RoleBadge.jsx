import { Building2, ShieldCheck } from 'lucide-react';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';

/**
 * Distingue nettement l'administrateur GLOBAL de Pro2Link (super_admin) des
 * utilisateurs appartenant aux entreprises clientes. Couleur de marque (pas un
 * état) + icône + libellé de l'API.
 */
export default function RoleBadge({ role }) {
  const { libelle } = useReferentiels();
  const superAdmin = role === 'super_admin';
  const Icone = superAdmin ? ShieldCheck : Building2;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-legende font-semibold ${
        superAdmin ? 'bg-primaire text-sur-primaire' : 'border border-bordure-forte text-texte-secondaire'
      }`}
    >
      <Icone className="size-3.5" aria-hidden />
      {libelle('roles', role)}
    </span>
  );
}
