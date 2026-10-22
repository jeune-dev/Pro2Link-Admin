import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { refreshSession, setAccessBlockedHandler, setSessionExpiredHandler, tokenStore } from '../services/api.js';
import * as authService from '../services/authService.js';
import { getCompte } from '../services/compteService.js';

/**
 * Session de l'utilisateur. Le rôle et l'état (mot de passe provisoire, double
 * authentification) viennent TOUJOURS de l'API ; le frontend ne fait qu'orienter
 * l'affichage — chaque route /admin/* est contrôlée par le serveur.
 */
const AuthContext = createContext(null);

export const ROLE_SUPER_ADMIN = 'super_admin';

/** Les réponses d'auth renvoient `role`, GET /compte renvoie `role_code` : on unifie. */
export function normaliserUtilisateur(u) {
  if (!u) return null;
  const role = u.role ?? u.role_code ?? null;
  const mfaActive = u.mfa_active ?? Boolean(u.totp_enabled_at);
  return { ...u, role, mfaActive, mustChangePassword: Boolean(u.must_change_password) };
}

/** Étape de connexion restant à franchir avant d'accéder au back-office. */
export function etapeRequise(user) {
  if (!user) return 'identifiants';
  if (user.mustChangePassword) return 'mot_de_passe';
  if (user.role === ROLE_SUPER_ADMIN && !user.mfaActive) return 'configuration_mfa';
  return null;
}

export function AuthProvider({ children }) {
  const [statut, setStatut] = useState('chargement'); // chargement | anonyme | connecte
  const [user, setUser] = useState(null);
  const [sessionExpiree, setSessionExpiree] = useState(false);

  const fermerLocalement = useCallback((expiree = false) => {
    tokenStore.set(null);
    setUser(null);
    setStatut('anonyme');
    setSessionExpiree(expiree);
  }, []);

  const ouvrirSession = useCallback((data) => {
    if (data?.access_token) tokenStore.set(data.access_token);
    if (data?.user) setUser(normaliserUtilisateur(data.user));
    setSessionExpiree(false);
    setStatut('connecte');
  }, []);

  /** Relit le compte (après un changement de mot de passe ou l'activation de la MFA). */
  const rechargerUtilisateur = useCallback(async () => {
    const compte = await getCompte();
    const u = normaliserUtilisateur(compte?.user);
    setUser(u);
    return u;
  }, []);

  // Restauration de la session au chargement : le cookie httpOnly suffit.
  useEffect(() => {
    let actif = true;
    refreshSession().then((data) => {
      if (!actif) return;
      if (data?.user) ouvrirSession(data);
      else fermerLocalement(false);
    });
    return () => { actif = false; };
  }, [ouvrirSession, fermerLocalement]);

  useEffect(() => {
    setSessionExpiredHandler(() => fermerLocalement(true));
    setAccessBlockedHandler(() => { rechargerUtilisateur().catch(() => {}); });
    return () => {
      setSessionExpiredHandler(null);
      setAccessBlockedHandler(null);
    };
  }, [fermerLocalement, rechargerUtilisateur]);

  const deconnecter = useCallback(async () => {
    try {
      await authService.deconnexion();
    } catch {
      // La session locale est fermée même si l'API est injoignable.
    }
    fermerLocalement(false);
  }, [fermerLocalement]);

  const valeur = useMemo(() => ({
    statut,
    user,
    sessionExpiree,
    estSuperAdmin: user?.role === ROLE_SUPER_ADMIN,
    etape: etapeRequise(user),
    ouvrirSession,
    rechargerUtilisateur,
    deconnecter,
  }), [statut, user, sessionExpiree, ouvrirSession, rechargerUtilisateur, deconnecter]);

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
