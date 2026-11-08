import React, { useState } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Github,
  Mail,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Layers,
  ArrowRight,
  Linkedin,
  Globe,
  MessageCircle,
  Twitter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SectionId, ProjectItem } from '../types';
import { PERSONAL_INFO, PROJECTS, SKILL_CATEGORIES, EXPERIENCES } from '../data/cvData';
import { soundManager } from '../utils/soundManager';

interface SectionOverlayProps {
  activeSection: SectionId;
  onClose: () => void;
  onSelectProject: (project: ProjectItem) => void;
  onNavigateToSection: (section: SectionId) => void;
  isLightMode?: boolean;
}

export const SectionOverlay: React.FC<SectionOverlayProps> = ({
  activeSection,
  onClose,
  onSelectProject,
  onNavigateToSection,
  isLightMode: _isLightMode = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Smooth close handler with exit animation
  const handleSmoothClose = () => {
    if (isClosing) return;
    soundManager.playClick();
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClosing]);

  // Do not show modal for overview or profile workstation area (purely for 3D interaction)
  if ((activeSection === 'overview' || activeSection === 'profile') && !isClosing) {
    return null;
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PERSONAL_INFO.email);
    setCopiedEmail(true);
    soundManager.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <aside
      aria-label="3D Section Details"
      className={`pointer-events-auto absolute right-2 sm:right-6 md:right-8 bottom-20 sm:bottom-24 z-20 w-[calc(100vw-1rem)] sm:w-[460px] max-h-[72vh] sm:max-h-[calc(100vh-12rem)] flex flex-col backdrop-blur-2xl border border-[var(--line)] rounded-3xl shadow-2xl transition-all duration-300 bg-[var(--surface)]/95 text-[var(--ink)] ${
        isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
      } ${isMinimized ? 'h-14 sm:h-16' : 'h-auto'}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--line)] shrink-0 bg-[var(--surface-strong)] rounded-t-3xl">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider font-mono truncate text-[var(--ink)]">
            {activeSection === 'profile' && 'Zone: Profile & Workstation'}
            {activeSection === 'projects' && 'Zone: Projects'}
            {activeSection === 'skills' && 'Zone: Core Competencies'}
            {activeSection === 'experience' && 'Zone: Career Timeline'}
            {activeSection === 'contact' && 'Zone: Contact Station'}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/30 transition-colors"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSmoothClose}
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/30 transition-colors"
            title="Return to Overview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body content with smooth tab transition */}
      {!isMinimized && (
        <div
          key={activeSection}
          className="p-3.5 sm:p-5 overflow-y-auto max-h-[55vh] sm:max-h-[60vh] space-y-3.5 sm:space-y-4 text-[var(--ink)] text-xs sm:text-sm scrollbar-thin bg-[var(--surface)] rounded-b-3xl animate-tab-content"
        >
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-[var(--ink)]">{PERSONAL_INFO.name}</h3>
                  <p className="text-xs text-[var(--accent)] font-mono font-bold mt-0.5">{PERSONAL_INFO.headline}</p>
                  <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{PERSONAL_INFO.location}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--ink)] bg-[var(--page)] p-3.5 rounded-2xl border border-[var(--line)]">
                {PERSONAL_INFO.bio}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {PERSONAL_INFO.stats.map((st, i) => (
                  <div key={i} className="bg-[var(--surface-strong)] p-3 rounded-2xl border border-[var(--line)] shadow-xs">
                    <p className="text-[11px] text-[var(--muted)] font-medium">{st.label}</p>
                    <p className="text-base font-extrabold text-[var(--ink)] mt-0.5">{st.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onNavigateToSection('projects')}
                  className="btn-nova-primary flex-1 !text-xs font-bold"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Explore 3D Projects</span>
                </button>
                <button
                  onClick={() => onNavigateToSection('contact')}
                  className="btn-nova-secondary flex-1 !text-xs font-bold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Get in Touch</span>
                </button>
              </div>
            </div>
          )}

          {/* PROJECTS SECTION */}
          {activeSection === 'projects' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)] font-medium">
                Client work and personal projects. Click a project for details:
              </p>
              <div className="space-y-2.5">
                {PROJECTS.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectProject(proj);
                    }}
                    className="group p-3.5 rounded-2xl bg-[var(--surface-strong)] hover:bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: proj.color }}
                          />
                          <h4 className="font-extrabold text-[var(--ink)] text-sm group-hover:text-[var(--accent)] transition-colors">
                            {proj.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">{proj.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-bright)]/40 font-bold shrink-0">
                        {proj.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {proj.tags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-[var(--page)] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-full font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[var(--line)] text-[11px] text-[var(--accent)] font-bold">
                      <span>{proj.role} • {proj.year}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKILLS SECTION */}
          {activeSection === 'skills' && (
            <div className="space-y-3">
              {/* Skill Tabs styled as novahoangdev tabs */}
              <div className="nova-tabs-pill w-full justify-between p-1">
                {SKILL_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveSkillTab(idx);
                    }}
                    className={`nova-tab-item flex-1 justify-center !py-1 !px-1.5 !text-[10px] ${
                      activeSkillTab === idx ? 'active' : ''
                    }`}
                  >
                    {cat.title.split('&')[0]}
                  </button>
                ))}
              </div>

              {/* Active Category Skills with animated tab transition */}
              <div key={activeSkillTab} className="space-y-3 pt-1 animate-tab-content">
                <h4 className="text-xs font-extrabold text-[var(--ink)]">
                  {SKILL_CATEGORIES[activeSkillTab].title}
                </h4>
                <ul className="flex flex-wrap gap-2">
                  {SKILL_CATEGORIES[activeSkillTab].skills.map((skill, sIdx) => (
                    <li
                      key={sIdx}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                        skill.highlight
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-bright)]/40'
                          : 'bg-[var(--surface-strong)] text-[var(--ink)] border-[var(--line)]'
                      }`}
                    >
                      {skill.name}
                      {skill.highlight && <span className="sr-only">(core skill)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* EXPERIENCE SECTION */}
          {activeSection === 'experience' && (
            <div className="space-y-3.5">
              <p className="text-xs text-[var(--muted)] font-medium">
                Career timeline, engineering leadership, and product milestones:
              </p>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--line)]">
                {EXPERIENCES.map((exp, idx) => (
                  <div key={idx} className="relative pl-7 space-y-1.5">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] shadow-xs" />
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-extrabold text-[var(--ink)]">{exp.role}</h4>
                      <span className="text-[10px] font-mono text-[var(--accent)] font-bold">{exp.period}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] font-semibold">
                      {exp.company} • {exp.location}
                    </p>
                    <p className="text-xs text-[var(--ink)] leading-relaxed bg-[var(--surface-strong)] p-3 rounded-2xl border border-[var(--line)]">
                      {exp.description}
                    </p>
                    <ul className="text-[11px] text-[var(--muted)] space-y-1 list-disc list-inside pt-0.5">
                      {exp.achievements.map((ach, aIdx) => (
                        <li key={aIdx}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT SECTION */}
          {activeSection === 'contact' && (
            <div className="space-y-4">
              <div className="bg-[var(--accent-soft)]/50 p-4 rounded-2xl border border-[var(--accent-bright)]/40 text-[var(--ink)]">
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-[var(--accent)]">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  Open to Senior / Lead Frontend opportunities
                </h4>
                <p className="text-xs text-[var(--ink)] mt-1 leading-relaxed">
                  {PERSONAL_INFO.status}. Have an interesting idea? Let's talk.
                </p>
              </div>

              {/* Email direct copy */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--muted)] font-bold">Direct Email:</label>
                <div className="flex items-center justify-between bg-[var(--surface-strong)] p-2.5 rounded-2xl border border-[var(--line)]">
                  <span className="font-mono text-xs text-[var(--ink)] truncate font-semibold">{PERSONAL_INFO.email}</span>
                  <button
                    onClick={handleCopyEmail}
                    className="btn-nova-primary !py-1 !px-3 !text-xs font-bold"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <Mail className="w-4 h-4 text-[var(--accent)]" />
                  <span>Send Email</span>
                </a>
                <a
                  href={PERSONAL_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <MessageCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <Linkedin className="w-4 h-4 text-[var(--accent)]" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={PERSONAL_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <Github className="w-4 h-4 text-[var(--ink)]" />
                  <span>GitHub</span>
                </a>
                <a
                  href={PERSONAL_INFO.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <Twitter className="w-4 h-4 text-[var(--accent)]" />
                  <span>X (Twitter)</span>
                </a>
                <a
                  href={PERSONAL_INFO.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-nova-secondary !py-2 !px-3 !text-xs font-bold"
                >
                  <Globe className="w-4 h-4 text-[var(--accent)]" />
                  <span>Website</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
