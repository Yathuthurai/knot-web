import { useState, useEffect } from 'react';

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
export const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    home:      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"/>,
    people:    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    trophy:    <path d="M8 21h8M12 17v4M5 3h14l-1 7a6 6 0 01-12 0L5 3zM5 3H3m16 0h2" strokeLinecap="round" strokeLinejoin="round"/>,
    list:      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>,
    person:    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>,
    plus:      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>,
    chevron:   <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>,
    back:      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>,
    check:     <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>,
    x:         <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>,
    water:     <path d="M12 2C12 2 5 10 5 14a7 7 0 0014 0c0-4-7-12-7-12z" strokeLinecap="round" strokeLinejoin="round"/>,
    nutrition: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>,
    star:      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round"/>,
    trash:     <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>,
    refresh:   <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>,
    logout:    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>,
    bell:      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>,
    menu:      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>,
    palette:   <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" strokeLinecap="round" strokeLinejoin="round"/>,
    search:    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    activity:  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      {icons[name] || null}
    </svg>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '', color = '#378ADD', size = 40, square = false }) => {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className={`avatar ${square ? 'avatar-sq' : ''}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimeout;
export const showToast = (msg, type = '') => {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.remove(), 3000);
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ blue = false }) => (
  <div className={`spinner ${blue ? 'spinner-blue' : ''}`} />
);

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <div className="input-group">
    {label && <label className="input-label">{label}</label>}
    <input className="input" {...props} />
  </div>
);

// ── App icon ─────────────────────────────────────────────────────────────────
export const AppIcon = ({ icon, bg, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.225,
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <Icon name={icon} size={size * 0.5} color="#fff" />
  </div>
);

// ── Time ago ──────────────────────────────────────────────────────────────────
export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
