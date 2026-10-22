import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { Field, PasswordInput, Textarea } from '../forms/Field.jsx';
import ErrorAlert from './ErrorAlert.jsx';

/**
 * Confirmation d'une opération sensible, avec son contexte. Champs facultatifs
 * selon la route : motif (`reason`) et mot de passe de l'administrateur
 * (`current_password`). La fenêtre ne se ferme qu'en cas de SUCCÈS de l'API ;
 * l'erreur renvoyée est affichée telle quelle.
 *
 * @param {{
 *   ouvert: boolean, onFermer: () => void, titre: string, description?: string,
 *   contexte?: React.ReactNode, libelleConfirmer: string, ton?: 'primaire'|'danger',
 *   motif?: 'obligatoire'|'facultatif'|null, motifMax?: number, motDePasse?: boolean,
 *   onConfirmer: (valeurs: { reason?: string, current_password?: string }) => Promise<void>
 * }} props
 */
export default function ActionDialog({
  ouvert, onFermer, titre, description, contexte, libelleConfirmer, ton = 'primaire',
  motif = null, motifMax = 1000, motDePasse = false, onConfirmer,
}) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [erreurChamp, setErreurChamp] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (ouvert) {
      setReason('');
      setPassword('');
      setErreurChamp({});
      setErreur(null);
    }
  }, [ouvert]);

  async function soumettre(e) {
    e.preventDefault();
    const erreurs = {};
    const motifNettoye = reason.trim();
    if (motif === 'obligatoire' && motifNettoye.length < 3) erreurs.reason = 'Indiquez un motif (3 caractères minimum).';
    if (motif === 'facultatif' && motifNettoye && motifNettoye.length < 3) erreurs.reason = 'Le motif doit contenir au moins 3 caractères.';
    if (motDePasse && !password) erreurs.password = 'Saisissez votre mot de passe pour confirmer.';
    setErreurChamp(erreurs);
    if (Object.keys(erreurs).length) return;

    setEnvoi(true);
    setErreur(null);
    try {
      await onConfirmer({
        ...(motif && motifNettoye ? { reason: motifNettoye } : {}),
        ...(motDePasse ? { current_password: password } : {}),
      });
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      titre={titre}
      description={description}
      fermetureBloquee={envoi}
      pied={(
        <>
          <Button variante="neutre" onClick={onFermer} disabled={envoi}>Annuler</Button>
          <Button variante={ton === 'danger' ? 'danger' : 'primaire'} type="submit" form="action-dialog-form" chargement={envoi}>
            {libelleConfirmer}
          </Button>
        </>
      )}
    >
      <form id="action-dialog-form" onSubmit={soumettre} className="space-y-4" noValidate>
        {contexte ? <div className="rounded-champ border border-bordure bg-surface-alt p-3 text-petit text-texte">{contexte}</div> : null}
        {motif ? (
          <Field label={motif === 'obligatoire' ? 'Motif' : 'Motif (facultatif)'} erreur={erreurChamp.reason} aide="Le motif est enregistré dans le journal d'audit.">
            {(p) => <Textarea {...p} rows={3} maxLength={motifMax} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        ) : null}
        {motDePasse ? (
          <Field label="Votre mot de passe" erreur={erreurChamp.password} aide="Action sensible : votre mot de passe est vérifié par le serveur.">
            {(p) => <PasswordInput {...p} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
        ) : null}
        <ErrorAlert erreur={erreur} />
      </form>
    </Modal>
  );
}
