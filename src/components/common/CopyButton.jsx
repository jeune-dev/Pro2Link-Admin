import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Button from './Button.jsx';

export default function CopyButton({ texte, libelle = 'Copier', taille = 'sm' }) {
  const [copie, setCopie] = useState(false);
  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  }
  return (
    <Button variante="neutre" taille={taille} icone={copie ? Check : Copy} onClick={copier}>
      <span aria-live="polite">{copie ? 'Copié' : libelle}</span>
    </Button>
  );
}
