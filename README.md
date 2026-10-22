# Pro2Link Admin — back-office du super administrateur

Back-office de supervision de la plateforme Pro2Link, réservé au rôle `super_admin` (double authentification
obligatoire). Déployable seul, par exemple sur `admin.pro2link.sn`.

Le **site vitrine** est un projet distinct : `pro2link-site`. Les deux utilisent la même API Pro2Link
(`b2b_back`, préfixe `/api/v1`, contrat `b2b_back/docs/CONTRAT-API-ADMIN.md`) sans la modifier.

## Écrans

| Route | Contenu |
|---|---|
| `/connexion` | Connexion, double authentification, mot de passe provisoire, première configuration de la double authentification (QR code, codes de secours) |
| `/` | Tableau de bord : indicateurs, inscriptions, répartition par statut, activité du mois, dernières entreprises, activité récente |
| `/entreprises`, `/entreprises/:id` | Liste filtrable, fiche, suspension / réactivation, activation ou renouvellement d’abonnement |
| `/utilisateurs`, `/utilisateurs/:id` | Liste filtrable, profil, création d’un super admin, désactivation, déverrouillage, réinitialisation d’accès |
| `/abonnements` | Abonnements, paiements d’abonnement, forfaits (création, modification, activation, suppression) |
| `/statistiques` | Statistiques de la plateforme par période, export CSV |
| `/activite` | Journal d’audit |
| `/parametres` | Paramètres de la plateforme, diffusion de notifications, rôles et permissions (lecture seule), affichage |
| `/compte` | Profil, mot de passe, codes de secours, sessions ouvertes |

Un compte entreprise qui se connecte ici est déconnecté aussitôt (l’API refuserait de toute façon `/admin/*`).

## Stack

Vite 8 · React 19 · React Router 7 · Tailwind CSS 4 (charte `--pl-*`, clair et sombre) · Axios · Lucide React ·
Recharts · React Hook Form + Zod · qrcode.react · Vitest.

## Installation et lancement local

Prérequis : Node.js 20 ou plus, et le backend `b2b_back` démarré sur `http://localhost:3000`
(PostgreSQL, Redis, `npm run migrate`, `npm run init` pour le premier super admin).

```bash
npm install
```

```bash
npm run dev
```

Le back-office est servi sur http://localhost:5174 (port suivant si occupé). Le **proxy Vite** redirige `/api` et
`/health` vers le backend.

```bash
npm run build
```

```bash
npm test
```

## Variables d’environnement

Voir [.env.example](.env.example). Les variables `VITE_*` sont **publiques** : aucun secret.

| Variable | Rôle |
|---|---|
| `VITE_API_BASE_URL` | Base de l’API (`/api/v1` derrière le proxy ou le reverse proxy ; sinon URL complète) |
| `VITE_API_PROXY_TARGET` | Développement : backend ciblé par le proxy Vite |
| `VITE_BASE_PATH` | Chemin de publication : `/` (racine d’un sous-domaine, par défaut) ou par ex. `/admin/` |
| `VITE_SITE_URL` | Site vitrine (lien « Retour au site », renvoi des comptes entreprise) |

## Déploiement

- Servir `dist/` en application monopage (renvoyer `index.html` sur toutes les routes du chemin de publication).
- **Sous-domaine** (`admin.pro2link.sn`) : `VITE_BASE_PATH=/`. **Sous-chemin** du site (`pro2link.sn/admin/`) :
  `VITE_BASE_PATH=/admin/` au build.
- L’API doit être sur le même domaine (reverse proxy `/api/v1`) ou un sous-domaine du **même domaine principal**
  (cookie `SameSite=Strict`) ; dans ce cas, ajouter l’origine du back-office à `CORS_ORIGIN` du backend.
- `robots.txt` interdit toute indexation ; `index.html` porte `noindex, nofollow`.

## Sécurité côté client

- Jeton d’accès **en mémoire uniquement** ; refresh token en cookie httpOnly posé par l’API ; un seul
  rafraîchissement à la fois (le refresh token tourne à chaque usage).
- Les gardes React ne servent qu’à l’affichage : **chaque route `/admin/*` est contrôlée par le serveur**
  (rôle, double authentification, permission `admin.*`).
- Redirection après connexion limitée aux chemins internes (pas de redirection ouverte).
- Actions sensibles confirmées (contexte, motif, mot de passe de l’administrateur quand l’API l’exige) ;
  `Idempotency-Key` sur l’activation d’abonnement.
- Message de l’API affiché tel quel ; erreurs 5xx remplacées par un message générique avec l’identifiant de requête ;
  aucun contenu de l’API injecté en HTML ; exports CSV protégés contre l’injection de formules.

## Endpoints utilisés

| Écran | Méthode et route |
|---|---|
| Session | `POST /auth/connexion`, `POST /auth/mfa`, `POST /auth/refresh`, `POST /auth/deconnexion` |
| Compte connecté | `GET/PATCH /compte`, `POST /compte/mot-de-passe`, `POST /compte/mfa/initialiser`, `POST /compte/mfa/activer`, `POST /compte/mfa/codes-secours`, `GET /compte/sessions`, `DELETE /compte/sessions/:id`, `POST /compte/sessions/revoquer-toutes` |
| Libellés | `GET /referentiels` |
| Notifications (en-tête) | `GET /notifications`, `GET /notifications/compteur`, `POST /notifications/:id/lue`, `POST /notifications/tout-lire` |
| Tableau de bord | `GET /admin/dashboard`, `GET /admin/statistiques`, `GET /admin/entreprises?tri=-created_at&limit=5`, `GET /admin/journal-audit?limit=8` |
| Entreprises | `GET /admin/entreprises`, `GET /admin/entreprises/:id`, `POST /admin/entreprises/:id/suspendre`, `POST /admin/entreprises/:id/reactiver`, `POST /admin/entreprises/:companyId/abonnement/activer` |
| Utilisateurs | `GET /admin/utilisateurs`, `GET /admin/utilisateurs/:id`, `POST /admin/utilisateurs`, `POST /admin/utilisateurs/:id/desactiver`, `…/activer`, `…/deverrouiller`, `…/reinitialiser-acces` |
| Abonnements | `GET /admin/abonnements`, `GET /admin/abonnements/:id`, `POST /admin/abonnements/:id/suspendre`, `…/reactiver`, `…/annuler`, `GET /admin/paiements-abonnements` |
| Forfaits | `GET /admin/plans`, `POST /admin/plans`, `PATCH /admin/plans/:id`, `POST /admin/plans/:id/activer`, `…/desactiver`, `DELETE /admin/plans/:id` |
| Statistiques | `GET /admin/statistiques?du=&au=`, `GET /admin/dashboard` |
| Activité et audit | `GET /admin/journal-audit` |
| Paramètres | `GET /admin/parametres`, `PUT /admin/parametres/:cle`, `POST/GET /admin/notifications`, `GET /admin/roles` |
| Recherche globale | `GET /admin/entreprises?q=` et `GET /admin/utilisateurs?q=` (pas de route de recherche unique) |

## Limites de l’API (signalées dans l’interface, non simulées)

- Utilisateurs : pas de filtre par entreprise ; filtre de rôle limité à `super_admin` / `utilisateur` ; aucune
  modification des rôles (matrice en lecture seule).
- Entreprises : pas de filtre par date d’inscription (tri disponible) ; logo non consultable par le super admin.
- Tableau de bord : période fixe (mois en cours) ; les filtres de dates sont sur la page Statistiques.
- Journal d’audit : pas de champ « résultat » ni de liste des codes d’action.
- Paramètres : seules les clés renvoyées par l’API sont modifiables ; valeurs structurées en lecture seule.

Aucune donnée de démonstration n’est utilisée : toutes les valeurs viennent de l’API.
