import { Download } from 'lucide-react';
import Button from '../common/Button.jsx';
import CopyButton from '../common/CopyButton.jsx';

/** Codes de secours (affichage unique) : copier ou télécharger en .txt. */
export default function BackupCodes({ codes }) {
  const texte = codes.join('\n');
  function telecharger() {
    const blob = new Blob([`Pro2Link — codes de secours\n\n${texte}\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pro2link-codes-de-secours.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="rounded-carte border border-bordure bg-surface-alt p-4">
      <ul className="grid grid-cols-2 gap-2 font-mono text-petit text-texte">
        {codes.map((c) => <li key={c} className="rounded-petit bg-surface px-3 py-1.5 text-center">{c}</li>)}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton texte={texte} libelle="Copier les codes" />
        <Button variante="neutre" taille="sm" icone={Download} onClick={telecharger}>Télécharger (.txt)</Button>
      </div>
    </div>
  );
}
