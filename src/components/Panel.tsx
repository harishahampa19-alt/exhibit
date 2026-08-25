import type { ReactNode } from 'react';

export function Panel({
  title,
  right,
  children,
  className = '',
  dense = false,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section className={`rounded border border-rule bg-panel ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
          <h2 className="label">{title}</h2>
          {right}
        </header>
      )}
      <div className={dense ? 'p-2' : 'p-3'}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = 'realized',
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'realized' | 'chaos' | 'ink' | 'alarm';
}) {
  const toneClass = {
    realized: 'text-realized',
    chaos: 'text-chaos',
    ink: 'text-ink',
    alarm: 'text-alarm',
  }[tone];

  return (
    <div className="min-w-0">
      <div className="label truncate">{label}</div>
      <div className={`tnum truncate text-lg leading-tight ${toneClass}`}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-[11px] text-inkfaint">{hint}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="my-3 h-px bg-rule" />;
}

export function Button({
  children,
  onClick,
  disabled,
  tone = 'default',
  className = '',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger' | 'ghost';
  className?: string;
  title?: string;
}) {
  const tones = {
    default: 'border-rule2 bg-panel2 text-ink hover:border-inkfaint hover:text-ink',
    primary: 'border-realized/50 bg-realized/10 text-realized hover:bg-realized/20',
    danger: 'border-alarm/50 bg-alarm/10 text-alarm hover:bg-alarm/20',
    ghost: 'border-transparent bg-transparent text-inkdim hover:text-ink',
  }[tone];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${tones} ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: readonly { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded border border-rule2 p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`rounded px-2 py-1 text-[11px] transition-colors ${
            o.value === value ? 'bg-realized/15 text-realized' : 'text-inkdim hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
