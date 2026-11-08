import React, { useState } from 'react';
import {
  X as CloseIcon,
  Printer,
  Copy,
  Check,
  Download,
  Mail,
  MapPin,
  Globe,
  Github,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Sparkles,
  Phone,
  Linkedin,
  ExternalLink,
  MessageCircle,
  Twitter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PERSONAL_INFO, PROJECTS, SKILL_CATEGORIES, EXPERIENCES, EDUCATION } from '../data/cvData';
import { soundManager } from '../utils/soundManager';

interface FullCVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullCVModal: React.FC<FullCVModalProps> = ({ isOpen, onClose }) => {
  const [activeMarket, setActiveMarket] = useState<'vietnam' | 'international'>('vietnam');
  const [copiedText, setCopiedText] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
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
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isOpen && !isClosing) return null;

  const isVietnam = activeMarket === 'vietnam';
  const displayName = isVietnam ? PERSONAL_INFO.name : PERSONAL_INFO.internationalName;
  const marketStatus = isVietnam ? PERSONAL_INFO.status : PERSONAL_INFO.internationalStatus;
  const pdfUrl = PERSONAL_INFO.cvPdf[activeMarket];

  const handlePrint = () => {
    soundManager.playClick();
    const isIframe = window.self !== window.top;
    try {
      window.print();
      if (isIframe) {
        setPrintNotice('Your browser may block printing inside an embedded frame. Use "Download PDF" to get the reviewed CV instead.');
        setTimeout(() => setPrintNotice(null), 7000);
      }
    } catch (err) {
      console.warn('Direct print blocked by sandbox:', err);
      setPrintNotice('Your browser blocked printing here. Use "Download PDF" to get the reviewed CV instead.');
      setTimeout(() => setPrintNotice(null), 6000);
    }
  };

  const handleCopyCVText = () => {
    const cvText = `
${isVietnam ? `${PERSONAL_INFO.name} (${PERSONAL_INFO.englishName})` : PERSONAL_INFO.internationalName}
${PERSONAL_INFO.title} · ${PERSONAL_INFO.headline}
${marketStatus}
Email: ${PERSONAL_INFO.email} | Phone/WhatsApp: ${PERSONAL_INFO.phone} | Location: ${PERSONAL_INFO.location}
Portfolio: ${PERSONAL_INFO.portfolioUrl} | LinkedIn: ${PERSONAL_INFO.linkedin} | GitHub: ${PERSONAL_INFO.github} | X: ${PERSONAL_INFO.x}

PROFESSIONAL SUMMARY:
${PERSONAL_INFO.bio}

WORK EXPERIENCE:
${EXPERIENCES.map(
  (e) => `• ${e.role} @ ${e.company} (${e.period})
  ${e.description}
  Key Achievements:
${e.achievements.map((a) => `    - ${a}`).join('\n')}
  Technologies: ${e.technologies.join(', ')}`
).join('\n\n')}

SELECTED PROJECTS:
${PROJECTS.map(
  (p) => `• ${p.title} (${p.year}) - ${p.subtitle}
  Role: ${p.role}
  Stack: ${p.tags.join(', ')}${p.liveUrl ? `\n  Live: ${p.liveUrl}` : ''}${p.githubUrl ? `\n  Code: ${p.githubUrl}` : ''}`
).join('\n\n')}

TECHNICAL SKILLS:
${SKILL_CATEGORIES.map(
  (c) => `• ${c.title}: ${c.skills.map((s) => s.name).join(', ')}`
).join('\n')}

EDUCATION:
${EDUCATION.map((ed) => `• ${ed.degree} - ${ed.school} (${ed.period})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(cvText);
    setCopiedText(true);
    soundManager.playSuccess();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full Curriculum Vitae"
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md print:p-0 print:static print:bg-white ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={handleSmoothClose}
    >
      <div
        id="cv-modal-wrapper"
        className={`relative w-full max-w-4xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-3xl shadow-2xl shadow-[var(--shadow)] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar: Stylized with novahoangdev Design System */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[var(--line)] bg-[var(--surface-strong)] shrink-0 print:hidden">
          {/* Market Tab Selector: novahoangdev tabs style */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="nova-tabs-pill" role="tablist" aria-label="Choose CV market perspective">
              <button
                type="button"
                role="tab"
                aria-selected={activeMarket === 'vietnam'}
                onClick={() => {
                  soundManager.playClick();
                  setActiveMarket('vietnam');
                }}
                className={`nova-tab-item ${activeMarket === 'vietnam' ? 'active' : ''}`}
              >
                <span>Vietnam Market</span>
                <span className="nova-tab-badge">VN</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMarket === 'international'}
                onClick={() => {
                  soundManager.playClick();
                  setActiveMarket('international');
                }}
                className={`nova-tab-item ${activeMarket === 'international' ? 'active' : ''}`}
              >
                <span>International</span>
                <span className="nova-tab-badge">GLOBAL</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {/* Copy Plain Text */}
            <button
              onClick={handleCopyCVText}
              className="btn-nova-secondary !py-1.5 !px-3 !text-xs font-bold"
              title="Copy plain-text resume to clipboard"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Text</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </button>

            {/* Reviewed PDF from the portfolio site */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundManager.playClick()}
              className="btn-nova-primary !py-1.5 !px-3.5 !text-xs font-extrabold"
              title={`Download the reviewed ${isVietnam ? 'Vietnam' : 'International'} CV (PDF)`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </a>

            {/* Browser Print */}
            <button
              onClick={handlePrint}
              className="btn-nova-secondary !py-1.5 !px-3 !text-xs font-bold"
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleSmoothClose}
              className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors ml-1"
              title="Close resume modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative notice banner if print/export requires guidance */}
        {printNotice && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2 print:hidden animate-in fade-in">
            <span>{printNotice}</span>
            <button
              onClick={() => setPrintNotice(null)}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable CV Document Content with Unique Tab Switching Animation */}
        <div
          id="cv-printable-content"
          key={activeMarket}
          className="p-4 sm:p-7 md:p-9 overflow-y-auto space-y-6 sm:space-y-8 text-[var(--ink)] text-sm scrollbar-thin bg-[var(--page)] print:overflow-visible print:max-h-none print:p-0 print:bg-white animate-tab-content"
        >
          {/* Candidate Header */}
          <div className="border-b border-[var(--line)] pb-5 sm:pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
              <div className="flex items-start gap-4 sm:gap-5 flex-1">
                {/* Portrait: Vietnam CV only (International CV stays photo-free for ATS) */}
                {isVietnam && (
                <div className="relative shrink-0 pt-0.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/50 shadow-md bg-[var(--surface)]">
                    <img
                      src="/images/hoa-hoang-256.webp"
                      alt={PERSONAL_INFO.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                      }}
                    />
                  </div>
                  <div
                    title="Developer Logo"
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--accent)]/50 flex items-center justify-center shadow-sm"
                  >
                    <img src="/favicon.svg" alt="" className="w-3.5 h-3.5" />
                  </div>
                </div>
                )}

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
                      {displayName}
                    </h1>
                    {isVietnam && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-bright)]/40">
                      {PERSONAL_INFO.englishName}
                    </span>
                    )}
                  </div>
                  <p className="text-[var(--accent)] font-bold text-xs sm:text-sm">
                    {PERSONAL_INFO.headline}
                  </p>
                  <p className="text-xs text-[var(--muted)] max-w-xl leading-relaxed">{PERSONAL_INFO.tagline}</p>
                  <div className="pt-1 text-[11px] font-mono text-teal-600 dark:text-teal-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span>{marketStatus}</span>
                  </div>
                </div>
              </div>

              {/* Meta contact card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-2 text-xs text-[var(--muted)] font-mono shrink-0 bg-[var(--surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--line)] w-full lg:w-auto shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={`mailto:${PERSONAL_INFO.email}`} className="hover:underline text-[var(--ink)] truncate font-semibold">
                    {PERSONAL_INFO.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={`tel:${PERSONAL_INFO.phoneHref}`} className="hover:underline text-[var(--ink)] truncate">
                    {PERSONAL_INFO.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <a href={PERSONAL_INFO.whatsapp} target="_blank" rel="noreferrer" className="hover:underline text-[var(--ink)] flex items-center gap-1 truncate">
                    <span className="truncate">WhatsApp: {PERSONAL_INFO.whatsappDisplay}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="truncate">{PERSONAL_INFO.location}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={PERSONAL_INFO.portfolioUrl} target="_blank" rel="noreferrer" className="hover:underline text-[var(--accent)] flex items-center gap-1 truncate font-semibold">
                    <span className="truncate">novahoangdev.web.app</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Linkedin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={PERSONAL_INFO.linkedin} target="_blank" rel="noreferrer" className="hover:underline text-[var(--ink)] flex items-center gap-1 truncate">
                    <span className="truncate">linkedin.com/in/novahoangdev</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Github className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={PERSONAL_INFO.github} target="_blank" rel="noreferrer" className="hover:underline text-[var(--ink)] flex items-center gap-1 truncate">
                    <span className="truncate">github.com/novahoangdev</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                  </a>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Twitter className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <a href={PERSONAL_INFO.x} target="_blank" rel="noreferrer" className="hover:underline text-[var(--ink)] flex items-center gap-1 truncate">
                    <span className="truncate">x.com/novahoangdev</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick stats ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
              {PERSONAL_INFO.stats.map((st, i) => (
                <div key={i} className="bg-[var(--surface)] p-2.5 sm:p-3 rounded-2xl border border-[var(--line)] text-center shadow-xs">
                  <span className="text-[10px] sm:text-[11px] text-[var(--muted)] font-medium block">{st.label}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[var(--ink)] mt-0.5 block truncate">{st.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SUMMARY */}
          <section className="space-y-2">
            <h2 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Professional Summary
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed bg-[var(--surface)] p-4 rounded-2xl border border-[var(--line)] shadow-xs">
              {PERSONAL_INFO.bio}
            </p>
          </section>

          {/* WORK EXPERIENCE */}
          <section className="space-y-4">
            <h2 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest font-mono flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              Work Experience
            </h2>
            <div className="space-y-4">
              {EXPERIENCES.map((exp, idx) => (
                <div key={idx} className="bg-[var(--surface)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] space-y-2.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="font-extrabold text-[var(--ink)] text-base">{exp.role}</h3>
                      <p className="text-xs text-[var(--accent)] font-bold">
                        {exp.company} • {exp.location}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--muted)] bg-[var(--surface-strong)] px-2.5 py-1 rounded-full border border-[var(--line)] self-start sm:self-auto font-semibold">
                      {exp.period}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--ink)]">{exp.description}</p>

                  <div className="space-y-1">
                    <p className="text-[11px] font-mono text-[var(--muted)] uppercase font-bold">Key Deliverables & Impact:</p>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-[var(--ink)] space-y-1">
                      {exp.achievements.map((ach, aIdx) => (
                        <li key={aIdx}>{ach}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exp.technologies.map((t, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-[var(--surface-strong)] text-[var(--muted)] border border-[var(--line)] px-2.5 py-0.5 rounded-full font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURED PROJECTS */}
          <section className="space-y-4">
            <h2 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest font-mono flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Selected Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROJECTS.map((proj) => (
                <div key={proj.id} className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--line)] space-y-2 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[var(--ink)] text-sm">{proj.title}</h3>
                    <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--surface-strong)] px-2 py-0.5 rounded-full border border-[var(--line)] font-bold">
                      {proj.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] font-medium">{proj.subtitle}</p>
                  <p className="text-xs text-[var(--ink)] leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.slice(0, 4).map((t, idx) => (
                      <span key={idx} className="text-[9px] bg-[var(--surface-strong)] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-full font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TECHNICAL SKILLS */}
          <section className="space-y-4">
            <h2 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest font-mono flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />
              Technical Competencies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SKILL_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--line)] space-y-2 shadow-xs">
                  <h3 className="text-xs font-extrabold text-[var(--ink)]">{cat.title}</h3>
                  <div className="space-y-1.5">
                    {cat.skills.map((s, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--accent)' }}
                        />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EDUCATION */}
          <section className="space-y-3 pt-2 border-t border-[var(--line)]">
            <h2 className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest font-mono flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              Education
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EDUCATION.map((ed, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[var(--ink)]">{ed.degree}</h3>
                  <p className="text-xs text-[var(--accent)] font-bold">{ed.school}</p>
                  <p className="text-[11px] font-mono text-[var(--muted)]">{ed.period}</p>
                  {ed.details && <p className="text-xs text-[var(--ink)] mt-1">{ed.details}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
