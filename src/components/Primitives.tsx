'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { X, ChevronDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

export const cx = (...inputs: ClassValue[]) => clsx(inputs);

// ──────────────────────────────────────────────────────────────
// Card
interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ title, subtitle, action, children, padded = true, style, className }: CardProps) {
  return (
    <section className={cx("card", className)} style={style}>
      {(title || action) && (
        <header className="card-h">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </header>
      )}
      <div className={padded ? "card-body" : "card-body-flush"}>{children}</div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Button
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  full?: boolean;
}

export function Btn({ children, variant = "ghost", size = "md", icon, iconRight, full, className, ...props }: BtnProps) {
  return (
    <button className={cx("btn", `btn-${variant}`, `btn-${size}`, full && "btn-full", className)} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="btn-icon">{iconRight}</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Input
interface TextInputProps {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

export function TextInput({ value, onChange, placeholder, type = "text", icon, autoFocus, style }: TextInputProps) {
  return (
    <label className="ti" style={style}>
      {icon && <span className="ti-i">{icon}</span>}
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
    </label>
  );
}

// ──────────────────────────────────────────────────────────────
// Select
interface SelectProps {
  value: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export function Select({ value, onChange, options, style }: SelectProps) {
  return (
    <div className="sel-wrap" style={style}>
      <select value={value} onChange={e => onChange?.(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="sel-chev"><ChevronDown size={14} /></span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Badge
export function Badge({ children, color, kind = "soft" }: { children: React.ReactNode, color?: string, kind?: 'soft' | 'solid' }) {
  const style = color ? { background: `color-mix(in oklab, ${color} 14%, transparent)`, color } : {};
  return (
    <span className={cx("badge", `badge-${kind}`)} style={style}>
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// Modal
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, width = 460, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={e => e.stopPropagation()}>
        <header className="modal-h">
          <h2>{title}</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-f">{footer}</footer>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Stat
interface StatProps {
  label: string;
  value: string;
  delta?: number;
  kind?: 'income' | 'expense' | 'neutral';
  icon?: React.ReactNode;
}

export function Stat({ label, value, delta, kind = "neutral", icon }: StatProps) {
  const isUp = delta != null && delta > 0;
  const isDown = delta != null && delta < 0;
  const deltaColor = kind === 'income' ? (isUp ? "var(--income)" : "var(--expense)") : kind === 'expense' ? (isUp ? "var(--expense)" : "var(--income)") : "var(--ink-3)";
  
  return (
    <div className="stat">
      <div className="stat-top">
        {icon && <span className="stat-icon">{icon}</span>}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cx("stat-value", "num")} style={{ color: kind === 'income' ? "var(--income)" : kind === 'expense' ? "var(--expense)" : "var(--ink)" }}>{value}</div>
      {delta != null && (
        <div className="stat-delta num" style={{ color: deltaColor }}>
          {isUp ? <ArrowUp size={12} strokeWidth={2} /> : isDown ? <ArrowDown size={12} strokeWidth={2} /> : null}
          {Math.abs(delta).toFixed(1)}% <span className="stat-delta-sub">vs. last month</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Page Header
export function PageHeader({ title, subtitle, right }: { title: string, subtitle?: string, right?: React.ReactNode }) {
  return (
    <div className="ph">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right && <div className="ph-r">{right}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Empty
export function Empty({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-mark"><Sparkles size={20} /></div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-sub">{subtitle}</div>}
      {action}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Toast
export function useToast() {
  const [toasts, setToasts] = useState<{ id: string, msg: string, kind: string }[]>([]);
  const push = useCallback((msg: string, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);
  
  const node = (
    <div className="toasts">
      {toasts.map(t => (
        <div key={t.id} className={cx("toast", `toast-${t.kind}`)}>
          {t.msg}
        </div>
      ))}
    </div>
  );
  
  return { push, node };
}
