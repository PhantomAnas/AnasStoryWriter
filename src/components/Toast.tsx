import React from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'error';
}

export const Toast: React.FC<{ toast: ToastMessage | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-xl text-sm shadow-2xl backdrop-blur-md border toast-enter pointer-events-none ${
        toast.tone === 'error'
          ? 'bg-red-900/80 border-red-400/40 text-red-100'
          : 'bg-slate-900/90 border-white/15 text-gray-100'
      }`}
      role="status"
    >
      {toast.text}
    </div>
  );
};
