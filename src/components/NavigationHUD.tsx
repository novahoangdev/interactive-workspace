import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Monitor,
  Volume2,
  VolumeX,
  Sunrise,
  Sun,
  Moon,
  Sunset,
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Eye,
  Sliders,
  Laptop,
  BookOpen,
  Package,
  Headphones,
  Keyboard,
  Mouse,
  Armchair,
  Lightbulb,
  Clock,
  Smartphone,
  Coffee,
  Sparkles,
  Cpu,
  Car,
} from 'lucide-react';
import { SectionId, LightingMode, CameraViewMode } from '../types';
import { soundManager } from '../utils/soundManager';

interface NavigationHUDProps {
  activeSection: SectionId;
  lightingMode: LightingMode;
  isLightMode: boolean;
  isMuted: boolean;
  onSelectSection: (section: SectionId) => void;
  onSelectLightingMode: (mode: LightingMode) => void;
  onToggleSound: () => void;
  onOpenFullCV: () => void;
  hoveredLabel: string | null;
  cameraViewMode?: CameraViewMode;
  onSelectCameraMode?: (mode: CameraViewMode) => void;
  onInteractItem?: (item: string) => void;
  onEnterDriving?: () => void;
}

// Camera mode presets for bottom navigation
const CAMERA_MODES: { id: CameraViewMode; label: string; shortLabel: string; tooltip: string; icon: React.ReactNode }[] = [
  { id: 'default', label: 'Standard', shortLabel: 'Std', tooltip: 'Standard perspective view', icon: <Compass className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'desk-focus', label: 'Desk Focus', shortLabel: 'Desk', tooltip: 'Close-up workstation view', icon: <Monitor className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'isometric', label: 'Isometric', shortLabel: 'Iso', tooltip: 'Isometric 45° angle view', icon: <Maximize2 className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'top-down', label: 'Top-down', shortLabel: 'Top', tooltip: "Top-down bird's-eye view", icon: <Eye className="w-3.5 h-3.5 shrink-0" /> },
];

const LIGHTING_MODES: { id: LightingMode; label: string; icon: React.ReactNode }[] = [
  { id: 'morning', label: 'Sunrise (Morning)', icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'day', label: 'Daylight (Natural)', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'sunset', label: 'Sunset (Golden Hour)', icon: <Sunset className="w-3.5 h-3.5 text-orange-500" /> },
  { id: 'night', label: 'Night (Cozy Lamp)', icon: <Moon className="w-3.5 h-3.5 text-teal-400" /> },
];

const WORKSTATION_ITEMS = [
  { id: 'desk-controller', label: 'Smart Sit/Stand Desk (74-108cm)', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'main-screen', label: 'BenQ MA270S 27" 4K', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'vertical-screen', label: '24" Pivot Vertical Screen', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'mac-mini', label: 'Mac mini M5 Pro (48GB)', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'screenbar', label: 'BenQ ScreenBar Light', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'keyboard', label: 'AKKO 3068B RGB Keyboard', icon: <Keyboard className="w-3.5 h-3.5" /> },
  { id: 'mouse', label: 'Logitech M650 Silent Mouse', icon: <Mouse className="w-3.5 h-3.5" /> },
  { id: 'laptop', label: 'MacBook Pro M2 Max', icon: <Laptop className="w-3.5 h-3.5" /> },
  { id: 'chair', label: 'GH-328 Ergonomic Mesh Chair', icon: <Armchair className="w-3.5 h-3.5" /> },
  { id: 'audio-interface', label: 'Scarlett 2i2 Audio Interface', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'headphones', label: 'Havit H630BT Headphones (Cream)', icon: <Headphones className="w-3.5 h-3.5" /> },
  { id: 'clock', label: 'Pomodoro Desk Clock', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'phone', label: 'MagSafe Smartphone', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'coffee', label: 'Espresso Coffee Cup', icon: <Coffee className="w-3.5 h-3.5" /> },
  { id: 'rubber-duck', label: 'Rubber Duck Debugger', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'pc-tower', label: 'Gaming / Workstation PC', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'sneaker-shelf', label: '8-Cubby Shelf & Sneaker Boxes', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'bookshelf', label: 'Bookshelf & Trophy (Right)', icon: <BookOpen className="w-3.5 h-3.5" /> },
];

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  activeSection: _activeSection,
  lightingMode,
  isLightMode: _isLightMode,
  isMuted,
  onSelectSection: _onSelectSection,
  onSelectLightingMode,
  onToggleSound,
  onOpenFullCV,
  hoveredLabel: _hoveredLabel,
  cameraViewMode = 'default',
  onSelectCameraMode,
  onInteractItem,
  onEnterDriving,
}) => {
  const [showAtmosphereMenu, setShowAtmosphereMenu] = useState(false);
  const [showDeskItems, setShowDeskItems] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [soundRipple, setSoundRipple] = useState(false);
  const deskItemsRef = useRef<HTMLDivElement>(null);
  const atmosphereMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showDeskItems && !showAtmosphereMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showDeskItems && deskItemsRef.current && !deskItemsRef.current.contains(target)) {
        setShowDeskItems(false);
      }
      if (showAtmosphereMenu && atmosphereMenuRef.current && !atmosphereMenuRef.current.contains(target)) {
        setShowAtmosphereMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showDeskItems, showAtmosphereMenu]);

  // Hide gesture hint as soon as the user scrolls, drags, or interacts
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
    };
  }, []);

  const handleSpeakerClick = () => {
    setSoundRipple(true);
    setTimeout(() => setSoundRipple(false), 500);
    onToggleSound();
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-4 md:p-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] z-20">
      {/* Top Navbar HUD - Cohesive 2-Dock Architecture (Profile Island + Unified Control Dock) */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 w-full max-w-7xl mx-auto animate-hero-header">
        {/* Left: Brand Identity - Refined, Sleek Profile Island */}
        <a
          href="https://novahoangdev.web.app/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => soundManager.playClick()}
          title="Visit novahoangdev.web.app (opens in a new tab)"
          className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-full bg-[var(--surface)]/90 backdrop-blur-xl border border-[var(--line)] hover:border-[var(--accent)] shadow-xs transition-all select-none group shrink-0"
        >
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border border-[var(--accent)]/30 group-hover:border-[var(--accent)] shrink-0 bg-[var(--paper)]">
            <img
              src="/images/hoa-hoang-256.webp"
              alt="Hoàng Văn Hòa (Nova Hoang)"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
              }}
            />
            {/* Subtle active status indicator */}
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-[var(--surface)]" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors leading-none">
              Nova Hoang
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-[var(--muted)] leading-none">
              • Senior SWE
            </span>
          </div>
        </a>

        {/* Right: Master Control Dock - Unified Glass Bar with Integrated Segmented Controls */}
        <div className="pointer-events-auto flex items-center h-10 sm:h-11 p-1 rounded-full bg-[var(--surface)]/90 backdrop-blur-xl border border-[var(--line)] shadow-xs shrink-0 gap-0.5 sm:gap-1">
          {/* 1. Drive Kart button */}
          {onEnterDriving && (
            <button
              type="button"
              onClick={() => {
                soundManager.playClick(true);
                onEnterDriving();
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--paper)] active:scale-95 transition-all shrink-0"
              title="Drive Cyber Kart (Click to drive!)"
              aria-label="Drive Cyber Kart"
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform hover:scale-110" />
            </button>
          )}

          {/* Micro divider */}
          {onEnterDriving && <div className="w-px h-4 bg-[var(--line)] mx-0.5 shrink-0" />}

          {/* 2. Atmosphere / Time of Day Mode Selector */}
          <div ref={atmosphereMenuRef} className="relative">
            <button
              id="btn-open-atmosphere-menu"
              onClick={() => {
                soundManager.playClick();
                setShowAtmosphereMenu(!showAtmosphereMenu);
              }}
              title="Select lighting & atmosphere"
              className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper)] transition-all shrink-0"
            >
              {lightingMode === 'morning' && <Sunrise className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />}
              {lightingMode === 'day' && <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />}
              {lightingMode === 'sunset' && <Sunset className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />}
              {lightingMode === 'night' && <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />}
              <span className="hidden sm:inline font-sans text-xs">
                {lightingMode === 'morning' && 'Sunrise'}
                {lightingMode === 'day' && 'Daylight'}
                {lightingMode === 'sunset' && 'Sunset'}
                {lightingMode === 'night' && 'Night'}
              </span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${showAtmosphereMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showAtmosphereMenu && (
              <div
                className="absolute right-0 mt-2 w-48 sm:w-56 p-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/98 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1 transition-all animate-dropdown"
              >
                <div className="px-2.5 py-1 text-[10px] font-mono text-[var(--accent)] uppercase tracking-wider font-extrabold border-b border-[var(--line)]">
                  Time of Day
                </div>
                {LIGHTING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectLightingMode(mode.id);
                      setShowAtmosphereMenu(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                      lightingMode === mode.id
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-extrabold border border-[var(--accent-bright)]/40 scale-[1.01]'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]'
                    }`}
                  >
                    <span>{mode.icon}</span>
                    <span className="truncate">{mode.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Micro divider */}
          <div className="w-px h-4 bg-[var(--line)] mx-0.5 shrink-0" />

          {/* 3. Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={handleSpeakerClick}
            title={isMuted ? 'Unmute audio effects' : 'Mute audio'}
            className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--paper)] transition-all shrink-0 relative ${
              soundRipple ? 'animate-sound-ripple ring-2 ring-[var(--accent)]/50 scale-95' : ''
            }`}
          >
            {isMuted ? (
              <VolumeX key="muted-icon" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--muted)] animate-speaker-mute" />
            ) : (
              <Volume2 key="unmuted-icon" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] animate-speaker-unmute" />
            )}
          </button>

          {/* Micro divider */}
          <div className="w-px h-4 bg-[var(--line)] mx-0.5 shrink-0" />

          {/* 4. Full CV Resume Button */}
          <button
            id="btn-open-cv-doc"
            onClick={onOpenFullCV}
            className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-full bg-[var(--accent)] text-white hover:brightness-105 active:scale-95 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Resume</span>
            <span className="sm:hidden">CV</span>
          </button>
        </div>
      </header>

      {/* Bottom Container: Instruction Hint & Floating Navigation Dock */}
      <div className="pointer-events-none flex flex-col items-center gap-2 sm:gap-2.5 w-full max-w-4xl mx-auto">
        {/* Instructions hint with smooth entrance */}
        {!hasInteracted && (
          <div
            className="pointer-events-auto flex items-center gap-2 backdrop-blur-md px-3.5 sm:px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)]/90 text-[10px] sm:text-[11px] font-mono text-[var(--muted)] shadow-md transition-all duration-300 text-center animate-hero-hint"
          >
            <span className="hidden sm:inline">Drag to rotate 360° • Scroll to Zoom • Click items to interact</span>
            <span className="sm:hidden">Drag to rotate • Pinch to zoom • Tap items</span>
          </div>
        )}

        {/* Bottom Floating Camera Angle Navigation Dock - First-load smooth rise-up animation */}
        <nav className="pointer-events-auto max-w-[calc(100vw-1rem)] relative z-30 animate-hero-dock">
          <div
            className="nova-tabs-pill shadow-xl backdrop-blur-xl"
          >
            {/* Camera View Mode Quick-Toggles */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {CAMERA_MODES.map((cam) => {
                const isActive = cameraViewMode === cam.id;
                return (
                  <button
                    key={cam.id}
                    id={`cam-btn-${cam.id}`}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectCameraMode?.(cam.id);
                    }}
                    title={cam.tooltip}
                    className={`nova-tab-item ${isActive ? 'active' : ''}`}
                  >
                    {cam.icon}
                    <span className="hidden sm:inline whitespace-nowrap">{cam.label}</span>
                    <span className="sm:hidden whitespace-nowrap">{cam.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Workstation Interactive Items Popover */}
            {onInteractItem && (
              <>
                <div className="w-px h-4 sm:h-5 mx-0.5 bg-[var(--line)] shrink-0" />
                <div ref={deskItemsRef} className="relative shrink-0">
                  <button
                    id="btn-desk-items"
                    onClick={() => {
                      soundManager.playClick();
                      setShowDeskItems(!showDeskItems);
                    }}
                    title="Interact with workstation hardware & accessories"
                    className={`nova-tab-item ${showDeskItems ? 'active' : ''}`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Desk Items</span>
                    <span className="sm:hidden whitespace-nowrap">Items</span>
                    <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${showDeskItems ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Popover Menu above bottom dock - cleanly split header and scroll area */}
                  {showDeskItems && (
                    <div
                      className="fixed bottom-[4.25rem] left-1/2 -translate-x-1/2 sm:absolute sm:bottom-full sm:mb-3 sm:left-1/2 sm:-translate-x-1/2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)]/98 text-[var(--ink)] shadow-2xl backdrop-blur-2xl z-50 flex flex-col overflow-hidden animate-popover"
                    >
                      <div className="flex items-center justify-between px-3.5 py-2.5 text-[10px] sm:text-[11px] font-mono text-[var(--accent)] uppercase tracking-wider font-extrabold border-b border-[var(--line)] bg-[var(--surface-strong)] shrink-0 gap-2">
                        <span className="whitespace-nowrap shrink-0">Workstation Hardware</span>
                        <span className="text-[var(--muted)] font-normal whitespace-nowrap text-right">
                          <span className="hidden sm:inline">Click to test & </span>view in 3D
                        </span>
                      </div>
                      <div className="p-2 overflow-y-auto max-h-[48vh] sm:max-h-[52vh] scrollbar-thin grid grid-cols-1 gap-1">
                        {WORKSTATION_ITEMS.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              soundManager.playClick();
                              onInteractItem(item.id);
                              setShowDeskItems(false);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors group hover:bg-[var(--accent-soft)]/50 hover:text-[var(--accent)] text-[var(--muted)]"
                          >
                            <span className="text-[var(--accent)] shrink-0 p-1 rounded-lg bg-[var(--accent-soft)]/60 group-hover:scale-110 transition-transform">
                              {item.icon}
                            </span>
                            <span className="truncate font-semibold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};
