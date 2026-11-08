import React from 'react';
import { X, ExternalLink, Github, Layers, Calendar, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProjectItem } from '../types';
import { soundManager } from '../utils/soundManager';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleSmoothClose = () => {
    if (isClosing) return;
    soundManager.playClick();
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  };

  React.useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, isClosing]);

  if (!project && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={handleSmoothClose}
    >
      <div
        className={`relative w-full max-w-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-3xl shadow-2xl shadow-[var(--shadow)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with accent color */}
        <div
          className="relative h-28 sm:h-36 p-4 sm:p-6 flex flex-col justify-end overflow-hidden bg-[var(--surface-strong)] border-b border-[var(--line)]"
        >
          {/* Decorative geometric mesh wireframe overlay */}
          <div className="absolute top-4 right-6 opacity-15 pointer-events-none">
            <Layers className="w-28 h-28 text-[var(--accent)]" />
          </div>

          <button
            onClick={handleSmoothClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <span
              className="inline-block text-[10px] sm:text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 sm:mb-2 bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-bright)]/40"
            >
              {project.category}
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-[var(--ink)] truncate">{project.title}</h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-[var(--ink)] text-xs sm:text-sm scrollbar-thin bg-[var(--page)]">
          <p className="text-xs sm:text-sm font-semibold text-[var(--ink)] leading-relaxed">
            {project.subtitle}
          </p>

          <div className="bg-[var(--surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--line)] space-y-1.5 sm:space-y-2 shadow-xs">
            <h4 className="text-[11px] sm:text-xs font-extrabold text-[var(--accent)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Overview
            </h4>
            <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
              {project.longDescription}
            </p>
          </div>

          {/* Quick Meta */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-[var(--surface)] p-3 rounded-2xl border border-[var(--line)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Role</span>
              </div>
              <p className="font-extrabold text-[var(--ink)] text-xs sm:text-sm mt-1">{project.role}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded-2xl border border-[var(--line)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Timeline</span>
              </div>
              <p className="font-extrabold text-[var(--ink)] text-xs sm:text-sm mt-1">{project.year}</p>
            </div>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-wider font-mono">
              Highlights
            </h4>
            <div className="space-y-1.5">
              {project.metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-[var(--ink)] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-wider font-mono">
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] shadow-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 sm:p-5 bg-[var(--surface-strong)] border-t border-[var(--line)] flex flex-col sm:flex-row items-center sm:justify-end gap-2 sm:gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nova-secondary w-full sm:w-auto font-bold"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nova-primary w-full sm:w-auto font-extrabold"
            >
              <span>Live Application</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
