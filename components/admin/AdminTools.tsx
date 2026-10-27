'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const Feedback = createContext<(message: string) => void>(() => {});
const FeedbackMessage = createContext('');
export const useAdminFeedback = () => useContext(Feedback);
export function AdminFeedback({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  return <Feedback.Provider value={setMessage}><FeedbackMessage.Provider value={message}>{children}{message && <div className="admin-notice" role="status"><span>{message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div>}</FeedbackMessage.Provider></Feedback.Provider>;
}
export function CollectionToolbar({ query, onQuery, count, total, label, loading = false, error, onRefresh }: { query: string; onQuery: (value: string) => void; count: number; total: number; label: string; loading?: boolean; error?: string; onRefresh?: () => void }) {
  return <div className="admin-collection-tools"><label className="admin-search"><span>Search {label}</span><input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={`Find ${label}…`} /></label><span className="admin-result-count" role="status">{loading ? 'Loading…' : error ? 'Unavailable' : `${count} of ${total}`}</span>{query && <button className="btn-secondary" onClick={() => onQuery('')}>Clear search</button>}{onRefresh && <button className="btn-secondary" disabled={loading} onClick={onRefresh}>Refresh</button>}{error && <p className="admin-load-error" role="alert">{error}</p>}{!loading && !error && count === 0 && <p className="admin-empty">{query ? 'No matches. Try a different search or clear the filter.' : `No ${label} yet. Add your first item to get started.`}</p>}</div>;
}
export const matchesSearch = (query: string, ...values: unknown[]) => values.some(value => String(value ?? '').toLowerCase().includes(query.trim().toLowerCase()));

export function AdminDialog({ children, title, onClose, busy = false }: { children: React.ReactNode; title: string; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [dirty, setDirty] = useState(false);
  const message = useContext(FeedbackMessage);
  const notify = useAdminFeedback();
  const close = () => { if (!busy && (!dirty || window.confirm('Discard your unsaved changes?'))) onClose(); };
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    notify('');
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [notify]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return <dialog ref={ref} className="admin-editor-dialog" aria-label={title} onCancel={e => { e.preventDefault(); close(); }} onChangeCapture={() => setDirty(true)} onInputCapture={() => setDirty(true)} onClickCapture={e => { const button = (e.target as HTMLElement).closest('button'); if (button?.textContent?.trim() === 'Cancel') { e.preventDefault(); e.stopPropagation(); close(); } }}><div className="admin-dialog-bar"><span>{title}</span><button type="button" disabled={busy} onClick={close} aria-label="Close editor">×</button></div>{message && <p className="admin-dialog-message" role="status">{message}</p>}<fieldset disabled={busy} className="admin-dialog-fields">{children}</fieldset></dialog>;
}
