import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SectionId, LightingMode, ProjectItem, CameraViewMode, WorkstationToast } from './types';
import { ThreeCanvas } from './three/ThreeCanvas';
import { NavigationHUD } from './components/NavigationHUD';
import { SectionOverlay } from './components/SectionOverlay';
import { ProjectModal } from './components/ProjectModal';
import { FullCVModal } from './components/FullCVModal';
import { WorkstationControls } from './components/WorkstationControls';
import { DrivingHUD } from './components/DrivingHUD';
import { soundManager } from './utils/soundManager';

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [lightingMode, setLightingMode] = useState<LightingMode>('morning');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isFullCVOpen, setIsFullCVOpen] = useState<boolean>(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('default');
  const [workstationToast, setWorkstationToast] = useState<WorkstationToast | null>(null);
  const [interactTrigger, setInteractTrigger] = useState<{ item: string; timestamp: number } | null>(null);

  // Driving Mode States
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const [vehicleTelemetry, setVehicleTelemetry] = useState<{
    speed: number;
    maxSpeed: number;
    isDrifting: boolean;
    isBoosting: boolean;
  }>({ speed: 0, maxSpeed: 8.5, isDrifting: false, isBoosting: false });
  const [resetVehicleTrigger, setResetVehicleTrigger] = useState<number>(0);
  const [hornVehicleTrigger, setHornVehicleTrigger] = useState<number>(0);
  const [focusVehicleTrigger, setFocusVehicleTrigger] = useState<number>(0);
  const [gemsCollected, setGemsCollected] = useState<number>(0);
  const [totalGems, setTotalGems] = useState<number>(8);

  const drivingInputRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    boost: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
    boost: false,
  });

  const isLightMode = lightingMode === 'day' || lightingMode === 'morning';

  // Toggle dark/light mode attribute on document element
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.dataset.theme = 'light';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    }
  }, [isLightMode]);

  const handleSelectSection = useCallback((section: SectionId) => {
    setActiveSection(section);
    setCameraViewMode((prev) => {
      if (section === 'profile' && prev === 'desk-focus') {
        return prev;
      }
      return 'default';
    });
  }, []);

  const handleSelectCameraMode = useCallback((mode: CameraViewMode) => {
    soundManager.playClick();
    setCameraViewMode(mode);
    if (mode === 'desk-focus') {
      setActiveSection('profile');
    }
  }, []);

  const handleSelectProject = useCallback((proj: ProjectItem | null) => {
    setSelectedProject(proj);
  }, []);

  const handleHoverObject = useCallback((label: string | null) => {
    setHoveredLabel(label);
  }, []);

  const handleWorkstationInteract = useCallback((_info: { title: string; message: string; icon?: string }) => {
    // User directive: Popups removed; items trigger audio feedback and zoom to hero camera angle directly
  }, []);

  const handleInteractItem = useCallback((item: string) => {
    setInteractTrigger({ item, timestamp: Date.now() });
  }, []);

  // Cycle or select specific atmosphere
  const handleSelectLightingMode = useCallback((mode: LightingMode) => {
    soundManager.playClick();
    setLightingMode(mode);
  }, []);

  const handleToggleLighting = useCallback(() => {
    soundManager.playClick();
    setLightingMode((prev) => {
      if (prev === 'morning') return 'day';
      if (prev === 'day') return 'sunset';
      if (prev === 'sunset') return 'night';
      return 'morning';
    });
  }, []);

  // Start soothing ambient background sound on first user gesture (complying with browser audio policy)
  useEffect(() => {
    const handleInitialUserGesture = () => {
      soundManager.startAmbientBGM();
      window.removeEventListener('pointerdown', handleInitialUserGesture);
      window.removeEventListener('keydown', handleInitialUserGesture);
      window.removeEventListener('touchstart', handleInitialUserGesture);
    };

    window.addEventListener('pointerdown', handleInitialUserGesture, { once: true });
    window.addEventListener('keydown', handleInitialUserGesture, { once: true });
    window.addEventListener('touchstart', handleInitialUserGesture, { once: true });

    // Try starting on mount (works if permission is already granted)
    soundManager.startAmbientBGM();

    return () => {
      window.removeEventListener('pointerdown', handleInitialUserGesture);
      window.removeEventListener('keydown', handleInitialUserGesture);
      window.removeEventListener('touchstart', handleInitialUserGesture);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.startAmbientBGM();
      soundManager.playSuccess();
    } else {
      soundManager.stopAmbientBGM();
    }
  }, []);

  const handleOpenFullCV = useCallback(() => {
    soundManager.playClick();
    setIsFullCVOpen(true);
  }, []);

  const handleToggleDriving = useCallback((active: boolean) => {
    setIsDriving(active);
    if (active) {
      setActiveSection('overview');
      setSelectedProject(null);
      setIsFullCVOpen(false);
      setFocusVehicleTrigger((prev) => prev + 1);
    }
  }, []);

  const handleFocusVehicle = useCallback(() => {
    setFocusVehicleTrigger((prev) => prev + 1);
  }, []);

  const handleResetVehicle = useCallback(() => {
    setResetVehicleTrigger((prev) => prev + 1);
    setGemsCollected(0);
    setFocusVehicleTrigger((prev) => prev + 1);
  }, []);

  const handleHornVehicle = useCallback(() => {
    setHornVehicleTrigger((prev) => prev + 1);
  }, []);

  const handleVirtualInput = useCallback((input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    drift?: boolean;
    boost?: boolean;
  }) => {
    if (input.forward !== undefined) drivingInputRef.current.forward = input.forward;
    if (input.backward !== undefined) drivingInputRef.current.backward = input.backward;
    if (input.left !== undefined) drivingInputRef.current.left = input.left;
    if (input.right !== undefined) drivingInputRef.current.right = input.right;
    if (input.drift !== undefined) drivingInputRef.current.drift = input.drift;
    if (input.boost !== undefined) drivingInputRef.current.boost = input.boost;
  }, []);

  // Keyboard shortcut controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // If driving mode is active, handle car controls
      if (isDriving) {
        if (e.code === 'KeyW' || e.key === 'ArrowUp') {
          drivingInputRef.current.forward = true;
          e.preventDefault();
          return;
        }
        if (e.code === 'KeyS' || e.key === 'ArrowDown') {
          drivingInputRef.current.backward = true;
          e.preventDefault();
          return;
        }
        if (e.code === 'KeyA' || e.key === 'ArrowLeft') {
          drivingInputRef.current.left = true;
          e.preventDefault();
          return;
        }
        if (e.code === 'KeyD' || e.key === 'ArrowRight') {
          drivingInputRef.current.right = true;
          e.preventDefault();
          return;
        }
        if (e.code === 'Space') {
          drivingInputRef.current.drift = true;
          e.preventDefault();
          return;
        }
        if (e.key === 'Shift') {
          drivingInputRef.current.boost = true;
          e.preventDefault();
          return;
        }
        if (e.key.toLowerCase() === 'h') {
          handleHornVehicle();
          e.preventDefault();
          return;
        }
        if (e.key.toLowerCase() === 'r') {
          handleResetVehicle();
          e.preventDefault();
          return;
        }
        if (e.key === 'Escape') {
          setIsDriving(false);
          e.preventDefault();
          return;
        }
      }

      if (e.key === 'Escape') {
        if (selectedProject) {
          setSelectedProject(null);
        } else if (isFullCVOpen) {
          setIsFullCVOpen(false);
        } else if (activeSection !== 'overview') {
          setActiveSection('overview');
        }
      } else if (e.key === '1') {
        setActiveSection('overview');
      } else if (e.key === '2') {
        setActiveSection('profile');
      } else if (e.key === '3') {
        setActiveSection('projects');
      } else if (e.key === '4') {
        setActiveSection('skills');
      } else if (e.key === '5') {
        setActiveSection('experience');
      } else if (e.key === '6') {
        setActiveSection('contact');
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleSound();
      } else if (e.key.toLowerCase() === 'l') {
        handleToggleLighting();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.key === 'ArrowUp') {
        drivingInputRef.current.forward = false;
      }
      if (e.code === 'KeyS' || e.key === 'ArrowDown') {
        drivingInputRef.current.backward = false;
      }
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') {
        drivingInputRef.current.left = false;
      }
      if (e.code === 'KeyD' || e.key === 'ArrowRight') {
        drivingInputRef.current.right = false;
      }
      if (e.code === 'Space') {
        drivingInputRef.current.drift = false;
      }
      if (e.key === 'Shift') {
        drivingInputRef.current.boost = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isDriving,
    activeSection,
    isFullCVOpen,
    selectedProject,
    handleToggleLighting,
    handleToggleSound,
    handleHornVehicle,
    handleResetVehicle,
  ]);

  return (
    <div
      className="relative w-screen h-screen h-[100dvh] overflow-hidden font-sans transition-colors duration-500 bg-[var(--page)] text-[var(--ink)]"
    >
      {/* 3D WebGL Three.js Scene */}
      <ThreeCanvas
        activeSection={activeSection}
        lightingMode={lightingMode}
        cameraViewMode={cameraViewMode}
        onSelectSection={handleSelectSection}
        onSelectProject={handleSelectProject}
        onHoverObject={handleHoverObject}
        onWorkstationInteract={handleWorkstationInteract}
        interactTrigger={interactTrigger}
        isDriving={isDriving}
        onToggleDriving={handleToggleDriving}
        onVehicleTelemetry={setVehicleTelemetry}
        onGemCollected={(collected, total) => {
          setGemsCollected(collected);
          setTotalGems(total);
        }}
        drivingInputRef={drivingInputRef}
        resetVehicleTrigger={resetVehicleTrigger}
        hornVehicleTrigger={hornVehicleTrigger}
        focusVehicleTrigger={focusVehicleTrigger}
      />

      {/* Interactive Driving HUD (Overlaid when in driving mode) */}
      <DrivingHUD
        isDriving={isDriving}
        speed={vehicleTelemetry.speed}
        maxSpeed={vehicleTelemetry.maxSpeed}
        isDrifting={vehicleTelemetry.isDrifting}
        isBoosting={vehicleTelemetry.isBoosting}
        onExitDriving={() => handleToggleDriving(false)}
        onResetPosition={handleResetVehicle}
        onHorn={handleHornVehicle}
        onVirtualInput={handleVirtualInput}
        gemsCollected={gemsCollected}
        totalGems={totalGems}
      />

      {/* Floating Workstation & Camera Mode Controls (Hidden during driving mode for maximum immersion) */}
      {!isDriving && (
        <WorkstationControls
          activeSection={activeSection}
          cameraViewMode={cameraViewMode}
          onSelectCameraMode={handleSelectCameraMode}
          toast={workstationToast}
          onDismissToast={() => setWorkstationToast(null)}
          onInteractItem={handleInteractItem}
          isLightMode={isLightMode}
        />
      )}

      {/* Floating HUD Navigation (Hidden during driving mode) */}
      {!isDriving && (
        <NavigationHUD
          activeSection={activeSection}
          lightingMode={lightingMode}
          isLightMode={isLightMode}
          isMuted={isMuted}
          onSelectSection={handleSelectSection}
          onSelectLightingMode={handleSelectLightingMode}
          onToggleSound={handleToggleSound}
          onOpenFullCV={handleOpenFullCV}
          hoveredLabel={hoveredLabel}
          cameraViewMode={cameraViewMode}
          onSelectCameraMode={handleSelectCameraMode}
          onInteractItem={handleInteractItem}
          onEnterDriving={() => handleToggleDriving(true)}
        />
      )}

      {/* Section Content Overlay (Hidden during driving mode for pure driving immersion) */}
      {!isDriving && (
        <SectionOverlay
          activeSection={activeSection}
          onClose={() => setActiveSection('overview')}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onNavigateToSection={handleSelectSection}
          isLightMode={isLightMode}
        />
      )}

      {/* Interactive Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Full Resume / CV Document Reader & Print Modal */}
      <FullCVModal
        isOpen={isFullCVOpen}
        onClose={() => setIsFullCVOpen(false)}
      />
    </div>
  );
}
