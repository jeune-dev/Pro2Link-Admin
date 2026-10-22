import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNombre } from '../../utils/format.js';

/** Pagination de l'API : `{ page, limit, total, totalPages }`. */
export default function Pagination({ pagination, onPage, onLimit, limites = [10, 20, 50, 100] }) {
  if (!pagination) return null;
  const { page, limit, total, totalPages } = pagination;
  const debut = total === 0 ? 0 : (page - 1) * limit + 1;
  const fin = Math.min(page * limit, total);
  const pages = Math.max(totalPages, 1);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-bordure px-4 py-3 text-petit text-texte-secondaire sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite">
        <span className="chiffres">{formatNombre(debut)}–{formatNombre(fin)}</span> sur <span className="chiffres font-medium text-texte">{formatNombre(total)}</span>
      </p>
      <div className="flex items-center gap-3">
        {onLimit ? (
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Par page</span>
            <select
              className="pl-champ !min-h-8 !w-auto py-0 text-petit"
              value={limit}
              onChange={(e) => onLimit(Number(e.target.value))}
              aria-label="Nombre d’éléments par page"
            >
              {limites.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="rounded-champ border border-bordure p-1.5 hover:bg-surface-alt disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="chiffres min-w-20 text-center">Page {page} / {pages}</span>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            className="rounded-champ border border-bordure p-1.5 hover:bg-surface-alt disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}
