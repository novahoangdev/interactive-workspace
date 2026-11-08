import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { SectionId, LightingMode, ProjectItem, CameraViewMode } from '../types';
import {
  createLowPolyIsland,
  createLowPolyTree,
  createDeveloperDesk,
} from './proceduralModels';
import { WorkstationInstance } from './workstation';
import { PROJECTS } from '../data/cvData';
import { soundManager } from '../utils/soundManager';
import { createNovaAvatarVehicle, VehicleController } from './characterVehicle';
import { createRgbStudioColumn } from './cornerDecor';
import { createInteractiveProps, InteractivePropsManager } from './interactiveProps';
import { Obstacle, footprintOf } from './obstacles';

interface ThreeCanvasProps {
  activeSection: SectionId;
  lightingMode: LightingMode;
  cameraViewMode?: CameraViewMode;
  onSelectSection: (section: SectionId) => void;
  onSelectProject: (project: ProjectItem) => void;
  onHoverObject: (label: string | null) => void;
  onWorkstationInteract?: (info: {
    title: string;
    message: string;
    icon?: string;
    actionUrl?: string;
    actionLabel?: string;
  }) => void;
  interactTrigger?: { item: string; timestamp: number } | null;
  isDriving?: boolean;
  onToggleDriving?: (active: boolean) => void;
  onVehicleTelemetry?: (data: { speed: number; maxSpeed: number; isDrifting: boolean; isBoosting: boolean }) => void;
  onGemCollected?: (collected: number, total: number) => void;
  drivingInputRef?: React.MutableRefObject<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    boost: boolean;
  }>;
  resetVehicleTrigger?: number;
  hornVehicleTrigger?: number;
  focusVehicleTrigger?: number;
}

// Camera coordinates focused on Central Workstation Island (Wide Studio Overview - Low Angle, Expansive View)
const CAMERA_PRESETS: Record<SectionId, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
  profile: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
  projects: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
  skills: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
  experience: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
  contact: {
    pos: new THREE.Vector3(0, 4.25, 11.2),
    target: new THREE.Vector3(0, 1.35, 0.7),
  },
};

// Workstation Hardware & Items Camera Focus Coordinates (Exquisite cinematic hero angles)
const ITEM_CAMERA_PRESETS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  'main-screen': { pos: new THREE.Vector3(0, 2.98, 1.45), target: new THREE.Vector3(0, 2.96, -0.62) },
  'screen-main': { pos: new THREE.Vector3(0, 2.98, 1.45), target: new THREE.Vector3(0, 2.96, -0.62) },
  'vertical-screen': { pos: new THREE.Vector3(0.70, 2.77, 0.85), target: new THREE.Vector3(1.54, 2.77, -0.45) },
  'screenbar': { pos: new THREE.Vector3(0.18, 3.77, 0.40), target: new THREE.Vector3(0, 3.59, -0.61) },
  'screen-bar': { pos: new THREE.Vector3(0.18, 3.77, 0.40), target: new THREE.Vector3(0, 3.59, -0.61) },
  'laptop': { pos: new THREE.Vector3(-0.93, 2.58, 0.83), target: new THREE.Vector3(-1.58, 2.30, -0.32) },
  'macbook': { pos: new THREE.Vector3(-0.93, 2.58, 0.83), target: new THREE.Vector3(-1.58, 2.30, -0.32) },
  'keyboard': { pos: new THREE.Vector3(0.06, 2.42, 0.68), target: new THREE.Vector3(0, 1.92, 0.12) },
  'mouse': { pos: new THREE.Vector3(0.58, 2.35, 0.66), target: new THREE.Vector3(0.74, 1.95, 0.18) },
  'audio-interface': { pos: new THREE.Vector3(-0.49, 2.31, 0.37), target: new THREE.Vector3(-0.64, 1.99, -0.28) },
  'scarlett': { pos: new THREE.Vector3(-0.49, 2.31, 0.37), target: new THREE.Vector3(-0.64, 1.99, -0.28) },
  'clock': { pos: new THREE.Vector3(0.82, 2.27, 0.25), target: new THREE.Vector3(1.06, 1.99, -0.32) },
  'desk-clock': { pos: new THREE.Vector3(0.82, 2.27, 0.25), target: new THREE.Vector3(1.06, 1.99, -0.32) },
  'phone': { pos: new THREE.Vector3(-1.12, 2.27, 1.05), target: new THREE.Vector3(-1.45, 2.08, 0.55) },
  'chair': { pos: new THREE.Vector3(1.85, 1.68, 3.65), target: new THREE.Vector3(0, 1.10, 1.84) },
  'mac-mini': { pos: new THREE.Vector3(0.42, 2.32, 0.2), target: new THREE.Vector3(0.7, 1.96, -0.5) },
  'headphones': { pos: new THREE.Vector3(1.30, 2.50, 0.70), target: new THREE.Vector3(1.78, 2.34, 0.05) },
  'coffee': { pos: new THREE.Vector3(-0.74, 2.34, 0.82), target: new THREE.Vector3(-0.96, 1.98, 0.32) },
  'coffee-mug': { pos: new THREE.Vector3(-0.74, 2.34, 0.82), target: new THREE.Vector3(-0.96, 1.98, 0.32) },
  'rubber-duck': { pos: new THREE.Vector3(0.48, 2.31, 0.33), target: new THREE.Vector3(0.70, 1.99, -0.22) },
  'duck': { pos: new THREE.Vector3(0.48, 2.31, 0.33), target: new THREE.Vector3(0.70, 1.99, -0.22) },
  'pc-tower': { pos: new THREE.Vector3(0.55, 1.05, 1.15), target: new THREE.Vector3(1.42, 0.79, 0.05) },
  'pc': { pos: new THREE.Vector3(0.55, 1.05, 1.15), target: new THREE.Vector3(1.42, 0.79, 0.05) },
  'sneaker-shelf': { pos: new THREE.Vector3(-0.70, 2.65, 3.85), target: new THREE.Vector3(-3.40, 2.40, -0.05) },
  'sneakers': { pos: new THREE.Vector3(-0.70, 2.65, 3.85), target: new THREE.Vector3(-3.40, 2.40, -0.05) },
  'bookshelf': { pos: new THREE.Vector3(0.70, 2.65, 3.85), target: new THREE.Vector3(3.40, 2.40, -0.05) },
  'books': { pos: new THREE.Vector3(0.70, 2.65, 3.85), target: new THREE.Vector3(3.40, 2.40, -0.05) },
  'plant': { pos: new THREE.Vector3(-0.62, 2.30, 0.02), target: new THREE.Vector3(-0.84, 2.02, -0.46) },
  'speakers': { pos: new THREE.Vector3(-0.95, 2.10, 0.85), target: new THREE.Vector3(-1.25, 1.90, 0.28) },
  'speaker': { pos: new THREE.Vector3(-0.95, 2.10, 0.85), target: new THREE.Vector3(-1.25, 1.90, 0.28) },
};

// Items placed on the sit-stand desk that move vertically with desk elevation
const DESK_ITEMS_SET = new Set([
  'main-screen',
  'screen-main',
  'vertical-screen',
  'screen-vertical',
  'screenbar',
  'screen-bar',
  'laptop',
  'macbook',
  'keyboard',
  'mouse',
  'audio-interface',
  'scarlett',
  'clock',
  'desk-clock',
  'phone',
  'headphones',
  'mac-mini',
  'coffee',
  'coffee-mug',
  'rubber-duck',
  'duck',
  'plant',
  'speakers',
  'speaker',
]);

const ThreeCanvasComponent: React.FC<ThreeCanvasProps> = ({
  activeSection,
  lightingMode,
  cameraViewMode = 'default',
  onSelectSection,
  onSelectProject,
  onHoverObject,
  onWorkstationInteract,
  interactTrigger,
  isDriving = false,
  onToggleDriving,
  onVehicleTelemetry,
  onGemCollected,
  drivingInputRef,
  resetVehicleTrigger,
  hornVehicleTrigger,
  focusVehicleTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const workstationRef = useRef<WorkstationInstance | null>(null);
  const vehicleRef = useRef<VehicleController | null>(null);
  const interactivePropsRef = useRef<InteractivePropsManager | null>(null);
  const isDrivingRef = useRef<boolean>(isDriving);
  isDrivingRef.current = isDriving;

  // Stabilize callbacks to prevent tearing down the WebGL scene on render
  const callbacksRef = useRef({
    onSelectSection,
    onSelectProject,
    onHoverObject,
    onWorkstationInteract,
    onToggleDriving,
    onVehicleTelemetry,
    onGemCollected,
  });
  callbacksRef.current = {
    onSelectSection,
    onSelectProject,
    onHoverObject,
    onWorkstationInteract,
    onToggleDriving,
    onVehicleTelemetry,
    onGemCollected,
  };

  // Cache last hovered text to prevent constant state update spam
  const lastHoveredText = useRef<string | null>(null);

  // Animation and interaction refs centered on workstation
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.8, 5.2));
  const currentTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.35, 0));
  const destinationPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.8, 5.2));
  const destinationTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.35, 0));
  const focusedDeskItemRef = useRef<string | null>(null);

  // Lighting refs for dynamic theme switches
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const roomLightRef = useRef<THREE.PointLight | null>(null);

  // Dynamic mesh references for tick animations
  const rotatingArtifacts = useRef<{ mesh: THREE.Mesh; speed: number; baseY: number }[]>([]);
  const animatedSkillCubes = useRef<{ mesh: THREE.Mesh; speed: number; baseY: number; phase: number }[]>([]);
  const beaconParts = useRef<{ dish: THREE.Mesh; ring: THREE.Mesh } | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const clickableObjectsRef = useRef<THREE.Object3D[]>([]);
  const pendingHover = useRef<{ x: number; y: number } | null>(null);
  const shadowFramesRemaining = useRef<number>(6);

  // Drag controls state with momentum & touch pinch
  const isDragging = useRef<boolean>(false);
  const prevPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistance = useRef<number>(0);
  const orbitVelocity = useRef<{ theta: number; phi: number }>({ theta: 0, phi: 0 });
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchRadius = useRef<number>(5.5);

  const orbitOffset = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: 1.30,
    radius: 10.9,
  });
  const isFreeOrbit = useRef<boolean>(false);

  // Update target coordinates when section or cameraViewMode prop changes
  useEffect(() => {
    focusedDeskItemRef.current = null;
    let targetPos = CAMERA_PRESETS.overview.pos.clone();
    let lookTarget = CAMERA_PRESETS.overview.target.clone();

    if (cameraViewMode === 'desk-focus') {
      // Elevated ergonomic viewpoint framing the full BenQ MA270S display and desk peripherals
      const deskDeltaY = workstationRef.current ? workstationRef.current.getState().deskElevation - 0.22 : 0;
      targetPos = new THREE.Vector3(0, 3.32 + deskDeltaY, 3.55);
      lookTarget = new THREE.Vector3(0, 2.67 + deskDeltaY, -0.28);
    } else if (cameraViewMode === 'isometric') {
      targetPos = new THREE.Vector3(5.2, 5.35, 5.2);
      lookTarget = new THREE.Vector3(0, 1.45, 0);
    } else if (cameraViewMode === 'top-down') {
      targetPos = new THREE.Vector3(0, 8.0, 0.05);
      lookTarget = new THREE.Vector3(0, 1.45, 0);
    }

    destinationPos.current.copy(targetPos);
    destinationTarget.current.copy(lookTarget);

    const diff = targetPos.clone().sub(lookTarget);
    const radius = diff.length();
    const phi = Math.acos(Math.max(-1, Math.min(1, diff.y / Math.max(0.001, radius))));
    const theta = Math.atan2(diff.x, diff.z);
    orbitOffset.current = { theta, phi, radius };
    isFreeOrbit.current = false;
    soundManager.playNavChime();
  }, [activeSection, cameraViewMode]);

  // Update lighting theme when lightingMode changes
  // Ambient motes: soft teal bokeh on light skies, warm/teal glow on dark skies
  const applyParticleTheme = (mode: LightingMode) => {
    const points = particlesRef.current;
    if (!points) return;
    const mat = points.material as THREE.PointsMaterial;
    const theme: Record<LightingMode, { color: number; opacity: number; size: number; additive: boolean }> = {
      morning: { color: 0x4f9e98, opacity: 0.65, size: 0.13, additive: false },
      day: { color: 0x4f9e98, opacity: 0.6, size: 0.13, additive: false },
      sunset: { color: 0xffc98a, opacity: 0.85, size: 0.13, additive: true },
      night: { color: 0x8accc6, opacity: 0.9, size: 0.12, additive: true },
    };
    const t = theme[mode];
    mat.color.setHex(t.color);
    mat.opacity = t.opacity;
    mat.size = t.size;
    mat.blending = t.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.needsUpdate = true;
  };

  const applyLightingTheme = (mode: LightingMode) => {
    if (!sceneRef.current || !dirLightRef.current || !ambientLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const amb = ambientLightRef.current;
    const hemi = hemiLightRef.current;
    const room = roomLightRef.current;
    const renderer = rendererRef.current;

    if (mode === 'morning') {
      // Warm golden morning sunrise (gentle, bright, clear ground visibility)
      const bg = new THREE.Color(0xfef3c7);
      scene.background = bg;
      scene.fog = new THREE.FogExp2(0xfef3c7, 0.007);
      if (renderer) renderer.setClearColor(bg, 1);
      dir.color.setHex(0xfde047);
      dir.intensity = 2.4;
      amb.color.setHex(0xffedd5);
      amb.intensity = 1.7;
      hemi.color.setHex(0x38bdf8);
      hemi.groundColor.setHex(0x475569); // Soft ground fill so road is never pitch dark
      hemi.intensity = 1.4;
      if (room) {
        room.color.setHex(0xfef08a);
        room.intensity = 1.2;
      }
    } else if (mode === 'day') {
      // Crisp clear daylight (Clean, highly visible, soothing)
      const bg = new THREE.Color(0xe0f2fe);
      scene.background = bg;
      scene.fog = new THREE.FogExp2(0xe0f2fe, 0.006);
      if (renderer) renderer.setClearColor(bg, 1);
      dir.color.setHex(0xffffff);
      dir.intensity = 2.5;
      amb.color.setHex(0xf1f5f9);
      amb.intensity = 1.7;
      hemi.color.setHex(0x38bdf8);
      hemi.groundColor.setHex(0x475569);
      hemi.intensity = 1.4;
      if (room) {
        room.color.setHex(0xffffff);
        room.intensity = 0.8;
      }
    } else if (mode === 'sunset') {
      // Vivid sunset twilight (Gentle fog and bright ground fill so road is soft and clearly visible)
      const bg = new THREE.Color(0x381e4b);
      scene.background = bg;
      scene.fog = new THREE.FogExp2(0x381e4b, 0.007);
      if (renderer) renderer.setClearColor(bg, 1);
      dir.color.setHex(0xfb923c);
      dir.intensity = 2.2;
      amb.color.setHex(0x86198f);
      amb.intensity = 1.6;
      hemi.color.setHex(0xfdba74);
      hemi.groundColor.setHex(0x475569); // Soft ground fill
      hemi.intensity = 1.4;
      if (room) {
        room.color.setHex(0xfdba74);
        room.intensity = 2.0;
      }
    } else {
      // Night with warm cozy room lighting & bright road ground fill
      const bg = new THREE.Color(0x0f172a);
      scene.background = bg;
      scene.fog = new THREE.FogExp2(0x0f172a, 0.008);
      if (renderer) renderer.setClearColor(bg, 1);
      dir.color.setHex(0x93c5fd);
      dir.intensity = 1.8;
      amb.color.setHex(0x475569);
      amb.intensity = 1.7;
      hemi.color.setHex(0x60a5fa);
      hemi.groundColor.setHex(0x334155);
      hemi.intensity = 1.4;
      if (room) {
        room.color.setHex(0xfef08a);
        room.intensity = 3.2; // Bright cozy indoor ceiling light
      }
    }
    shadowFramesRemaining.current = 8;
    applyParticleTheme(mode);
  };

  useEffect(() => {
    applyLightingTheme(lightingMode);
  }, [lightingMode]);

  // Smoothly focus camera onto the best hero angle for a specific device
  const focusCameraOnItem = useCallback((itemKey: string) => {
    // Explicitly do NOT zoom camera when clicking the desk elevation button or desk
    if (itemKey === 'desk-controller' || itemKey === 'desk' || itemKey === 'sit-stand') {
      return;
    }

    const preset = ITEM_CAMERA_PRESETS[itemKey];
    if (preset) {
      // Dynamically account for sit-stand desk height (0m at sitting 74cm, +0.36m at standing 108cm)
      let deltaY = 0;
      if (DESK_ITEMS_SET.has(itemKey) && workstationRef.current) {
        const state = workstationRef.current.getState();
        const targetElevation = state.deskElevationTarget !== undefined ? state.deskElevationTarget : state.deskElevation;
        deltaY = targetElevation - 0.22;
      }

      destinationPos.current.set(preset.pos.x, preset.pos.y + deltaY, preset.pos.z);
      destinationTarget.current.set(preset.target.x, preset.target.y + deltaY, preset.target.z);
      isFreeOrbit.current = false;
      focusedDeskItemRef.current = DESK_ITEMS_SET.has(itemKey) ? itemKey : null;

      const offset = new THREE.Vector3().subVectors(destinationPos.current, destinationTarget.current);
      const radius = offset.length();
      const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
      const theta = Math.atan2(offset.x, offset.z);
      orbitOffset.current = { theta, phi, radius };
      shadowFramesRemaining.current = 40;
    }
  }, []);
  const focusCameraOnItemRef = useRef(focusCameraOnItem);
  focusCameraOnItemRef.current = focusCameraOnItem;

  // Dedicated function to immediately and perfectly lock camera focus onto the vehicle
  const focusCameraOnVehicle = useCallback((immediate: boolean = true) => {
    if (!vehicleRef.current) return;
    const telemetry = vehicleRef.current.getTelemetry?.();
    const carPos = telemetry ? telemetry.position : new THREE.Vector3(0, 0.41, 6.2);
    const yaw = telemetry ? telemetry.rotation : Math.PI * 0.5;
    const chaseDistance = 3.6;
    const chaseHeight = 1.7;

    const targetCamX = carPos.x - Math.sin(yaw) * chaseDistance;
    const targetCamY = carPos.y + chaseHeight;
    const targetCamZ = carPos.z - Math.cos(yaw) * chaseDistance;

    const targetLookX = carPos.x + Math.sin(yaw) * 0.9;
    const targetLookY = carPos.y + 0.6;
    const targetLookZ = carPos.z + Math.cos(yaw) * 0.9;

    destinationPos.current.set(targetCamX, targetCamY, targetCamZ);
    destinationTarget.current.set(targetLookX, targetLookY, targetLookZ);

    if (immediate && cameraRef.current) {
      currentPos.current.set(targetCamX, targetCamY, targetCamZ);
      currentTarget.current.set(targetLookX, targetLookY, targetLookZ);
      cameraRef.current.position.set(targetCamX, targetCamY, targetCamZ);
      cameraRef.current.lookAt(targetLookX, targetLookY, targetLookZ);
    }

    // Synchronize orbit around the car so any orbit rotation pivots around the car instead of jumping to desk
    const diff = currentPos.current.clone().sub(currentTarget.current);
    const radius = Math.max(1.5, diff.length());
    const phi = Math.max(0.08, Math.min(Math.PI * 0.48, Math.acos(Math.max(-0.999, Math.min(0.999, diff.y / radius)))));
    const theta = Math.atan2(diff.x, diff.z);
    orbitOffset.current = { theta, phi, radius };

    isFreeOrbit.current = false;
    isDragging.current = false;
    focusedDeskItemRef.current = null;
    shadowFramesRemaining.current = 30;
  }, []);
  const focusCameraOnVehicleRef = useRef(focusCameraOnVehicle);
  focusCameraOnVehicleRef.current = focusCameraOnVehicle;

  // Handle external workstation interactions (e.g. from mobile devices drawer or quick chips)
  useEffect(() => {
    if (interactTrigger && workstationRef.current) {
      const res = workstationRef.current.interact(interactTrigger.item);
      // For desk elevation, display feedback toast but DO NOT zoom camera
      if (
        interactTrigger.item === 'desk-controller' ||
        interactTrigger.item === 'desk' ||
        interactTrigger.item === 'sit-stand'
      ) {
        callbacksRef.current.onWorkstationInteract?.(res);
        return;
      }
      // Zoom camera directly into the best hero angle without showing popup
      focusCameraOnItem(interactTrigger.item);
    }
  }, [interactTrigger, focusCameraOnItem]);

  // Respond to driving mode state changes & immediately lock focus on vehicle
  useEffect(() => {
    if (vehicleRef.current) {
      vehicleRef.current.setDriving(isDriving);
    }
    if (isDriving) {
      focusCameraOnVehicle(true);
    }
  }, [isDriving, focusCameraOnVehicle]);

  // Respond to vehicle reset trigger
  useEffect(() => {
    if (resetVehicleTrigger && vehicleRef.current) {
      vehicleRef.current.resetPosition();
      interactivePropsRef.current?.resetAll();
      focusCameraOnVehicle(true);
    }
  }, [resetVehicleTrigger, focusCameraOnVehicle]);

  // Respond to vehicle horn trigger
  useEffect(() => {
    if (hornVehicleTrigger && vehicleRef.current) {
      vehicleRef.current.triggerHorn();
    }
  }, [hornVehicleTrigger]);

  // Respond to external focus vehicle trigger
  useEffect(() => {
    if (focusVehicleTrigger && vehicleRef.current) {
      focusCameraOnVehicle(true);
    }
  }, [focusVehicleTrigger, focusCameraOnVehicle]);

  // Main Three.js setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.015);

    // Camera (near = 0.05 prevents any close-up hero clipping artifacts)
    const initialAspect = width / height;
    const initialFov = initialAspect < 1.0 ? Math.min(62, 45 + (1.0 - initialAspect) * 22) : 45;
    const camera = new THREE.PerspectiveCamera(initialFov, initialAspect, 0.05, 120);
    // Smooth cinematic intro: start slightly pulled back & higher, then gracefully swoop into workstation
    const introPos = new THREE.Vector3(
      CAMERA_PRESETS.overview.pos.x,
      CAMERA_PRESETS.overview.pos.y + 2.8,
      CAMERA_PRESETS.overview.pos.z + 4.2
    );
    camera.position.copy(introPos);
    currentPos.current.copy(introPos);
    destinationPos.current.copy(CAMERA_PRESETS.overview.pos);
    currentTarget.current.copy(CAMERA_PRESETS.overview.target);
    destinationTarget.current.copy(CAMERA_PRESETS.overview.target);
    camera.lookAt(currentTarget.current);
    cameraRef.current = camera;

    // Hardware detection for lower-end devices and mobile screens
    const isMobile = typeof navigator !== 'undefined' && (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || width < 768);
    const isLowEndDevice = typeof navigator !== 'undefined' && (((navigator.hardwareConcurrency || 4) <= 4) || isMobile);

    // Renderer: adaptive DPR (1.25 on low-end / mobile, 1.5 max on desktop) avoids fill-rate throttling
    const renderer = new THREE.WebGLRenderer({
      antialias: !isLowEndDevice,
      powerPreference: 'high-performance',
      precision: isLowEndDevice ? 'mediump' : 'highp',
      alpha: false,
      stencil: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLowEndDevice ? 1.25 : 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isLowEndDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    // AutoUpdate = false caches the shadow map, saving ~50% draw calls per frame!
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.touchAction = 'none';
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.9);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.8);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    dirLight.position.set(14, 22, 12);
    dirLight.castShadow = true;
    // 1024x1024 with tight bounds focuses crisp shadow detail right on the workstation desk
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -6.5;
    dirLight.shadow.camera.right = 6.5;
    dirLight.shadow.camera.top = 6.5;
    dirLight.shadow.camera.bottom = -6.5;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Colored Accent Point Lights for Central Workstation Ambiance
    const cyanPoint = new THREE.PointLight(0x06b6d4, 1.5, 16);
    cyanPoint.position.set(-4.2, 3.2, 2.0);
    scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0x8b5cf6, 1.4, 16);
    purplePoint.position.set(4.2, 3.2, -2.0);
    scene.add(purplePoint);

    const emeraldPoint = new THREE.PointLight(0x10b981, 1.2, 14);
    emeraldPoint.position.set(0, 2.8, -3.5);
    scene.add(emeraldPoint);

    // Room Ceiling Downlight (Ensures workstation and desk are comfortably bright and clear in night mode)
    const roomCeilingLight = new THREE.PointLight(0xfef08a, 3.2, 35);
    roomCeilingLight.position.set(0, 6.5, 1.2);
    scene.add(roomCeilingLight);
    roomLightRef.current = roomCeilingLight;

    // Apply lighting theme immediately to initialize background, lights, and fog
    applyLightingTheme(lightingMode);

    // -------------------------------------------------------------
    // BUILD CENTRAL WORKSTATION ISLAND ONLY (SURROUNDING CLUSTERS REMOVED)
    // -------------------------------------------------------------

    // CENTER ISLAND: Workstation & Cyber Racetrack Arena (Expanded to radius 28m)
    // Using soft, soothing slate tone (0x334155) for clear road & ground visibility
    const centerIsland = createLowPolyIsland(28.0, 12.0, 0x334155, 0x1e293b);
    centerIsland.position.set(0, 0, 0);
    centerIsland.name = 'island-profile';
    Object.assign(centerIsland.userData, { isClickable: true, sectionId: 'profile', label: 'Personal Workstation' });
    scene.add(centerIsland);

    const { group: deskGroup, instance: workstationInstance } = createDeveloperDesk();
    deskGroup.position.set(0, 0.4, 0);
    deskGroup.userData = { isDeskRoot: true };
    centerIsland.add(deskGroup);
    workstationRef.current = workstationInstance;

    // Sleek Cyber Ambient Studio RGB Light Columns
    const c1 = createRgbStudioColumn(2.4, 0x06b6d4); // Neon Cyan
    c1.position.set(-3.8, 0.4, -2.8);
    centerIsland.add(c1);

    const c2 = createRgbStudioColumn(2.1, 0x8b5cf6); // Purple Studio Glow
    c2.position.set(4.0, 0.4, -2.5);
    centerIsland.add(c2);

    const c3 = createRgbStudioColumn(1.9, 0x38bdf8); // Sky Blue
    c3.position.set(-3.8, 0.4, 2.5);
    centerIsland.add(c3);

    const c4 = createRgbStudioColumn(2.0, 0x10b981); // Emerald Matrix Glow
    c4.position.set(3.8, 0.4, 2.5);
    centerIsland.add(c4);

    // Interactive Props & Obstacles (Traffic Cones, Kinetic Bouncing Orbs, Speed Boosters, Stunt Ramp, Collectible Gems, Crates)
    const propsManager = createInteractiveProps(28.0);
    centerIsland.add(propsManager.group);
    interactivePropsRef.current = propsManager;

    // 3D Avatar Model of Nova Hoang in Cyber Go-Kart (Parked comfortably in front of workstation plaza)
    const vehicle = createNovaAvatarVehicle(new THREE.Vector3(0, 0.41, 6.2));
    centerIsland.add(vehicle.group);
    centerIsland.add(vehicle.tireTracksGroup);
    centerIsland.add(vehicle.tireSmokeGroup);
    vehicleRef.current = vehicle;
    clickableObjectsRef.current.push(vehicle.group);

    // Static obstacles measured from the real furniture, shared by the kart and the props
    const obstacles: Obstacle[] = ['desk-top', 'bookshelf', 'sneaker-shelf', 'chair-ergonomic']
      .map((name) => deskGroup.getObjectByName(name))
      .filter((obj): obj is THREE.Object3D => !!obj)
      .map((obj) => footprintOf(obj, centerIsland));
    [c1, c2, c3, c4].forEach((col) => {
      obstacles.push({ kind: 'circle', cx: col.position.x, cz: col.position.z, r: 0.26 });
    });
    obstacles.push(...((centerIsland.userData.obstacles as Obstacle[] | undefined) ?? [])); // start gantry legs
    const wallRadius = centerIsland.userData.wallRadius as number | undefined;
    vehicle.setObstacles([...obstacles, ...propsManager.rampObstacles], wallRadius);
    propsManager.setObstacles(obstacles, wallRadius);

    // Ambient floating motes around the workstation: round, soft-edged, drifting
    // upward at their own pace and fading in/out instead of popping.
    const particleCount = 160;
    const PARTICLE_MIN_Y = 0.2;
    const PARTICLE_MAX_Y = 6.5;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 4).fill(1);
    const particleBase = new Float32Array(particleCount * 2); // x, z anchors
    const particleSpeed = new Float32Array(particleCount);
    const particlePhase = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 10.5;
      const angle = Math.random() * Math.PI * 2;
      particleBase[i * 2] = Math.cos(angle) * radius;
      particleBase[i * 2 + 1] = Math.sin(angle) * radius;
      particlePositions[i * 3] = particleBase[i * 2];
      particlePositions[i * 3 + 1] = PARTICLE_MIN_Y + Math.random() * (PARTICLE_MAX_Y - PARTICLE_MIN_Y);
      particlePositions[i * 3 + 2] = particleBase[i * 2 + 1];
      particleSpeed[i] = 0.06 + Math.random() * 0.14;
      particlePhase[i] = Math.random() * Math.PI * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 4)); // alpha per mote

    // Soft round sprite: bright core with a gentle falloff
    const moteCanvas = document.createElement('canvas');
    moteCanvas.width = 64;
    moteCanvas.height = 64;
    const moteCtx = moteCanvas.getContext('2d');
    if (moteCtx) {
      const g = moteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      moteCtx.fillStyle = g;
      moteCtx.fillRect(0, 0, 64, 64);
    }
    const moteTexture = new THREE.CanvasTexture(moteCanvas);
    moteTexture.colorSpace = THREE.SRGBColorSpace;

    const particleMat = new THREE.PointsMaterial({
      map: moteTexture,
      size: 0.11,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      toneMapped: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.frustumCulled = false;
    particles.userData = { particleBase, particleSpeed, particlePhase, PARTICLE_MIN_Y, PARTICLE_MAX_Y };
    scene.add(particles);
    particlesRef.current = particles;
    applyParticleTheme(lightingMode);

    // Collect interactive objects once into a dedicated cache to avoid traversing entire scene graph on every raycast
    const interactiveList: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData && (obj.userData.isClickable || obj.userData.sectionId || obj.userData.workstationItem)) {
        interactiveList.push(obj);
      }
    });
    clickableObjectsRef.current = interactiveList;

    // -------------------------------------------------------------
    // RAYCASTER & INTERACTION
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const checkHover = (clientX: number, clientY: number) => {
      // In driving mode, disable hovering over desk items and keep cursor clean
      if (isDrivingRef.current) {
        renderer.domElement.style.cursor = 'default';
        if (lastHoveredText.current !== null) {
          lastHoveredText.current = null;
          callbacksRef.current.onHoverObject?.(null);
        }
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = clickableObjectsRef.current.length > 0 ? clickableObjectsRef.current : scene.children;
      const intersects = raycaster.intersectObjects(targets, true);

      let foundClickable = false;
      let hoverText: string | null = null;

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData && cur.userData.isClickable) {
            foundClickable = true;
            if (cur.userData.workstationItem) {
              hoverText = cur.userData.label || 'Workstation item (Click to interact)';
            } else if (cur.userData.projectId) {
              const proj = PROJECTS.find((p) => p.id === cur.userData.projectId);
              hoverText = proj ? `Project: ${proj.title}` : 'View project';
            } else if (cur.userData.skillName) {
              hoverText = `Skill: ${cur.userData.skillName}`;
            } else if (cur.userData.label) {
              hoverText = cur.userData.label;
            } else if (cur.userData.sectionId) {
              hoverText = `Navigate to ${cur.userData.sectionId.toUpperCase()}`;
            }
            break;
          }
          if (cur.userData && cur.userData.isDeskRoot) {
            break;
          }
          cur = cur.parent;
        }
        if (foundClickable) break;
      }

      renderer.domElement.style.cursor = foundClickable ? 'pointer' : 'default';

      // Only notify parent if hover label actually changed
      if (lastHoveredText.current !== hoverText) {
        lastHoveredText.current = hoverText;
        callbacksRef.current.onHoverObject?.(hoverText);
      }
    };

    const triggerClickAt = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = clickableObjectsRef.current.length > 0 ? clickableObjectsRef.current : scene.children;
      const intersects = raycaster.intersectObjects(targets, true);

      // In driving mode: ONLY permit clicking on the vehicle to refocus/lock camera.
      // STRICTLY BLOCK clicking on any workstation/desk items, screen monitors, mugs, pedestals, or islands!
      if (isDrivingRef.current) {
        for (const hit of intersects) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== scene) {
            if (cur.userData && cur.userData.isCharacterVehicle) {
              soundManager.playClick(true);
              focusCameraOnVehicleRef.current(true);
              return;
            }
            cur = cur.parent;
          }
        }
        // Discard all clicks on desk or island while driving
        return;
      }

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData && cur.userData.isClickable) {
            // 0. Clicked on Nova Hoang Character Model -> Immediately Focus Camera & Switch to Driving Mode!
            if (cur.userData.isCharacterVehicle) {
              soundManager.playClick(true);
              focusCameraOnVehicleRef.current(true);
              callbacksRef.current.onToggleDriving?.(true);
              return;
            }

            // 1. Workstation specific interactive item
            if (cur.userData.workstationItem && workstationRef.current) {
              const itemKey = cur.userData.workstationItem;
              const res = workstationRef.current.interact(itemKey);
              if (itemKey === 'main-screen' || itemKey === 'screen-main') {
                callbacksRef.current.onWorkstationInteract?.({
                  ...res,
                  actionUrl: 'https://novahoangdev.web.app/',
                  actionLabel: 'Open novahoangdev.web.app ↗',
                });
              } else if (itemKey === 'vertical-screen' || itemKey === 'screen-vertical') {
                callbacksRef.current.onWorkstationInteract?.(res);
              } else if (itemKey === 'desk-controller' || itemKey === 'desk' || itemKey === 'sit-stand') {
                // Show toast info, but DO NOT zoom camera to the button
                callbacksRef.current.onWorkstationInteract?.(res);
                return;
              }
              // Zoom directly to the device's best hero angle!
              focusCameraOnItemRef.current(itemKey);
              return;
            }

            // 2. Project Pedestal
            if (cur.userData.projectId) {
              soundManager.playClick(true);
              const proj = PROJECTS.find((p) => p.id === cur.userData.projectId);
              if (proj) {
                callbacksRef.current.onSelectProject?.(proj);
                return;
              }
            }

            // 3. Island Section
            if (cur.userData.sectionId) {
              soundManager.playClick(true);
              callbacksRef.current.onSelectSection?.(cur.userData.sectionId as SectionId);
              return;
            }

            if (cur.userData.type === 'contact') {
              soundManager.playClick(true);
              callbacksRef.current.onSelectSection?.('contact');
              return;
            }

            if (cur.userData.type === 'skill') {
              soundManager.playClick(true);
              callbacksRef.current.onSelectSection?.('skills');
              return;
            }
            break;
          }

          // If reached desk root without finding a clickable item, do NOT bubble to island!
          if (cur.userData && cur.userData.isDeskRoot) {
            return;
          }

          cur = cur.parent;
        }
      }
    };

    const syncOrbitFromCurrentCamera = () => {
      focusedDeskItemRef.current = null;
      const diff = currentPos.current.clone().sub(currentTarget.current);
      const radius = Math.max(1.5, diff.length());
      const phi = Math.max(0.08, Math.min(Math.PI * 0.48, Math.acos(Math.max(-0.999, Math.min(0.999, diff.y / radius)))));
      const theta = Math.atan2(diff.x, diff.z);
      orbitOffset.current = { theta, phi, radius };
      destinationTarget.current.copy(currentTarget.current);
      orbitVelocity.current = { theta: 0, phi: 0 };
    };

    // Desktop Mouse Handlers
    const handlePointerMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - prevPointer.current.x;
        const deltaY = e.clientY - prevPointer.current.y;
        prevPointer.current = { x: e.clientX, y: e.clientY };
        dragDistance.current += Math.hypot(deltaX, deltaY);

        orbitVelocity.current = {
          theta: -deltaX * 0.005,
          phi: -deltaY * 0.005,
        };

        orbitOffset.current.theta += orbitVelocity.current.theta;
        orbitOffset.current.phi = Math.max(0.08, Math.min(Math.PI * 0.48, orbitOffset.current.phi + orbitVelocity.current.phi));
        isFreeOrbit.current = true;

        const { theta, phi, radius } = orbitOffset.current;
        destinationPos.current.x = destinationTarget.current.x + radius * Math.sin(phi) * Math.sin(theta);
        destinationPos.current.y = destinationTarget.current.y + radius * Math.cos(phi);
        destinationPos.current.z = destinationTarget.current.z + radius * Math.sin(phi) * Math.cos(theta);

        // Immediate responsive tracking during drag
        currentPos.current.copy(destinationPos.current);
        currentTarget.current.copy(destinationTarget.current);
        return;
      }

      // Debounce hover check to requestAnimationFrame to avoid firing heavy raycasts on raw mousemove
      pendingHover.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragDistance.current = 0;
      prevPointer.current = { x: e.clientX, y: e.clientY };
      syncOrbitFromCurrentCamera();
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Generous drag threshold (14px) so clicks and trackpad taps are never dropped accidentally
      if (dragDistance.current < 14) {
        triggerClickAt(e.clientX, e.clientY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      syncOrbitFromCurrentCamera();
      // Proportional exponential zoom: silky smooth whether viewing entire island or zoomed into desk
      const zoomFactor = Math.exp(e.deltaY * 0.0014);
      orbitOffset.current.radius = Math.max(1.8, Math.min(14, orbitOffset.current.radius * zoomFactor));
      isFreeOrbit.current = true;

      const { theta, phi, radius } = orbitOffset.current;
      destinationPos.current.x = destinationTarget.current.x + radius * Math.sin(phi) * Math.sin(theta);
      destinationPos.current.y = destinationTarget.current.y + radius * Math.cos(phi);
      destinationPos.current.z = destinationTarget.current.z + radius * Math.sin(phi) * Math.cos(theta);
    };

    // Mobile Touch Handlers
    const handleTouchStart = (e: TouchEvent) => {
      syncOrbitFromCurrentCamera();
      if (e.touches.length === 1) {
        isDragging.current = true;
        dragDistance.current = 0;
        prevPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPinchDist.current = null;
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist.current = Math.hypot(dx, dy);
        initialPinchRadius.current = orbitOffset.current.radius;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const deltaX = e.touches[0].clientX - prevPointer.current.x;
        const deltaY = e.touches[0].clientY - prevPointer.current.y;
        prevPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragDistance.current += Math.hypot(deltaX, deltaY);

        orbitVelocity.current = {
          theta: -deltaX * 0.0065,
          phi: -deltaY * 0.0065,
        };

        orbitOffset.current.theta += orbitVelocity.current.theta;
        orbitOffset.current.phi = Math.max(0.08, Math.min(Math.PI * 0.48, orbitOffset.current.phi + orbitVelocity.current.phi));
        isFreeOrbit.current = true;

        const { theta, phi, radius } = orbitOffset.current;
        destinationPos.current.x = destinationTarget.current.x + radius * Math.sin(phi) * Math.sin(theta);
        destinationPos.current.y = destinationTarget.current.y + radius * Math.cos(phi);
        destinationPos.current.z = destinationTarget.current.z + radius * Math.sin(phi) * Math.cos(theta);

        // Immediate responsive tracking during touch swipe
        currentPos.current.copy(destinationPos.current);
        currentTarget.current.copy(destinationTarget.current);
      } else if (e.touches.length === 2 && initialPinchDist.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const ratio = initialPinchDist.current / Math.max(10, currentDist);
        orbitOffset.current.radius = Math.max(1.8, Math.min(14, initialPinchRadius.current * ratio));
        isFreeOrbit.current = true;

        const { theta, phi, radius } = orbitOffset.current;
        destinationPos.current.x = destinationTarget.current.x + radius * Math.sin(phi) * Math.sin(theta);
        destinationPos.current.y = destinationTarget.current.y + radius * Math.cos(phi);
        destinationPos.current.z = destinationTarget.current.z + radius * Math.sin(phi) * Math.cos(theta);

        currentPos.current.copy(destinationPos.current);
        currentTarget.current.copy(destinationTarget.current);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDragging.current = false;
      initialPinchDist.current = null;
      if (dragDistance.current < 16 && e.changedTouches.length === 1) {
        triggerClickAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    // Resize listener with requestAnimationFrame debouncing to prevent thrashing
    let resizeFrameId: number | null = null;
    const handleResize = () => {
      if (resizeFrameId !== null) return;
      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null;
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        const aspect = w / h;
        camera.aspect = aspect;
        if (aspect < 1.0) {
          camera.fov = Math.min(62, 45 + (1.0 - aspect) * 22);
        } else {
          camera.fov = 45;
        }
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        shadowFramesRemaining.current = Math.max(shadowFramesRemaining.current, 3);
      });
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    // Page visibility listener: completely sleep render loop when browser tab is inactive
    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        shadowFramesRemaining.current = Math.max(shadowFramesRemaining.current, 3);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Touch listeners attached to window for seamless drag even outside canvas bounds
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // -------------------------------------------------------------
    // ANIMATION LOOP (LERP & PROCEDURAL MOTIONS)
    // -------------------------------------------------------------
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. If tab is in background, pause render loop completely to save battery and GPU
      if (!isTabVisible) return;

      const timeMs = currentTime || performance.now();
      const delta = Math.min((timeMs - lastTime) / 1000, 0.1);
      lastTime = timeMs;
      const elapsedTime = timeMs / 1000;

      // 2. Debounced hover check (runs at most once per frame, aligned with screen refresh rate)
      if (pendingHover.current && !isDragging.current) {
        checkHover(pendingHover.current.x, pendingHover.current.y);
        pendingHover.current = null;
      }

      // 3. Tick developer workstation (fans, textures, steam, lights)
      if (workstationRef.current) {
        workstationRef.current.tick(elapsedTime);
      }

      // 4. Ambient motes: slow rise with a little sway; fade near the ends and twinkle softly
      if (particlesRef.current) {
        const pts = particlesRef.current;
        const { particleBase, particleSpeed, particlePhase, PARTICLE_MIN_Y, PARTICLE_MAX_Y } = pts.userData as {
          particleBase: Float32Array;
          particleSpeed: Float32Array;
          particlePhase: Float32Array;
          PARTICLE_MIN_Y: number;
          PARTICLE_MAX_Y: number;
        };
        const posAttr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = pts.geometry.getAttribute('color') as THREE.BufferAttribute;
        const pos = posAttr.array as Float32Array;
        const col = colAttr.array as Float32Array;
        const span = PARTICLE_MAX_Y - PARTICLE_MIN_Y;
        for (let i = 0; i < particleSpeed.length; i++) {
          const ph = particlePhase[i];
          let y = pos[i * 3 + 1] + particleSpeed[i] * delta;
          if (y > PARTICLE_MAX_Y) y -= span;
          pos[i * 3] = particleBase[i * 2] + Math.sin(elapsedTime * 0.35 + ph) * 0.3;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = particleBase[i * 2 + 1] + Math.cos(elapsedTime * 0.28 + ph) * 0.3;
          const fadeIn = THREE.MathUtils.smoothstep(y, PARTICLE_MIN_Y, PARTICLE_MIN_Y + 1.0);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(y, PARTICLE_MAX_Y - 1.4, PARTICLE_MAX_Y);
          const twinkle = 0.6 + 0.4 * Math.sin(elapsedTime * 1.3 + ph * 3.0);
          col[i * 4 + 3] = fadeIn * fadeOut * twinkle;
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // 5. Update Nova Hoang Character Vehicle & Driving Mode
      if (vehicleRef.current) {
        const input = drivingInputRef?.current || {
          forward: false,
          backward: false,
          left: false,
          right: false,
          drift: false,
          boost: false,
        };
        const telemetry = vehicleRef.current.update(delta, input);

        // Update interactive obstacles & props on the racetrack
        if (interactivePropsRef.current) {
          const propRes = interactivePropsRef.current.update(
            delta,
            telemetry.position,
            telemetry.speed,
            telemetry.rotation
          );
          if (propRes.kartSpeedLoss > 0) {
            vehicleRef.current.applyImpact(propRes.kartSpeedLoss);
          }
          if (propRes.boostImpulse) {
            vehicleRef.current.applyBoostImpulse();
          }
          if (propRes.jumpVelocity > 0) {
            vehicleRef.current.triggerJump(propRes.jumpVelocity);
          } else if (propRes.jumpElev > 0) {
            vehicleRef.current.applyJumpElevation(propRes.jumpElev);
          }
          if (propRes.newlyCollectedGem) {
            callbacksRef.current.onGemCollected?.(propRes.collectedCount, propRes.totalGems);
          }
        }

        if (isDrivingRef.current) {
          callbacksRef.current.onVehicleTelemetry?.(telemetry);

          const carPos = telemetry.position;
          const yaw = telemetry.rotation;
          const chaseDistance = 3.6 + (telemetry.isBoosting ? 0.8 : 0);
          const chaseHeight = 1.7;

          // Camera target is always locked onto the vehicle slightly ahead along heading
          const targetLookX = carPos.x + Math.sin(yaw) * 0.9;
          const targetLookY = carPos.y + 0.6;
          const targetLookZ = carPos.z + Math.cos(yaw) * 0.9;

          // Smooth 3rd person chase camera locked behind vehicle
          if (!isDragging.current && !initialPinchDist.current) {
            const targetCamX = carPos.x - Math.sin(yaw) * chaseDistance;
            const targetCamY = carPos.y + chaseHeight;
            const targetCamZ = carPos.z - Math.cos(yaw) * chaseDistance;

            destinationPos.current.set(targetCamX, targetCamY, targetCamZ);
            destinationTarget.current.set(targetLookX, targetLookY, targetLookZ);

            const camFollowSpeed = Math.min(1.0, delta * 12.0);
            currentPos.current.lerp(destinationPos.current, camFollowSpeed);
            currentTarget.current.lerp(destinationTarget.current, Math.min(1.0, delta * 16.0));
          } else {
            // While actively dragging to look around during drive mode, orbit directly around the CAR
            destinationTarget.current.set(targetLookX, targetLookY, targetLookZ);
            currentTarget.current.copy(destinationTarget.current);
            const { theta, phi, radius } = orbitOffset.current;
            currentPos.current.x = targetLookX + radius * Math.sin(phi) * Math.sin(theta);
            currentPos.current.y = targetLookY + radius * Math.cos(phi);
            currentPos.current.z = targetLookZ + radius * Math.sin(phi) * Math.cos(theta);
          }

          camera.position.copy(currentPos.current);
          camera.lookAt(currentTarget.current);
        }
      }

      if (!isDrivingRef.current) {
        // 7. Dynamically track height changes if camera is focused on a desk item or in desk-focus mode
        if (workstationRef.current && !isDragging.current && !isFreeOrbit.current) {
          if (focusedDeskItemRef.current) {
            const preset = ITEM_CAMERA_PRESETS[focusedDeskItemRef.current];
            if (preset && DESK_ITEMS_SET.has(focusedDeskItemRef.current)) {
              const liveDeltaY = workstationRef.current.getState().deskElevation - 0.22;
              destinationPos.current.y = preset.pos.y + liveDeltaY;
              destinationTarget.current.y = preset.target.y + liveDeltaY;
            }
          } else if (cameraViewMode === 'desk-focus') {
            const liveDeltaY = workstationRef.current.getState().deskElevation - 0.22;
            destinationPos.current.y = 3.32 + liveDeltaY;
            destinationTarget.current.y = 2.67 + liveDeltaY;
          }
        }

        // 8. Damping inertia when free orbiting without active drag
        if (isFreeOrbit.current) {
          if (!isDragging.current && !initialPinchDist.current) {
            orbitVelocity.current.theta *= 0.92;
            orbitVelocity.current.phi *= 0.92;
            if (Math.abs(orbitVelocity.current.theta) > 0.00005 || Math.abs(orbitVelocity.current.phi) > 0.00005) {
              orbitOffset.current.theta += orbitVelocity.current.theta;
              orbitOffset.current.phi = Math.max(0.08, Math.min(Math.PI * 0.48, orbitOffset.current.phi + orbitVelocity.current.phi));

              const { theta, phi, radius } = orbitOffset.current;
              destinationPos.current.x = destinationTarget.current.x + radius * Math.sin(phi) * Math.sin(theta);
              destinationPos.current.y = destinationTarget.current.y + radius * Math.cos(phi);
              destinationPos.current.z = destinationTarget.current.z + radius * Math.sin(phi) * Math.cos(theta);

              currentPos.current.copy(destinationPos.current);
            } else {
              orbitVelocity.current = { theta: 0, phi: 0 };
              // Smooth lerp to zoom destination when wheeling
              currentPos.current.lerp(destinationPos.current, 0.2);
            }
          }
        } else {
          // Smooth camera glide to section or camera preset
          const lerpFactor = Math.min(1.0, delta * 6.5);
          currentPos.current.lerp(destinationPos.current, lerpFactor);
          currentTarget.current.lerp(destinationTarget.current, lerpFactor);
        }

        camera.position.copy(currentPos.current);
        camera.lookAt(currentTarget.current);
      }

      // 9. Adaptive frame debouncing on lower-end devices
      const isCameraMoving =
        currentPos.current.distanceToSquared(destinationPos.current) > 0.0001 ||
        currentTarget.current.distanceToSquared(destinationTarget.current) > 0.0001 ||
        isDragging.current ||
        initialPinchDist.current !== null ||
        Math.abs(orbitVelocity.current.theta) > 0.00005 ||
        Math.abs(orbitVelocity.current.phi) > 0.00005;

      if (isLowEndDevice && !isCameraMoving) {
        // 30 FPS ceiling when idle on lower-end devices saves thermal throttling & battery
        if (timeMs - lastRenderTime < 32.5) {
          return;
        }
      }
      lastRenderTime = timeMs;

      // 10. On-demand shadow map update (bypasses full shadow map draw calls on static frames!)
      if (shadowFramesRemaining.current > 0) {
        renderer.shadowMap.needsUpdate = true;
        shadowFramesRemaining.current--;
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      resizeObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handlePointerDown);
        renderer.domElement.removeEventListener('click', handleClick);
        renderer.domElement.removeEventListener('wheel', handleWheel);
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      vehicleRef.current?.dispose?.();
      renderer.dispose();
    };
  }, []); // Run ONCE on mount: never tear down the WebGL scene on state changes!

  return (
    <div
      ref={containerRef}
      id="three-canvas-container"
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden touch-none"
    />
  );
};

export const ThreeCanvas = React.memo(ThreeCanvasComponent);
