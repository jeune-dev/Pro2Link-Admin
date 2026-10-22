import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const CHAMP = 'pl-champ text-petit disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Champ de formulaire accessible : libellé relié, aide et message d'erreur
 * annoncés (aria-describedby / aria-invalid).
 *
 *   <Field label="E-mail" erreur={errors.email?.message}>
 *     {(p) => <Input {...p} type="email" {...register('email')} />}
 *   </Field>
 */
export function Field({ label, erreur, aide, obligatoire = false, children, className = '', labelCache = false }) {
  const id = useId();
  const idAide = `${id}-aide`;
  const idErreur = `${id}-erreur`;
  const decrit = [aide ? idAide : null, erreur ? idErreur : null].filter(Boolean).join(' ') || undefined;
  const props = { id, 'aria-invalid': erreur ? true : undefined, 'aria-describedby': decrit, 'aria-required': obligatoire || undefined };
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCache ? 'sr-only' : 'mb-1.5 block text-petit font-medium text-texte'}>
        {label}
        {obligatoire ? <span className="text-danger" aria-hidden> *</span> : null}
      </label>
      {typeof children === 'function' ? children(props) : children}
      {aide && !erreur ? <p id={idAide} className="mt-1 text-legende text-texte-secondaire">{aide}</p> : null}
      {erreur ? <p id={idErreur} className="mt-1 text-legende font-medium text-danger">{erreur}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${CHAMP} ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`${CHAMP} pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`${CHAMP} min-h-24 py-2 ${className}`} {...props} />;
});

export const PasswordInput = forwardRef(function PasswordInput({ className = '', ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={visible ? 'text' : 'password'} className={`${CHAMP} pr-11 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-champ text-texte-secondaire hover:text-texte"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, className = '', ...props }, ref) {
  return (
    <label className={`inline-flex cursor-pointer items-start gap-2.5 text-petit text-texte ${className}`}>
      <input ref={ref} type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--pl-primaire)]" {...props} />
      <span>{label}</span>
    </label>
  );
});

/** Options d'un <Select> à partir d'un référentiel `[{ code, label }]`. */
export function OptionsReferentiel({ options, vide }) {
  return (
    <>
      {vide !== undefined ? <option value="">{vide}</option> : null}
      {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
    </>
  );
}
