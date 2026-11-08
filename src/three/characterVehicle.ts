import * as THREE from 'three';
import { createRealMadridCrestTexture, CREST_ASPECT } from './realMadridCrest';
import { Obstacle, circleVsObstacle } from './obstacles';
import { soundManager } from '../utils/soundManager';
import { TireTrackSystem } from './tireTracks';
import { TireSmokeSystem } from './tireSmoke';

export interface VehicleController {
  group: THREE.Group;
  tireTracksGroup: THREE.Group;
  tireSmokeGroup: THREE.Group;
  update: (
    delta: number,
    input: {
      forward: boolean;
      backward: boolean;
      left: boolean;
      right: boolean;
      drift: boolean;
      boost: boolean;
    }
  ) => {
    position: THREE.Vector3;
    rotation: number;
    speed: number;
    maxSpeed: number;
    isDrifting: boolean;
    isBoosting: boolean;
  };
  setDriving: (active: boolean) => void;
  isDriving: () => boolean;
  getTelemetry: () => {
    position: THREE.Vector3;
    rotation: number;
    speed: number;
  };
  resetPosition: () => void;
  triggerHorn: () => void;
  applyBoostImpulse: () => void;
  setObstacles: (obstacles: Obstacle[], wallRadius?: number) => void;
  applyImpact: (speedLoss: number) => void;
  applyJumpElevation: (elev: number) => void;
  triggerJump: (velocity: number) => void;
  dispose?: () => void;
}

export function createNovaAvatarVehicle(initialPos: THREE.Vector3 = new THREE.Vector3(0, 0.41, 6.2)): VehicleController {
  const rootGroup = new THREE.Group();
  rootGroup.position.copy(initialPos);
  rootGroup.rotation.y = Math.PI * 0.5; // Facing tangent along the racetrack counter-clockwise (East)

  let isDrivingMode = false;
  let currentSpeed = 0;
  let currentYaw = rootGroup.rotation.y;
  let currentSteer = 0;
  let isDrifting = false;
  let isBoosting = false;
  let wheelSpinAngle = 0;

  // Tire track system for procedural drift skid marks
  const tireTracks = new TireTrackSystem();
  // Tire smoke particle system for subtle drift puffs
  const tireSmoke = new TireSmokeSystem();

  // Track spawn position for resetting
  const spawnPos = initialPos.clone();
  const spawnYaw = rootGroup.rotation.y;

  // Vertical physics, suspension & jump stunt dynamics
  const GROUND_Y = initialPos.y; // 0.41m ground level
  let currentY = initialPos.y;
  let verticalVelocity = 0;
  let rampElev = 0;
  const GRAVITY = -18.0; // Snappy arcade gravity

  // -------------------------------------------------------------
  // 1. VEHICLE CHASSIS (Cyberpunk Electric Go-Kart / Drift Rover)
  // -------------------------------------------------------------
  const vehicleGroup = new THREE.Group();
  rootGroup.add(vehicleGroup);

  // Main Carbon-Fiber Frame
  const chassisGeo = new THREE.BoxGeometry(0.88, 0.16, 1.45);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Deep slate techwear
    metalness: 0.85,
    roughness: 0.25,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.16;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  vehicleGroup.add(chassis);

  // Aerodynamic Front Nosecone / Sloped Racing Fairing
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant electric cyan
    metalness: 0.75,
    roughness: 0.25,
  });

  // Sloped aerodynamic front cowl (angles smoothly down from cockpit to front wing)
  const noseCowlGeo = new THREE.BoxGeometry(0.66, 0.13, 0.46);
  const noseCowl = new THREE.Mesh(noseCowlGeo, noseMat);
  noseCowl.position.set(0, 0.18, 0.75);
  noseCowl.rotation.x = -0.18; // Smooth downward aerodynamic slope
  noseCowl.castShadow = true;
  vehicleGroup.add(noseCowl);

  // Center carbon aero spine / intake ridge
  const spineGeo = new THREE.BoxGeometry(0.18, 0.04, 0.42);
  const spine = new THREE.Mesh(spineGeo, chassisMat);
  spine.position.set(0, 0.23, 0.74);
  spine.rotation.x = -0.18;
  vehicleGroup.add(spine);

  // Racing number decal badge (#07) on nose spine
  const decalGeo = new THREE.BoxGeometry(0.10, 0.01, 0.09);
  const decalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.set(0, 0.255, 0.74);
  decal.rotation.x = -0.18;
  vehicleGroup.add(decal);

  // Wide Aerodynamic Front Splitter (Ground-Effect Racing Wing)
  const splitterGeo = new THREE.BoxGeometry(0.92, 0.035, 0.32);
  const splitter = new THREE.Mesh(splitterGeo, chassisMat);
  splitter.position.set(0, 0.075, 0.94);
  splitter.castShadow = true;
  vehicleGroup.add(splitter);

  // Splitter Side Winglets (Turned-up downforce plates)
  [-0.46, 0.46].forEach((xSide) => {
    const wingletGeo = new THREE.BoxGeometry(0.025, 0.08, 0.28);
    const winglet = new THREE.Mesh(wingletGeo, noseMat);
    winglet.position.set(xSide, 0.105, 0.94);
    vehicleGroup.add(winglet);
  });

  // Sturdy Tubular Front Bumper (Connected crash bar structure)
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
  const bumperGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.88, 12);
  bumperGeo.rotateZ(Math.PI / 2);
  const bumper = new THREE.Mesh(bumperGeo, bumperMat);
  bumper.position.set(0, 0.11, 1.05);
  vehicleGroup.add(bumper);

  // Connecting bumper struts back into chassis frame
  [-0.42, 0.42].forEach((xSide) => {
    const strutGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.32, 8);
    const strut = new THREE.Mesh(strutGeo, bumperMat);
    strut.position.set(xSide, 0.115, 0.91);
    strut.rotation.x = Math.PI / 2;
    vehicleGroup.add(strut);
  });

  // Recessed Cyber Projector Headlights (Embedded into angled front slope)
  const headlights: THREE.Mesh[] = [];
  [-0.22, 0.22].forEach((xSide) => {
    // Dark recessed housing
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.045, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
    );
    housing.position.set(xSide, 0.155, 0.92);
    housing.rotation.x = -0.18;
    vehicleGroup.add(housing);

    // Glowing forward-facing projector round lens
    const lensGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(xSide, 0.155, 0.95);
    vehicleGroup.add(lens);
    headlights.push(lens);

    // Sharp cyan LED eyebrow accent strip
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.01, 0.015),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    brow.position.set(xSide, 0.18, 0.935);
    brow.rotation.x = -0.18;
    vehicleGroup.add(brow);
  });

  // Side Pods (Left & Right Racing Aero Fairings with chamfered air intakes)
  [-0.45, 0.45].forEach((xSide) => {
    const podGeo = new THREE.BoxGeometry(0.14, 0.14, 0.78);
    const pod = new THREE.Mesh(podGeo, noseMat);
    pod.position.set(xSide, 0.18, 0.05);
    pod.castShadow = true;
    vehicleGroup.add(pod);

    // Pod front intake scoop (Dark radiator mesh)
    const intakeGeo = new THREE.BoxGeometry(0.12, 0.11, 0.03);
    const intake = new THREE.Mesh(intakeGeo, chassisMat);
    intake.position.set(xSide, 0.18, 0.445);
    vehicleGroup.add(intake);

    // Neon Accent Stripe on side pod
    const stripeGeo = new THREE.BoxGeometry(0.02, 0.03, 0.74);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(xSide > 0 ? xSide + 0.065 : xSide - 0.065, 0.18, 0.05);
    vehicleGroup.add(stripe);
  });

  // Racing Bucket Seat
  const seatBackGeo = new THREE.BoxGeometry(0.52, 0.58, 0.1);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const seatBack = new THREE.Mesh(seatBackGeo, seatMat);
  seatBack.position.set(0, 0.44, -0.32);
  seatBack.rotation.x = -0.15;
  vehicleGroup.add(seatBack);

  // Real Madrid crest decal on the back of the seat (faces the chase camera)
  const crestTexture = createRealMadridCrestTexture();
  const crestMat = new THREE.MeshStandardMaterial({
    map: crestTexture,
    transparent: true,
    roughness: 0.45,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveMap: crestTexture,
    emissiveIntensity: 0.25, // stays readable on the dark seat and at night
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.19 * CREST_ASPECT, 0.19), crestMat);
  // seatBack is 0.52 x 0.58 x 0.10; sized to the strip the chase camera sees between the spoiler and the rear body
  crest.position.set(0, -0.05, -0.0515);
  crest.rotation.y = Math.PI;
  seatBack.add(crest);

  const seatBaseGeo = new THREE.BoxGeometry(0.52, 0.08, 0.46);
  const seatBase = new THREE.Mesh(seatBaseGeo, seatMat);
  seatBase.position.set(0, 0.22, -0.12);
  vehicleGroup.add(seatBase);

  // Steering Column & Cyber Racing Wheel
  const steerColumnGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
  const steerColumnMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const steerColumn = new THREE.Mesh(steerColumnGeo, steerColumnMat);
  steerColumn.position.set(0, 0.38, 0.22);
  steerColumn.rotation.x = 0.45;
  vehicleGroup.add(steerColumn);

  const steerWheelGroup = new THREE.Group();
  steerWheelGroup.position.set(0, 0.52, 0.14);
  steerWheelGroup.rotation.x = 0.45;
  vehicleGroup.add(steerWheelGroup);

  const wheelRimGeo = new THREE.TorusGeometry(0.14, 0.022, 10, 20);
  const wheelRimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const steerWheelRim = new THREE.Mesh(wheelRimGeo, wheelRimMat);
  steerWheelGroup.add(steerWheelRim);

  const centerHubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
  centerHubGeo.rotateX(Math.PI / 2);
  const centerHubMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const centerHub = new THREE.Mesh(centerHubGeo, centerHubMat);
  steerWheelGroup.add(centerHub);

  // Rear Spoiler / Aerodynamic Wing
  const spoilerGeo = new THREE.BoxGeometry(0.82, 0.04, 0.18);
  const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
  const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoiler.position.set(0, 0.62, -0.66);
  vehicleGroup.add(spoiler);

  [-0.32, 0.32].forEach((xSide) => {
    const strutGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.position.set(xSide, 0.46, -0.64);
    vehicleGroup.add(strut);
  });

  // Cyber Exhaust Thrusters (Nitro Emitters)
  const thrusters: THREE.Mesh[] = [];
  [-0.18, 0.18].forEach((xSide) => {
    const pipeGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.16, 12);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(xSide, 0.22, -0.74);
    vehicleGroup.add(pipe);

    // Glowing flame cone
    const flameGeo = new THREE.ConeGeometry(0.045, 0.25, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(xSide, 0.22, -0.88);
    vehicleGroup.add(flame);
    thrusters.push(flame);
  });

  // Underglow Neon Tube (Illuminates floor beneath the kart, with depthWrite: false to prevent alpha clipping)
  const underglowGeo = new THREE.PlaneGeometry(0.68, 1.25);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: 0x00f5ff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.y = 0.025;
  vehicleGroup.add(underglow);

  // Rear Aerodynamic Diffuser Fins (Underbody air extraction)
  [-0.22, 0, 0.22].forEach((xSide) => {
    const finGeo = new THREE.BoxGeometry(0.02, 0.08, 0.24);
    const fin = new THREE.Mesh(finGeo, chassisMat);
    fin.position.set(xSide, 0.12, -0.66);
    vehicleGroup.add(fin);
  });

  // Spotlight casting bright road beam ahead of kart
  const headlightSpot = new THREE.SpotLight(0x38bdf8, 3.5, 12, Math.PI / 5, 0.35, 1.2);
  headlightSpot.position.set(0, 0.3, 0.85);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, 4.5);
  vehicleGroup.add(spotTarget);
  headlightSpot.target = spotTarget;
  vehicleGroup.add(headlightSpot);

  // Integrated Cyber LED Rear Taillight / Brake Light Bar
  const brakeLights: THREE.Mesh[] = [];
  const lightBarHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
  );
  lightBarHousing.position.set(0, 0.24, -0.73);
  vehicleGroup.add(lightBarHousing);

  [-0.24, 0, 0.24].forEach((xSide) => {
    const barSegmentGeo = new THREE.BoxGeometry(0.18, 0.025, 0.02);
    const barSegmentMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    const barSegment = new THREE.Mesh(barSegmentGeo, barSegmentMat);
    barSegment.position.set(xSide, 0.24, -0.745);
    vehicleGroup.add(barSegment);
    brakeLights.push(barSegment);
  });

  // -------------------------------------------------------------
  // 2. 4 HIGH-PERFORMANCE WHEELS (Front Steerable, All Spinning)
  // -------------------------------------------------------------
  const frontLeftWheelMount = new THREE.Group();
  const frontRightWheelMount = new THREE.Group();
  frontLeftWheelMount.position.set(-0.48, 0.16, 0.58);
  frontRightWheelMount.position.set(0.48, 0.16, 0.58);
  vehicleGroup.add(frontLeftWheelMount);
  vehicleGroup.add(frontRightWheelMount);

  const rearLeftWheelMount = new THREE.Group();
  const rearRightWheelMount = new THREE.Group();
  rearLeftWheelMount.position.set(-0.48, 0.18, -0.48);
  rearRightWheelMount.position.set(0.48, 0.18, -0.48);
  vehicleGroup.add(rearLeftWheelMount);
  vehicleGroup.add(rearRightWheelMount);

  function createWheelMesh(radius: number = 0.16, width: number = 0.12): THREE.Group {
    const wGroup = new THREE.Group();
    // Rubber Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wGroup.add(tire);

    // Glowing Cyan Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.005, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.95,
      roughness: 0.15,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wGroup.add(rim);

    // Center glowing cyber hub
    const hubGeo = new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.015, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    wGroup.add(hub);

    return wGroup;
  }

  const flWheel = createWheelMesh(0.15, 0.11);
  const frWheel = createWheelMesh(0.15, 0.11);
  const rlWheel = createWheelMesh(0.17, 0.14); // Wider rear tires for grip
  const rrWheel = createWheelMesh(0.17, 0.14);

  frontLeftWheelMount.add(flWheel);
  frontRightWheelMount.add(frWheel);
  rearLeftWheelMount.add(rlWheel);
  rearRightWheelMount.add(rrWheel);

  // -------------------------------------------------------------
  // 3. STYLIZED 3D AVATAR OF "HOÀNG VĂN HÒA (NOVA HOANG)"
  // -------------------------------------------------------------
  const avatarGroup = new THREE.Group();
  avatarGroup.position.set(0, 0.22, -0.15); // Seated naturally in kart
  vehicleGroup.add(avatarGroup);

  // Pants / Lower Body
  const pelvisGeo = new THREE.BoxGeometry(0.36, 0.16, 0.3);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvis.position.set(0, 0.1, 0.05);
  avatarGroup.add(pelvis);

  // Upper Legs (Bent into sitting posture)
  [-0.12, 0.12].forEach((xSide) => {
    const legGeo = new THREE.BoxGeometry(0.12, 0.12, 0.35);
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.set(xSide, 0.1, 0.26);
    leg.rotation.x = 0.2;
    avatarGroup.add(leg);

    // Calves / Lower Legs down to pedals
    const calfGeo = new THREE.BoxGeometry(0.1, 0.26, 0.1);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.set(xSide, 0.03, 0.46);
    calf.rotation.x = -0.65;
    avatarGroup.add(calf);

    // Stylish High-Top Sneakers (Cyan & Orange Sneaker Collector Edition)
    const shoeGeo = new THREE.BoxGeometry(0.11, 0.09, 0.22);
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Vibrant sneakerhead orange
      roughness: 0.4,
    });
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(xSide, -0.06, 0.58);
    avatarGroup.add(shoe);

    const shoeSoleGeo = new THREE.BoxGeometry(0.12, 0.03, 0.23);
    const shoeSoleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const shoeSole = new THREE.Mesh(shoeSoleGeo, shoeSoleMat);
    shoeSole.position.set(xSide, -0.09, 0.58);
    avatarGroup.add(shoeSole);
  });

  // Torso / Developer Hoodie
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.42, 0.26);
  const hoodieMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Obsidian dark developer hoodie
    roughness: 0.6,
  });
  const torso = new THREE.Mesh(torsoGeo, hoodieMat);
  torso.position.set(0, 0.34, 0.04);
  torso.rotation.x = 0.12; // Slight forward racing lean
  torso.castShadow = true;
  avatarGroup.add(torso);

  // Hoodie Zipper / Cyber Accent Stripe
  const zipGeo = new THREE.BoxGeometry(0.02, 0.38, 0.02);
  const zipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const zip = new THREE.Mesh(zipGeo, zipMat);
  zip.position.set(0, 0.34, 0.18);
  zip.rotation.x = 0.12;
  avatarGroup.add(zip);

  // Nova Hoang SWE Developer Chest Badge
  const badgeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.01);
  const badgeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(-0.11, 0.42, 0.19);
  badge.rotation.x = 0.12;
  avatarGroup.add(badge);

  // Arms Holding Steering Wheel (Grip the wheel rim firmly on both sides)
  [-0.22, 0.22].forEach((xSide) => {
    // Upper arm
    const upperArmGeo = new THREE.BoxGeometry(0.09, 0.20, 0.09);
    const upperArm = new THREE.Mesh(upperArmGeo, hoodieMat);
    upperArm.position.set(xSide, 0.41, 0.10);
    upperArm.rotation.x = 0.65;
    upperArm.rotation.z = xSide > 0 ? -0.20 : 0.20;
    avatarGroup.add(upperArm);

    // Forearm reaching directly to steering wheel
    const foreArmGeo = new THREE.BoxGeometry(0.08, 0.19, 0.08);
    const foreArm = new THREE.Mesh(foreArmGeo, hoodieMat);
    foreArm.position.set(xSide > 0 ? 0.16 : -0.16, 0.34, 0.21);
    foreArm.rotation.x = 1.05;
    foreArm.rotation.y = xSide > 0 ? -0.18 : 0.18;
    avatarGroup.add(foreArm);

    // Hand wrapping firmly around steering wheel rim at (±0.135, 0.30, 0.29)
    const handGeo = new THREE.BoxGeometry(0.065, 0.065, 0.075);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.65 });
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(xSide > 0 ? 0.135 : -0.135, 0.30, 0.285);
    hand.rotation.x = 0.45; // Match steering wheel 45-deg incline
    hand.rotation.z = xSide > 0 ? -0.15 : 0.15;
    avatarGroup.add(hand);
  });

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.65 });
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, 0.56, 0.07);
  avatarGroup.add(neck);

  // Soft dark hoodie collar (Creates smooth anatomical transition below chin)
  const collarGeo = new THREE.CylinderGeometry(0.085, 0.11, 0.06, 16);
  const collar = new THREE.Mesh(collarGeo, hoodieMat);
  collar.position.set(0, 0.52, 0.07);
  avatarGroup.add(collar);

  // Developer Havit H630BT Cream Wireless Headphones resting naturally around hoodie collar (Enlarged, plush & prominent)
  const hpBandGeo = new THREE.TorusGeometry(0.132, 0.022, 10, 24, Math.PI);
  hpBandGeo.rotateX(Math.PI / 2);
  const hpMat = new THREE.MeshStandardMaterial({ color: 0xf6efe5, roughness: 0.38 });
  const hpBand = new THREE.Mesh(hpBandGeo, hpMat);
  hpBand.position.set(0, 0.465, 0.08);
  hpBand.rotation.x = 0.22; // Tilts forward with chest
  avatarGroup.add(hpBand);

  // Large Oval Cream earcups with champagne bronze accent rings resting comfortably against upper chest
  const bronzeAccentMat = new THREE.MeshStandardMaterial({ color: 0xbda078, metalness: 0.85, roughness: 0.25 });
  [-0.142, 0.142].forEach((ex) => {
    const collarCupGroup = new THREE.Group();
    collarCupGroup.position.set(ex, 0.455, 0.115);
    collarCupGroup.rotation.x = 0.32; // Rests flat against chest
    collarCupGroup.rotation.z = ex > 0 ? -0.22 : 0.22;

    // Oval outer shell (larger, stylish over-ear dimensions)
    const collarCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.046, 0.024, 18),
      new THREE.MeshStandardMaterial({ color: 0xf6efe5, roughness: 0.38 })
    );
    collarCup.scale.set(1.0, 1.0, 1.30);
    collarCupGroup.add(collarCup);

    // Signature Champagne Bronze Accent Ring
    const bronzeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.003, 8, 18),
      bronzeAccentMat
    );
    bronzeRing.rotation.y = Math.PI / 2;
    bronzeRing.scale.set(1.0, 1.30, 1.0);
    bronzeRing.position.set(ex > 0 ? -0.006 : 0.006, 0, 0);
    collarCupGroup.add(bronzeRing);

    // Soft memory foam protein cushion
    const collarCushion = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.009, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xeee4d5, roughness: 0.85 })
    );
    collarCushion.rotation.y = Math.PI / 2;
    collarCushion.scale.set(1.0, 1.30, 1.0);
    collarCushion.position.set(ex > 0 ? -0.012 : 0.012, 0, 0);
    collarCupGroup.add(collarCushion);

    avatarGroup.add(collarCupGroup);
  });

  // Stylized Face / Head
  const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.25);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0.70, 0.09);
  head.castShadow = true;
  avatarGroup.add(head);

  // Modern Developer Textured Hair (Dark Slate Cut)
  const hairGeo = new THREE.BoxGeometry(0.26, 0.13, 0.27);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 0.81, 0.09);
  avatarGroup.add(hair);

  // Front Hair Fringe/Tuft
  const fringeGeo = new THREE.BoxGeometry(0.24, 0.07, 0.08);
  const fringe = new THREE.Mesh(fringeGeo, hairMat);
  fringe.position.set(0, 0.80, 0.22);
  avatarGroup.add(fringe);

  // Tech Glasses / Cyan AR Spectacles
  const glassesGeo = new THREE.BoxGeometry(0.23, 0.05, 0.03);
  const glassesMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const glasses = new THREE.Mesh(glassesGeo, glassesMat);
  glasses.position.set(0, 0.72, 0.22);
  avatarGroup.add(glasses);

  // Friendly Smile Accent
  const smileGeo = new THREE.BoxGeometry(0.09, 0.015, 0.01);
  const smileMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  const smile = new THREE.Mesh(smileGeo, smileMat);
  smile.position.set(0, 0.63, 0.22);
  avatarGroup.add(smile);

  // -------------------------------------------------------------
  // 4. INTERACTIVE CLICK HITBOX & USERDATA
  // -------------------------------------------------------------
  // Raycastable enlarged hitbox ensuring easy clicking on mobile and desktop
  const hitBoxGeo = new THREE.BoxGeometry(2.0, 1.9, 2.6);
  const hitBoxMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBox.position.set(0, 0.7, 0.1);
  hitBox.userData = {
    isClickable: true,
    isCharacterVehicle: true,
    label: 'Nova Hoang Cyber Kart (Click to Focus & Drive!)',
  };
  rootGroup.add(hitBox);

  // Set userData on rootGroup as well
  rootGroup.userData = {
    isClickable: true,
    isCharacterVehicle: true,
    label: 'Nova Hoang Cyber Kart (Click to Focus & Drive!)',
  };

  // Tag every descendant child so any raycast hit on chassis/wheels/avatar registers immediately
  rootGroup.traverse((child) => {
    child.userData = {
      ...child.userData,
      isClickable: true,
      isCharacterVehicle: true,
      label: 'Nova Hoang Cyber Kart (Click to Focus & Drive!)',
    };
  });

  // -------------------------------------------------------------
  // 5. FLOATING HOLOGRAM CALLOUT & GROUND ROTATING RING
  // -------------------------------------------------------------
  const idleCalloutGroup = new THREE.Group();
  rootGroup.add(idleCalloutGroup);

  // Ground Rotating Holographic Cyber Selection Ring
  // Leveled at y = 0.015 (world Y = 0.425) so it floats cleanly above dark asphalt (0.408)
  // Radius: 0.94m to 1.04m, tightly framing the 0.96m x 1.45m kart without crossing any kerbs or road edges
  const ringGroup = new THREE.Group();
  ringGroup.position.y = 0.015;
  idleCalloutGroup.add(ringGroup);

  // Outer primary accent ring (Novahoangdev Teal #78bbb5)
  const ringGeo = new THREE.RingGeometry(0.94, 1.04, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x78bbb5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    depthTest: true,
  });
  const groundRing = new THREE.Mesh(ringGeo, ringMat);
  groundRing.renderOrder = 30;
  ringGroup.add(groundRing);

  // Inner subtle secondary radar pulse ring (Novahoangdev Accent #2f7e7c)
  const innerRingGeo = new THREE.RingGeometry(0.78, 0.82, 64);
  innerRingGeo.rotateX(-Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x2f7e7c,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    depthTest: true,
  });
  const innerGroundRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerGroundRing.renderOrder = 29;
  ringGroup.add(innerGroundRing);

  // 4 Cardinal Tech Dash Accents [  ] framing the perimeter
  for (let a = 0; a < 4; a++) {
    const tickAng = (a * Math.PI) / 2;
    const tickGeo = new THREE.RingGeometry(1.10, 1.16, 16, 1, tickAng - 0.16, 0.32);
    tickGeo.rotateX(-Math.PI / 2);
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x8accc6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: true,
    });
    const tickMesh = new THREE.Mesh(tickGeo, tickMat);
    tickMesh.renderOrder = 30;
    ringGroup.add(tickMesh);
  }

  // Floating overhead "Drive the kart" callout.
  // Drawn at high resolution in the portfolio palette (navy + teal, Manrope),
  // and redrawn once web fonts are ready so the canvas never keeps a fallback font.
  const CALLOUT_W = 1024;
  const CALLOUT_H = 288;
  const canvas = document.createElement('canvas');
  canvas.width = CALLOUT_W;
  canvas.height = CALLOUT_H;
  const ctx = canvas.getContext('2d');

  const roundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    if (typeof c.roundRect === 'function') {
      c.roundRect(x, y, w, h, r);
    } else {
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
  };

  const drawCallout = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, CALLOUT_W, CALLOUT_H);

    const title = 'Drive the kart';
    const subtitle = 'Click to drive · WASD to steer';
    const titleFont = '700 60px "Manrope", system-ui, sans-serif';
    const subtitleFont = '600 40px "Manrope", system-ui, sans-serif';

    ctx.font = titleFont;
    const titleW = ctx.measureText(title).width;
    ctx.font = subtitleFont;
    const subtitleW = ctx.measureText(subtitle).width;

    const pillH = 176;
    const pad = 22; // inner padding around the icon
    const iconR = (pillH - pad * 2) / 2;
    const gap = 30;
    const padRight = 56;
    const pillW = Math.min(CALLOUT_W - 40, pad + iconR * 2 + gap + Math.max(titleW, subtitleW) + padRight);
    const pillX = (CALLOUT_W - pillW) / 2;
    const pillY = 32;
    const cy = pillY + pillH / 2;

    // Pill + caret as one shape so the shadow and border stay continuous
    ctx.save();
    ctx.shadowColor = 'rgba(8, 18, 24, 0.45)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    roundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(23, 43, 54, 0.94)'; // --navy #172b36
    ctx.fill();
    ctx.beginPath();
    const caretCx = CALLOUT_W / 2;
    ctx.moveTo(caretCx - 22, pillY + pillH - 1);
    ctx.lineTo(caretCx + 22, pillY + pillH - 1);
    ctx.lineTo(caretCx, pillY + pillH + 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Hairline border (--accent-bright #78bbb5, softened)
    roundedRect(ctx, pillX + 1, pillY + 1, pillW - 2, pillH - 2, pillH / 2 - 1);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(120, 187, 181, 0.45)';
    ctx.stroke();

    // Icon disc (--accent #2f7e7c) with a white steering wheel
    const iconCx = pillX + pad + iconR;
    ctx.beginPath();
    ctx.arc(iconCx, cy, iconR, 0, Math.PI * 2);
    ctx.fillStyle = '#2f7e7c';
    ctx.fill();

    const wheelR = iconR * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(iconCx, cy, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(iconCx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(iconCx - wheelR, cy);
    ctx.lineTo(iconCx + wheelR, cy);
    ctx.moveTo(iconCx, cy);
    ctx.lineTo(iconCx, cy + wheelR);
    ctx.stroke();

    // Text block
    const textX = iconCx + iconR + gap;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = titleFont;
    ctx.fillStyle = '#edf2ef'; // --ink (dark theme)
    ctx.fillText(title, textX, cy - 4);
    ctx.font = subtitleFont;
    ctx.fillStyle = '#8accc6'; // --accent-bright (dark theme)
    ctx.fillText(subtitle, textX, cy + 50);
  };

  drawCallout();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;

  if (typeof document !== 'undefined' && document.fonts?.load) {
    Promise.all([
      document.fonts.load('700 60px "Manrope"'),
      document.fonts.load('600 40px "Manrope"'),
    ])
      .then(() => {
        drawCallout();
        texture.needsUpdate = true;
      })
      .catch(() => {
        /* keep the fallback-font rendering */
      });
  }

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false, // keep the UI colors exact under ACES tone mapping
  });
  const nametagSprite = new THREE.Sprite(spriteMat);
  nametagSprite.renderOrder = 35;
  // Centred over the driver's head (avatar z -0.15 + head z 0.09), with clear air above the hair (top ~1.10)
  const CALLOUT_Y = 1.34;
  const CALLOUT_Z = -0.06;
  nametagSprite.position.set(0, CALLOUT_Y, CALLOUT_Z);
  nametagSprite.scale.set(0.68, 0.68 * (CALLOUT_H / CALLOUT_W), 1);
  idleCalloutGroup.add(nametagSprite);

  // -------------------------------------------------------------
  // 6. CONTROLLER UPDATE & ARCADE VEHICLE DYNAMICS
  // -------------------------------------------------------------
  const MAX_SPEED = 8.5; // m/s forward
  const MAX_REVERSE = -3.8; // m/s backward
  const ACCELERATION = 14.0;
  const BRAKE_DECEL = 18.0;
  const NATURAL_DRAG = 0.94;
  const STEER_MAX = 0.58; // radians max wheel turn (~33 deg)
  const STEER_RETURN = 0.85;

  let idlePulseTime = 0;
  let staticObstacles: Obstacle[] = [];
  let wallRadius = 26.6; // centre of the kart may not pass this (tyre wall)
  // Kart footprint as two circles along the heading (front overhang is longer than the rear)
  const KART_COLLIDERS = [
    { offset: 0.55, r: 0.46 },
    { offset: -0.3, r: 0.5 },
  ];
  let lastBumperHitTime = 0;
  const triggerBumperSound = () => {
    const now = performance.now();
    if (Math.abs(currentSpeed) > 0.8 && now - lastBumperHitTime > 350) {
      lastBumperHitTime = now;
      soundManager.playBumperHit();
    }
  };

  return {
    group: rootGroup,

    isDriving: () => isDrivingMode,

    getTelemetry: () => ({
      position: rootGroup.position.clone(),
      rotation: currentYaw,
      speed: currentSpeed,
    }),

    setDriving: (active: boolean) => {
      isDrivingMode = active;
      idleCalloutGroup.visible = !active;
      headlightSpot.intensity = active ? 4.5 : 1.5;
      underglow.material.opacity = active ? 0.75 : 0.4;
      if (active) {
        soundManager.playVehicleStart();
        soundManager.startEngine();
      } else {
        soundManager.stopEngineSound();
        currentSpeed = 0;
      }
    },

    resetPosition: () => {
      rootGroup.position.copy(spawnPos);
      currentYaw = spawnYaw;
      rootGroup.rotation.y = currentYaw;
      currentSpeed = 0;
      currentSteer = 0;
      currentY = GROUND_Y;
      verticalVelocity = 0;
      rampElev = 0;
      vehicleGroup.rotation.x = 0;
      steerWheelGroup.rotation.z = 0;
      frontLeftWheelMount.rotation.y = 0;
      frontRightWheelMount.rotation.y = 0;
      tireTracks.clear();
      tireSmoke.clear();
      soundManager.playClick(true);
    },

    triggerHorn: () => {
      soundManager.playHorn();
    },

    // Momentum lost to a prop we just hit (heavier props cost more speed)
    applyImpact: (speedLoss: number) => {
      if (speedLoss <= 0 || Math.abs(currentSpeed) < 0.01) return;
      const sign = Math.sign(currentSpeed);
      currentSpeed = sign * Math.max(0, Math.abs(currentSpeed) - speedLoss);
    },

    setObstacles: (obstacles: Obstacle[], wall?: number) => {
      staticObstacles = obstacles;
      if (wall !== undefined) wallRadius = wall - 0.55;
    },

    applyBoostImpulse: () => {
      currentSpeed = Math.min(MAX_SPEED * 1.45, Math.max(currentSpeed, 4.0) + 4.5);
      soundManager.playNitro();
    },

    applyJumpElevation: (elev: number) => {
      rampElev = Math.max(rampElev, elev);
    },

    triggerJump: (velocity: number) => {
      // Launch into airborne stunt
      verticalVelocity = Math.max(verticalVelocity, velocity);
    },

    update: (delta: number, input) => {
      idlePulseTime += delta;

      // Animate ground ring group when idle
      if (!isDrivingMode) {
        ringGroup.rotation.y += delta * 0.5;
        ringGroup.scale.setScalar(1.0 + Math.sin(idlePulseTime * 2.0) * 0.025);
        nametagSprite.position.y = CALLOUT_Y + Math.sin(idlePulseTime * 2.0) * 0.02;
        tireTracks.endDrift();
        tireTracks.update(delta);
        tireSmoke.update(delta);
        return {
          position: rootGroup.position,
          rotation: currentYaw,
          speed: 0,
          maxSpeed: MAX_SPEED,
          isDrifting: false,
          isBoosting: false,
        };
      }

      // Driving input handling
      isBoosting = input.boost;
      isDrifting = input.drift;
      const topSpeed = isBoosting ? MAX_SPEED * 1.5 : MAX_SPEED;

      // Acceleration / Braking
      if (input.forward) {
        currentSpeed = Math.min(topSpeed, currentSpeed + ACCELERATION * (isBoosting ? 1.4 : 1.0) * delta);
      } else if (input.backward) {
        if (currentSpeed > 0.3) {
          // Braking
          currentSpeed = Math.max(0, currentSpeed - BRAKE_DECEL * delta);
        } else {
          // Reversing
          currentSpeed = Math.max(MAX_REVERSE, currentSpeed - ACCELERATION * 0.65 * delta);
        }
      } else {
        // Rolling resistance / coast down
        currentSpeed *= Math.pow(NATURAL_DRAG, delta * 60);
        if (Math.abs(currentSpeed) < 0.05) currentSpeed = 0;
      }

      // Steering
      const steerTarget = (input.left ? STEER_MAX : 0) + (input.right ? -STEER_MAX : 0);
      if (steerTarget !== 0) {
        currentSteer = THREE.MathUtils.lerp(currentSteer, steerTarget, delta * 12);
      } else {
        currentSteer = THREE.MathUtils.lerp(currentSteer, 0, delta * 10);
      }

      // Apply steering to vehicle yaw (only turns when moving)
      if (Math.abs(currentSpeed) > 0.08) {
        const speedFactor = Math.min(1.0, Math.abs(currentSpeed) / 3.0);
        const driftMultiplier = isDrifting ? 1.6 : 1.0;
        const directionSign = currentSpeed >= 0 ? 1 : -1;
        currentYaw += currentSteer * speedFactor * driftMultiplier * directionSign * delta * 2.8;
      }

      // Visual front wheel steering & steering wheel turn
      frontLeftWheelMount.rotation.y = currentSteer;
      frontRightWheelMount.rotation.y = currentSteer;
      steerWheelGroup.rotation.z = -currentSteer * 1.8;

      // Wheel spinning rotation
      const spinSpeed = (currentSpeed / 0.16) * delta;
      wheelSpinAngle += spinSpeed;
      flWheel.rotation.x = wheelSpinAngle;
      frWheel.rotation.x = wheelSpinAngle;
      rlWheel.rotation.x = wheelSpinAngle;
      rrWheel.rotation.x = wheelSpinAngle;

      // Brake light brightness feedback
      const isBraking = input.backward || input.drift;
      brakeLights.forEach((bl) => {
        (bl.material as THREE.MeshBasicMaterial).color.setHex(isBraking ? 0xff2222 : 0x7f1d1d);
      });

      // Nitro exhaust flames
      thrusters.forEach((flame) => {
        (flame.material as THREE.MeshBasicMaterial).opacity = isBoosting ? 0.9 : 0;
        flame.scale.set(1, 1, isBoosting ? 1.0 + Math.random() * 0.5 : 0.01);
      });

      // Move vehicle along forward heading vector
      const heading = new THREE.Vector3(Math.sin(currentYaw), 0, Math.cos(currentYaw));
      const moveStep = heading.clone().multiplyScalar(currentSpeed * delta);
      const nextPos = rootGroup.position.clone().add(moveStep);

      // --- Island Boundaries & Obstacle Collisions ---
      // 1. Island perimeter circular boundary (radius ~28.0m from center on expanded island)
      const distFromCenter = Math.hypot(nextPos.x, nextPos.z);
      if (distFromCenter > wallRadius) {
        // Bumper rebound off island edge
        const normal = new THREE.Vector3(-nextPos.x, 0, -nextPos.z).normalize();
        nextPos.add(normal.multiplyScalar(0.18));
        currentSpeed = -currentSpeed * 0.4;
        triggerBumperSound();
      }

      // 2. Furniture & studio columns (footprints measured from the actual scene objects).
      // Push the kart out, keep the part of the motion that slides along the surface,
      // and only bounce back on a hard, near head-on hit.
      let hitNx = 0;
      let hitNz = 0;
      let hitDepth = 0;
      for (let pass = 0; pass < 2; pass++) {
        for (const collider of KART_COLLIDERS) {
          const cx = nextPos.x + heading.x * collider.offset;
          const cz = nextPos.z + heading.z * collider.offset;
          for (const obstacle of staticObstacles) {
            if (obstacle.top !== undefined && currentY > obstacle.top - 0.06) continue; // passing over it
            const hit = circleVsObstacle(cx, cz, collider.r, obstacle);
            if (!hit) continue;
            nextPos.x += hit.nx * hit.depth;
            nextPos.z += hit.nz * hit.depth;
            if (hit.depth > hitDepth) {
              hitDepth = hit.depth;
              hitNx = hit.nx;
              hitNz = hit.nz;
            }
          }
        }
      }
      if (hitDepth > 0) {
        const into = (heading.x * hitNx + heading.z * hitNz) * Math.sign(currentSpeed); // < 0 when driving into it
        if (into < 0) {
          const impact = Math.abs(currentSpeed) * -into;
          if (impact > 3.0 && -into > 0.75) {
            currentSpeed = -currentSpeed * 0.3; // hard frontal hit: small rebound
          } else {
            currentSpeed *= 1 - 0.85 * -into; // glancing hit: scrub speed and slide along
          }
          if (impact > 0.6) triggerBumperSound();
        }
      }

      // 5. Vertical Dynamics (Gravity, Stunt Jumps & Ramp Elevation)
      const targetFloor = GROUND_Y + rampElev;
      if (currentY > targetFloor || verticalVelocity > 0) {
        verticalVelocity += GRAVITY * delta;
        currentY += verticalVelocity * delta;

        // Airborne pitch tilt for visual stunt response
        const pitchTarget = THREE.MathUtils.clamp(-verticalVelocity * 0.035, -0.25, 0.25);
        vehicleGroup.rotation.x = THREE.MathUtils.lerp(vehicleGroup.rotation.x, pitchTarget, delta * 12);

        if (currentY <= targetFloor) {
          const wasSignificantFall = verticalVelocity < -1.8;
          currentY = targetFloor;
          verticalVelocity = 0;
          vehicleGroup.rotation.x = 0;
          if (wasSignificantFall) {
            soundManager.playClick(false);
          }
        }
      } else {
        // Firmly track ground level or smoothly ascend ramp incline
        currentY = THREE.MathUtils.lerp(currentY, targetFloor, delta * 20);
        verticalVelocity = 0;
        vehicleGroup.rotation.x = 0;
      }
      nextPos.y = currentY;

      // Consume ramp elevation for this frame
      rampElev = 0;

      rootGroup.position.copy(nextPos);
      rootGroup.rotation.y = currentYaw;

      // Tire Track System: emit skid marks behind rear wheels when in drifting state
      const isGrounded = Math.abs(currentY - targetFloor) < 0.10 && verticalVelocity === 0;
      const isActivelyDrifting = isDrifting && Math.abs(currentSpeed) > 0.8 && isGrounded;

      if (isActivelyDrifting) {
        rootGroup.updateMatrixWorld(true);

        // Rear left & right wheel bottom contact patches in local vehicle coordinates
        const leftContact = new THREE.Vector3(-0.48, 0.015, -0.48);
        const rightContact = new THREE.Vector3(0.48, 0.015, -0.48);

        leftContact.applyMatrix4(vehicleGroup.matrixWorld);
        rightContact.applyMatrix4(vehicleGroup.matrixWorld);

        // Keep slightly above ground plane to prevent Z-fighting with road stripes
        leftContact.y = Math.max(0.415, currentY + 0.005);
        rightContact.y = Math.max(0.415, currentY + 0.005);

        tireTracks.addPoints(leftContact, rightContact);

        // Vehicle forward heading for smoke puff dynamics
        const forwardHeading = new THREE.Vector3(Math.sin(currentYaw), 0, Math.cos(currentYaw));
        tireSmoke.emit(leftContact, rightContact, forwardHeading, delta);
      } else {
        tireTracks.endDrift();
      }

      tireTracks.update(delta);
      tireSmoke.update(delta);

      // Update engine sound pitch & volume in real time
      const speedRatio = Math.abs(currentSpeed) / MAX_SPEED;
      soundManager.updateEngineSound(speedRatio, isBoosting);

      if (isDrifting && Math.abs(currentSpeed) > 2.0) {
        soundManager.playDrift();
      }
      if (isBoosting) {
        soundManager.playNitro();
      }

      return {
        position: rootGroup.position,
        rotation: currentYaw,
        speed: currentSpeed,
        maxSpeed: topSpeed,
        isDrifting,
        isBoosting,
      };
    },
    tireTracksGroup: tireTracks.group,
    tireSmokeGroup: tireSmoke.group,
    dispose: () => {
      tireTracks.dispose();
      tireSmoke.dispose();
    },
  };
}
