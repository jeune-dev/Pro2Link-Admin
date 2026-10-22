import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, Building2, KeyRound, LockOpen, UserCheck, UserX } from 'lucide-react';
import {
  activerUtilisateur, desactiverUtilisateur, deverrouillerUtilisateur, getUtilisateur, reinitialiserAcces,
} from '../../services/userService.js';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useReferentiels } from '../../contexts/ReferentielsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { DetailList } from '../../components/common/Card.jsx';
import Button, { ButtonLink } from '../../components/common/Button.jsx';
import StatusBadge, { Badge } from '../../components/common/StatusBadge.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Notice from '../../components/common/Notice.jsx';
import CopyButton from '../../components/common/CopyButton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { ErrorState } from '../../components/common/ErrorAlert.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import RoleBadge from '../../components/admin/RoleBadge.jsx';
import { formatDateHeure, formatNombre, initiales, nomComplet } from '../../utils/format.js';

/** Paramètres de chaque action sensible (routes /admin/utilisateurs/:id/...). */
const ACTIONS = {
  desactiver: { titre: 'Désactiver ce compte ?', libelle: 'Désactiver', ton: 'danger', motif: 'obligatoire', texte: 'Le compte ne pourra plus se connecter. Ses sessions ouvertes seront révoquées par le serveur.' },
  activer: { titre: 'Réactiver ce compte ?', libelle: 'Réactiver', texte: 'Le compte pourra de nouveau se connecter.' },
  deverrouiller: { titre: 'Déverrouiller ce compte ?', libelle: 'Déverrouiller', texte: 'Le compte a été bloqué après plusieurs échecs de connexion. Le déverrouillage permet de nouvelles tentatives.' },
  reinitialiser: {
    titre: 'Réinitialiser l’accès ?', libelle: 'Réinitialiser l’accès', ton: 'danger', motif: 'obligatoire', motifMax: 500, motDePasse: true,
    texte: 'Un mot de passe provisoire sera généré. Le compte devra le changer à sa prochaine connexion ; sa double authentification, si elle était active, sera à reconfigurer. Ses sessions seront révoquées. Le mot de passe ne sera affiché qu’une seule fois.',
  },
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const { user: moi } = useAuth();
  const { libelle } = useReferentiels();
  const toast = useToast();
  const { data, error, loading, reload } = useApiQuery((s) => getUtilisateur(id, s), [id]);
  const [action, setAction] = useState(null);
  const [provisoire, setProvisoire] = useState(null);

  const u = data?.user;
  if (loading && !u) return <PageSpinner />;
  if (error && !u) {
    return (
      <>
        <PageHeader titre="Utilisateur" ariane={[{ label: 'Utilisateurs', to: '/utilisateurs' }, { label: 'Profil' }]} />
        <Card><ErrorState erreur={error} onRetry={reload} /></Card>
        <ButtonLink to="/utilisateurs" variante="neutre" className="mt-4">Retour à la liste</ButtonLink>
      </>
    );
  }
  if (!u) return null;

  const estMoi = moi?.id === u.id;
  const superAdmin = u.role_code === 'super_admin';
  const actif = u.status === 'actif';
  const conf = action ? ACTIONS[action] : null;

  async function confirmer(valeurs) {
    let res;
    if (action === 'desactiver') res = await desactiverUtilisateur(u.id, valeurs.reason);
    else if (action === 'activer') res = await activerUtilisateur(u.id);
    else if (action === 'deverrouiller') res = await deverrouillerUtilisateur(u.id);
    else res = await reinitialiserAcces(u.id, { current_password: valeurs.current_password, reason: valeurs.reason });
    setAction(null);
    if (res.data?.mot_de_passe_provisoire) setProvisoire({ motDePasse: res.data.mot_de_passe_provisoire, message: res.message });
    else toast.succes(res.message);
    reload();
  }

  return (
    <>
      <PageHeader
        titre={nomComplet(u)}
        ariane={[{ label: 'Utilisateurs', to: '/utilisateurs' }, { label: nomComplet(u) }]}
        badge={<><RoleBadge role={u.role_code} /><StatusBadge famille="membre" refKey="statut_utilisateur" code={u.status} /></>}
        description={u.email || u.phone}
        actions={estMoi ? (
          <ButtonLink to="/compte" variante="neutre">Gérer mon compte</ButtonLink>
        ) : (
          <>
            {u.is_locked ? <Button variante="neutre" icone={LockOpen} onClick={() => setAction('deverrouiller')}>Déverrouiller</Button> : null}
            <Button variante="neutre" icone={KeyRound} onClick={() => setAction('reinitialiser')}>Réinitialiser l’accès</Button>
            {actif
              ? <Button variante="danger-contour" icone={UserX} onClick={() => setAction('desactiver')}>Désactiver</Button>
              : <Button icone={UserCheck} onClick={() => setAction('activer')}>Réactiver</Button>}
          </>
        )}
      />

      {estMoi ? <Notice className="mb-6">C’est votre propre compte : les actions d’administration sur soi-même sont refusées par l’API.</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card titre="Profil">
            <div className="mb-5 flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-primaire text-sous-titre font-semibold text-sur-primaire" aria-hidden>{initiales(nomComplet(u))}</span>
              <div>
                <p className="font-semibold text-texte">{nomComplet(u)}</p>
                <p className="text-petit text-texte-secondaire">{superAdmin ? 'Administrateur global de la plateforme' : 'Utilisateur d’une entreprise cliente'}</p>
              </div>
            </div>
            <DetailList
              items={[
                { label: 'Prénom', value: u.first_name },
                { label: 'Nom', value: u.last_name },
                { label: 'E-mail', value: u.email },
                { label: 'E-mail vérifié', value: u.email_verified_at ? `Oui, le ${formatDateHeure(u.email_verified_at)}` : 'Non' },
                { label: 'Téléphone', value: u.phone },
                { label: 'Langue', value: u.language === 'en' ? 'Anglais' : u.language === 'fr' ? 'Français' : u.language },
                { label: 'Compte créé le', value: formatDateHeure(u.created_at) },
                { label: 'Dernière connexion', value: u.last_login_at ? formatDateHeure(u.last_login_at) : 'Jamais' },
              ]}
            />
          </Card>

          <Card titre="Entreprises associées" description={superAdmin ? 'Un super administrateur n’appartient à aucune entreprise.' : 'Appartenance et rôle interne dans chaque entreprise.'} corpsClassName="p-0">
            {u.memberships?.length ? (
              <ul className="divide-y divide-bordure">
                {u.memberships.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="flex size-9 items-center justify-center rounded-champ bg-primaire-teinte text-primaire"><Building2 className="size-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/entreprises/${m.company?.id || m.company_id}`} className="font-semibold text-texte hover:text-primaire">{m.company?.name || 'Entreprise'}</Link>
                      <p className="text-legende text-texte-secondaire">
                        {libelle('roles_entreprise', m.role_code)} · {m.company ? libelle('type_entreprise', m.company.type) : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge famille="membre" refKey="statut_membre" code={m.status} />
                      {m.company?.status ? <StatusBadge famille="entreprise" refKey="statut_entreprise" code={m.company.status} /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <EmptyState compact icone={Building2} titre={superAdmin ? 'Compte de la plateforme' : 'Aucune entreprise associée'} />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card titre="Sécurité">
            <ul className="space-y-3 text-petit">
              <li className="flex items-center justify-between gap-3">
                <span className="text-texte-secondaire">Double authentification</span>
                {u.totp_enabled_at ? <Badge ton="succes">Active</Badge> : <Badge ton={superAdmin ? 'avertissement' : 'neutre'}>{superAdmin ? 'À configurer' : 'Inactive'}</Badge>}
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-texte-secondaire">Verrouillage</span>
                {u.is_locked ? <Badge ton="danger">Verrouillé</Badge> : <Badge ton="succes">Non verrouillé</Badge>}
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-texte-secondaire">Mot de passe</span>
                {u.must_change_password ? <Badge ton="info">Provisoire</Badge> : <Badge ton="neutre" icone={false}>Personnel</Badge>}
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-texte-secondaire">Sessions actives</span>
                <span className="font-semibold text-texte chiffres">{formatNombre(u.active_sessions ?? 0)}</span>
              </li>
            </ul>
          </Card>
          <Card titre="Traçabilité">
            <ButtonLink to={`/activite?user_id=${u.id}`} variante="neutre" taille="sm" icone={Activity}>Actions de cet utilisateur</ButtonLink>
          </Card>
        </div>
      </div>

      <ActionDialog
        ouvert={Boolean(action)}
        onFermer={() => setAction(null)}
        titre={conf?.titre}
        contexte={conf ? (<><p className="font-semibold">{nomComplet(u)} · {u.email}</p><p className="mt-1 text-texte-secondaire">{conf.texte}</p></>) : null}
        motif={conf?.motif || null}
        motifMax={conf?.motifMax}
        motDePasse={Boolean(conf?.motDePasse)}
        ton={conf?.ton}
        libelleConfirmer={conf?.libelle || 'Confirmer'}
        onConfirmer={confirmer}
      />

      <Modal
        ouvert={Boolean(provisoire)}
        onFermer={() => setProvisoire(null)}
        titre="Mot de passe provisoire"
        pied={<Button onClick={() => setProvisoire(null)}>J’ai transmis le mot de passe</Button>}
      >
        {provisoire ? (
          <div className="space-y-4">
            <Notice ton="avertissement">{provisoire.message}</Notice>
            <div className="flex flex-wrap items-center gap-3 rounded-champ border border-bordure bg-surface-alt p-3">
              <code className="flex-1 break-all font-mono text-corps text-texte">{provisoire.motDePasse}</code>
              <CopyButton texte={provisoire.motDePasse} />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
