import React from 'react';
import { soundManager } from '../utils/soundManager';

interface DrivingHUDProps {
  isDriving: boolean;
  speed: number;
  maxSpeed: number;
  isDrifting: boolean;
  isBoosting: boolean;
  onExitDriving: () => void;
  onResetPosition: () => void;
  onHorn: () => void;
  onVirtualInput: (input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    drift?: boolean;
    boost?: boolean;
  }) => void;
  gemsCollected?: number;
  totalGems?: number;
}

export const DrivingHUD: React.FC<DrivingHUDProps> = ({
  isDriving,
  speed,
  maxSpeed,
  isDrifting,
  isBoosting,
  onExitDriving,
  onResetPosition,
  onHorn,
  onVirtualInput,
  gemsCollected = 0,
  totalGems = 8,
}) => {
  if (!isDriving) return null;

  // Convert m/s to display km/h (e.g. 0 to 65 km/h)
  const kmh = Math.round(Math.abs(speed) * 3.6);
  const speedPercent = Math.min(100, Math.round((Math.abs(speed) / (maxSpeed * 1.5)) * 100));
  const gear = speed > 0.3 ? 'D' : speed < -0.3 ? 'R' : 'P';

  // Helper for responsive touch and pointer input bindings
  const bindTouch = (action: 'forward' | 'backward' | 'left' | 'right' | 'drift' | 'boost') => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onVirtualInput({ [action]: true });
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onVirtualInput({ [action]: false });
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onVirtualInput({ [action]: false });
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation();
      onVirtualInput({ [action]: true });
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.stopPropagation();
      onVirtualInput({ [action]: false });
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation();
      onVirtualInput({ [action]: false });
    },
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-2 sm:p-6 pb-3 sm:pb-6 select-none font-sans overflow-hidden">
      {/* TOP BAR: Header & Quick Actions */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-1.5 sm:gap-3">
        {/* Title & Status - Styled with novahoangdev Design System */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[var(--surface)]/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-[var(--line)] shadow-xl text-[var(--ink)] shrink-0">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs sm:text-sm font-extrabold text-[var(--ink)] flex items-center gap-1">
                🏎️ <span className="hidden sm:inline">Nova Hoang </span>Kart
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-bright)]/40 whitespace-nowrap">
                DRIVE
              </span>
            </div>
            <span className="text-[10px] text-[var(--muted)] hidden md:inline font-medium">
              Interactive 3D Arena & Track • Nova Hoang
            </span>
          </div>
        </div>

        {/* Action Buttons: Gems, Horn, Reset & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--accent)] text-xs sm:text-sm font-bold shadow-md whitespace-nowrap shrink-0"
            title="Collectible Data Gems"
          >
            <span>💎</span>
            <span className="tabular-nums font-extrabold">{gemsCollected}/{totalGems}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playHorn();
              onHorn();
            }}
            className="btn-nova-secondary !py-1.5 sm:!py-2 !px-3 font-bold !text-xs sm:!text-sm"
            title="Horn (H)"
          >
            <span>📢</span>
            <span className="hidden md:inline ml-1 font-bold">Horn (H)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResetPosition();
            }}
            className="btn-nova-secondary !py-1.5 sm:!py-2 !px-3 font-bold !text-xs sm:!text-sm"
            title="Reset to Starting Grid (R)"
          >
            <span>🔄</span>
            <span className="hidden md:inline ml-1 font-bold">Reset (R)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExitDriving();
            }}
            className="w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-extrabold shadow-lg active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Exit Drive Mode (ESC)"
          >
            <span>✕</span>
            <span className="hidden md:inline ml-1.5">Exit (ESC)</span>
          </button>
        </div>
      </div>

      {/* BOTTOM COCKPIT & CONTROLS */}
      <div className="w-full max-w-3xl mx-auto pointer-events-auto flex flex-col items-center gap-2">
        {/* DESKTOP VIEW (Visible on >= sm screen: >= 640px) */}
        <div className="hidden sm:flex flex-col items-center gap-3 w-full">
          {/* Speedometer Instrument Cluster */}
          <div className="flex items-center gap-6 bg-[var(--surface)]/95 backdrop-blur-md px-8 py-3 rounded-full border border-[var(--line)] shadow-2xl justify-center text-[var(--ink)]">
            {/* Gear Display */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-extrabold">Gear</span>
              <span
                className={`text-3xl font-black transition-colors ${
                  gear === 'R' ? 'text-amber-500' : gear === 'D' ? 'text-teal-600 dark:text-teal-400' : 'text-[var(--muted)]'
                }`}
              >
                {gear}
              </span>
            </div>

            <div className="h-8 w-px bg-[var(--line)]" />

            {/* Speed Number & Unit */}
            <div className="flex flex-col items-center min-w-[90px]">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--ink)] tracking-tight tabular-nums">
                  {kmh}
                </span>
                <span className="text-xs font-extrabold text-[var(--accent)] uppercase">km/h</span>
              </div>
              {/* Speed Gauge Bar */}
              <div className="w-32 h-2 rounded-full bg-[var(--page)] overflow-hidden mt-1 p-0.5 border border-[var(--line)]">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isBoosting
                      ? 'bg-gradient-to-r from-[var(--accent)] to-amber-400 animate-pulse'
                      : isDrifting
                      ? 'bg-amber-400'
                      : 'bg-[var(--accent)]'
                  }`}
                  style={{ width: `${speedPercent}%` }}
                />
              </div>
            </div>

            <div className="h-8 w-px bg-[var(--line)]" />

            {/* Status Badges: Drift & Nitro */}
            <div className="flex flex-col gap-1">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border transition-all ${
                  isBoosting
                    ? 'bg-[var(--accent)] text-white border-transparent shadow-sm'
                    : 'bg-[var(--page)] text-[var(--muted)] border-[var(--line)]'
                }`}
              >
                ⚡ NITRO
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border transition-all ${
                  isDrifting
                    ? 'bg-amber-500 text-white border-transparent shadow-sm'
                    : 'bg-[var(--page)] text-[var(--muted)] border-[var(--line)]'
                }`}
              >
                💨 DRIFT
              </span>
            </div>
          </div>

          {/* Desktop Controls Instructions Banner */}
          <div className="flex items-center gap-3 bg-[var(--surface)]/90 backdrop-blur-sm px-5 py-1.5 rounded-full border border-[var(--line)] text-[11px] text-[var(--muted)] shadow-sm">
            <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">W</kbd> /
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">↑</kbd> Drive
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">S</kbd> /
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">↓</kbd> Brake/Rev
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">D</kbd> Steer
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">Space</kbd> Drift
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-[var(--accent)]">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">Shift</kbd> Nitro
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-[var(--muted)]">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">H</kbd> Horn
            </span>
            <span className="text-[var(--line)]">•</span>
            <span className="flex items-center gap-1 font-bold text-rose-500">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--page)] border border-[var(--line)] text-[10px]">ESC</kbd> Exit
            </span>
          </div>
        </div>

        {/* MOBILE CONTROLS & COMPACT HUD (< sm: 640px) */}
        <div className="flex sm:hidden items-end justify-between w-full px-1 gap-1">
          {/* Left Thumb: Steering */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              {...bindTouch('left')}
              className="w-12 h-12 rounded-2xl bg-[var(--surface)] border-2 border-[var(--line)] active:border-[var(--accent)] active:bg-[var(--accent)] active:text-white text-[var(--ink)] text-lg font-bold flex items-center justify-center shadow-lg active:scale-90 transition-transform touch-none select-none cursor-pointer"
              aria-label="Steer Left"
            >
              ◀
            </button>
            <button
              type="button"
              {...bindTouch('right')}
              className="w-12 h-12 rounded-2xl bg-[var(--surface)] border-2 border-[var(--line)] active:border-[var(--accent)] active:bg-[var(--accent)] active:text-white text-[var(--ink)] text-lg font-bold flex items-center justify-center shadow-lg active:scale-90 transition-transform touch-none select-none cursor-pointer"
              aria-label="Steer Right"
            >
              ▶
            </button>
          </div>

          {/* Center: Compact Mobile Speedometer & Status */}
          <div className="flex flex-col items-center justify-center bg-[var(--surface)]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[var(--line)] shadow-xl shrink-0 text-[var(--ink)]">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  gear === 'R' ? 'bg-amber-500/20 text-amber-500' : gear === 'D' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-[var(--page)] text-[var(--muted)]'
                }`}
              >
                {gear}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black text-[var(--ink)] tabular-nums tracking-tight">
                  {kmh}
                </span>
                <span className="text-[9px] font-extrabold text-[var(--accent)]">KM/H</span>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-16 h-1.5 rounded-full bg-[var(--page)] overflow-hidden mt-1 p-0.5 border border-[var(--line)]">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isBoosting
                    ? 'bg-gradient-to-r from-[var(--accent)] to-amber-400 animate-pulse'
                    : isDrifting
                    ? 'bg-amber-400'
                    : 'bg-[var(--accent)]'
                }`}
                style={{ width: `${speedPercent}%` }}
              />
            </div>

            {/* Tiny indicators */}
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-[8px] font-extrabold px-1.5 rounded-full ${
                  isBoosting ? 'bg-[var(--accent)] text-white animate-pulse' : 'text-[var(--muted)]'
                }`}
              >
                ⚡NITRO
              </span>
              <span
                className={`text-[8px] font-extrabold px-1.5 rounded-full ${
                  isDrifting ? 'bg-amber-500 text-white' : 'text-[var(--muted)]'
                }`}
              >
                💨DRIFT
              </span>
            </div>
          </div>

          {/* Right Thumb: Actions & Pedals */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Mini action triggers (Nitro & Drift) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                {...bindTouch('boost')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border transition-all shadow-md active:scale-90 touch-none select-none flex items-center gap-0.5 ${
                  isBoosting
                    ? 'bg-[var(--accent)] text-white border-transparent'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--accent)]'
                }`}
              >
                ⚡<span>NITRO</span>
              </button>
              <button
                type="button"
                {...bindTouch('drift')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border transition-all shadow-md active:scale-90 touch-none select-none flex items-center gap-0.5 ${
                  isDrifting
                    ? 'bg-amber-500 text-white border-transparent'
                    : 'bg-[var(--surface)] border-[var(--line)] text-amber-500'
                }`}
              >
                💨<span>DRIFT</span>
              </button>
            </div>

            {/* Main Pedals: Brake/Reverse & Gas */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                {...bindTouch('backward')}
                className="w-12 h-12 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 active:bg-rose-600 active:text-white text-rose-500 text-xs font-bold flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform touch-none select-none cursor-pointer"
                aria-label="Brake or Reverse"
              >
                <span className="text-sm leading-none">▼</span>
                <span className="text-[8px] font-black mt-0.5">REV</span>
              </button>
              <button
                type="button"
                {...bindTouch('forward')}
                className="w-13 h-12 rounded-2xl bg-teal-500/15 border-2 border-teal-500/60 active:bg-teal-600 active:text-white text-teal-600 dark:text-teal-400 text-xs font-bold flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform touch-none select-none cursor-pointer"
                aria-label="Accelerate"
              >
                <span className="text-base leading-none">▲</span>
                <span className="text-[9px] font-black mt-0.5">GAS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
