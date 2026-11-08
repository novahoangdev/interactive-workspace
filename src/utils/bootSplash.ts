// Drives the HTML boot splash defined in index.html.
// The splash paints before any JS loads; these helpers advance it and fade it out
// once the 3D scene has drawn its first frame.

declare global {
  interface Window {
    __bootCreep?: number;
  }
}

const root = document.documentElement;
let finished = false;

export function setBootStep(progress: number, label?: string): void {
  if (finished) return;
  if (window.__bootCreep) {
    window.clearInterval(window.__bootCreep);
    window.__bootCreep = undefined;
  }
  root.style.setProperty('--boot-progress', progress.toFixed(3));
  const step = label ? document.getElementById('boot-step') : null;
  if (step) step.textContent = label!;
}

/** Fills the bar, fades the splash out and starts the page entrance animations. */
export function finishBoot(onReveal?: () => void): void {
  if (finished) return;
  setBootStep(1, 'Ready');
  finished = true;

  const splash = document.getElementById('boot-splash');
  window.setTimeout(() => {
    splash?.classList.add('boot-done');
    root.classList.remove('app-booting');
    onReveal?.();
    window.setTimeout(() => splash?.remove(), 1600);
  }, 260);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
