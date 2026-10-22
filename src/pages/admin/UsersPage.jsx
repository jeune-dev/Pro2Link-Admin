import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, UserPlus, Users } from 'lucide-react';
import { listerUtilisateurs } from '../../services/userService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import StatusBadge, { Badge } from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import FilterBar, { FilterSelect, SearchInput } from '../../components/tables/FilterBar.jsx';
import { OptionsReferentiel } from '../../components/forms/Field.jsx';
import RoleBadge from '../../components/admin/RoleBadge.jsx';
import CreateSuperAdminDialog from '../../components/admin/CreateSuperAdminDialog.jsx';
import { formatDate, formatRelatif, nomComplet } from '../../utils/format.js';

const DEFAUTS = { q: '', role: '', status: '', verrouille: '', tri: '-created_at', page: '1', limit: '20' };

export default function UsersPage() {
  const { filtres, changer, reinitialiser, actifs } = useUrlFilters(DEFAUTS);
  const { options } = useReferentiels();
  const toast = useToast();
  const navigate = useNavigate();
  const [creation, setCreation] = useState(false);

  const cle = JSON.stringify(filtres);
  const liste = useApiQuery((s) => listerUtilisateurs({ ...filtres, page: Number(filtres.page), limit: Number(filtres.limit) }, s), [cle]);

  const colonnes = [
    {
      key: 'last_name', header: 'Utilisateur', sortKey: 'last_name', principal: true,
      render: (u) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-texte">{nomComplet(u)}</p>
          <p className="truncate text-legende text-texte-secondaire">{u.email || '—'}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Type de compte', render: (u) => <RoleBadge role={u.role_code} /> },
    { key: 'phone', header: 'Téléphone', masquerMobile: true, render: (u) => u.phone || '—' },
    {
      key: 'securite', header: 'Sécurité',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.totp_enabled_at
            ? <Badge ton="succes">Double auth.</Badge>
            : u.role_code === 'super_admin' ? <Badge ton="avertissement">Double auth. à configurer</Badge> : null}
          {u.is_locked ? <Badge ton="danger">Verrouillé</Badge> : null}
          {u.must_change_password ? <Badge ton="info">Mot de passe provisoire</Badge> : null}
          {!u.totp_enabled_at && u.role_code !== 'super_admin' && !u.is_locked && !u.must_change_password ? <span className="text-texte-discret">—</span> : null}
        </div>
      ),
    },
    { key: 'status', header: 'Statut', render: (u) => <StatusBadge famille="membre" refKey="statut_utilisateur" code={u.status} /> },
    { key: 'last_login_at', header: 'Dernière connexion', sortKey: 'last_login_at', render: (u) => (u.last_login_at ? formatRelatif(u.last_login_at) : 'Jamais') },
    { key: 'created_at', header: 'Créé le', sortKey: 'created_at', render: (u) => <span className="whitespace-nowrap">{formatDate(u.created_at)}</span> },
  ];

  return (
    <>
      <PageHeader
        titre="Utilisateurs"
        ariane={[{ label: 'Utilisateurs' }]}
        description="Comptes de la plateforme : super administrateurs Pro2Link et utilisateurs des entreprises clientes."
        actions={<Button variante="secondaire" icone={UserPlus} onClick={() => setCreation(true)}>Nouveau super admin</Button>}
      />

      <Card corpsClassName="p-0">
        <FilterBar actifs={actifs} onReinitialiser={reinitialiser}>
          <SearchInput valeur={filtres.q} onChange={(q) => changer({ q })} placeholder="Nom, e-mail ou téléphone…" label="Rechercher un utilisateur" />
          <FilterSelect label="Type de compte" valeur={filtres.role} onChange={(role) => changer({ role })}>
            <OptionsReferentiel options={options('roles')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Statut" valeur={filtres.status} onChange={(status) => changer({ status })}>
            <OptionsReferentiel options={options('statut_utilisateur')} vide="Tous" />
          </FilterSelect>
          <FilterSelect label="Verrouillage" valeur={filtres.verrouille} onChange={(verrouille) => changer({ verrouille })}>
            <option value="">Tous</option>
            <option value="true">Verrouillés</option>
            <option value="false">Non verrouillés</option>
          </FilterSelect>
        </FilterBar>

        <DataTable
          caption="Liste des utilisateurs"
          colonnes={colonnes}
          lignes={liste.data?.items}
          chargement={liste.loading}
          erreur={liste.error}
          onRetry={liste.reload}
          tri={filtres.tri}
          onTri={(tri) => changer({ tri })}
          onLigne={(u) => navigate(`/utilisateurs/${u.id}`)}
          libelleLigne={(u) => `Ouvrir le profil de ${nomComplet(u)}`}
          vide={<EmptyState icone={Users} titre="Aucun utilisateur" message="Aucun compte ne correspond à ces critères." />}
        />
        {!liste.error ? (
          <Pagination pagination={liste.data?.pagination} onPage={(page) => changer({ page: String(page) })} onLimit={(limit) => changer({ limit: String(limit) })} />
        ) : null}
      </Card>

      <p className="mt-3 flex items-start gap-2 text-legende text-texte-discret">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        L’API ne propose ni filtre par entreprise ni modification des rôles : l’entreprise et le rôle interne de chaque utilisateur sont consultables sur sa fiche.
        Les rôles internes sont gérés par l’administrateur de chaque entreprise.
      </p>

      <CreateSuperAdminDialog
        ouvert={creation}
        onFermer={() => setCreation(false)}
        onSucces={({ message, data }) => {
          toast.succes(message);
          setCreation(false);
          if (data?.user?.id) navigate(`/utilisateurs/${data.user.id}`);
          else liste.reload();
        }}
      />
    </>
  );
}
