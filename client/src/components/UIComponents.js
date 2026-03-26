import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// ---- Modal ----
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${sizeClass} animate-fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-sage-800 dark:text-sage-200">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// ---- Confirm Dialog ----
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-sage-100 dark:bg-sage-900/40'}`}>
          <ExclamationTriangleIcon className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-sage-600'}`} />
        </div>
        <h3 className="text-center font-display text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Search Bar ----
export const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-9"
    />
  </div>
);

// ---- Spinner ----
export const Spinner = ({ size = 'md', className = '' }) => {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return <div className={`${sz} border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin ${className}`} />;
};

// ---- Stat Card ----
export const StatCard = ({ title, value, icon: Icon, color = 'sage', sub }) => {
  const colors = {
    sage: 'bg-sage-50 text-sage-600 border-sage-100',
    peach: 'bg-peach-50 text-peach-600 border-peach-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-500 border-red-100',
  };
  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="font-display text-3xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Empty State ----
export const EmptyState = ({ message = 'No data found', icon: Icon, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-sage-300" />
    </div>}
    <p className="text-gray-400 text-sm font-medium mb-4">{message}</p>
    {action}
  </div>
);

// ---- Badge ----
export const Badge = ({ label, type = 'default' }) => {
  const types = {
    paid: 'badge-paid',
    unpaid: 'badge-unpaid',
    archived: 'badge-archived',
    default: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600',
    admin: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sage-100 text-sage-700',
    teacher: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700',
  };
  return <span className={types[type] || types.default}>{label}</span>;
};

// ---- Page Header ----
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-sage-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

// ---- Pagination ----
export const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
        Previous
      </button>
      <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
        Next
      </button>
    </div>
  );
};