import React, { useEffect } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import { WorkstationToast, SectionId, CameraViewMode } from '../types';

interface WorkstationControlsProps {
  activeSection: SectionId;
  cameraViewMode: CameraViewMode;
  onSelectCameraMode: (mode: CameraViewMode) => void;
  toast: WorkstationToast | null;
  onDismissToast: () => void;
  onInteractItem?: (item: string) => void;
  isLightMode?: boolean;
}

export const WorkstationControls: React.FC<WorkstationControlsProps> = ({
  toast,
  onDismissToast,
}) => {
  // Auto-dismiss toast notification after 4.5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismissToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismissToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-3 duration-200 max-w-[95vw]">
      <div
        className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--surface)]/95 text-[var(--ink)] backdrop-blur-xl shadow-2xl text-xs font-mono transition-all"
      >
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 animate-pulse" />
        <span className="font-extrabold text-[var(--ink)]">{toast.title}</span>
        <span className="opacity-75 text-[11px] hidden sm:inline text-[var(--muted)]">• {toast.message}</span>
        {toast.actionUrl && (
          <a
            href={toast.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-nova-primary !py-1 !px-3 !text-[11px] font-extrabold ml-1.5"
          >
            <span>{toast.actionLabel || 'Open Website'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={onDismissToast}
          className="ml-1 p-1 rounded-full hover:bg-[var(--line)]/50 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
