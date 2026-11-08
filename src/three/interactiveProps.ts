import * as THREE from 'three';
import { soundManager } from '../utils/soundManager';
import { Obstacle, circleVsObstacle } from './obstacles';

export interface InteractivePropsManager {
  group: THREE.Group;
  update: (
    delta: number,
    carPos: THREE.Vector3,
    carSpeed: number,
    carYaw: number
  ) => {
    boostImpulse: boolean;
    jumpElev: number;
    jumpVelocity: number;
    newlyCollectedGem: boolean;
    collectedCount: number;
    totalGems: number;
    kartSpeedLoss: number; // momentum the kart lost to props this frame
  };
  resetAll: () => void;
  setObstacles: (obstacles: Obstacle[], wallRadius?: number) => void;
  /** Ramp back wall and upper side walls, so the kart can only drive up from the low end. */
  rampObstacles: Obstacle[];
  getGemCount: () => { collected: number; total: number };
}

// Small rigid body used for cones and crates: gravity, point contacts with the
// ground (restitution + Coulomb friction), impulses applied at real contact points,
// and sleeping once settled so resting props never jitter.
interface RigidProp {
  kind: 'cone' | 'crate';
  mesh: THREE.Object3D;
  pos: THREE.Vector3; // centre of mass, island-local
  quat: THREE.Quaternion;
  vel: THREE.Vector3;
  angVel: THREE.Vector3; // world space, rad/s
  invMass: number;
  invInertia: THREE.Vector3; // body-space diagonal
  points: THREE.Vector3[]; // contact hull, body space (relative to centre of mass)
  radius: number; // horizontal collision radius
  halfHeight: number; // for stacking support
  restitution: number;
  kartRestitution: number; // how lively it is when the kart hits it
  friction: number;
  initialPos: THREE.Vector3;
  initialQuat: THREE.Quaternion;
  asleep: boolean;
  sleepTimer: number;
  hitCooldown: number;
  landCooldown: number;
}

interface OrbItem {
  mesh: THREE.Mesh;
  initialPos: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  color: number;
  mass: number;
  hitCooldown: number;
}

interface BoostPadItem {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  cooldown: number;
}

interface GemItem {
  mesh: THREE.Group;
  initialPos: THREE.Vector3;
  collected: boolean;
  pulseTime: number;
  popTime: number; // collect animation progress (s), -1 when idle
  materials: THREE.Material[];
}


export function createInteractiveProps(islandRadius: number = 28.0): InteractivePropsManager {
  const propsGroup = new THREE.Group();
  propsGroup.name = 'interactive-props-group';

  // -------------------------------------------------------------
  // 1. NEON CYBER TRAFFIC CONES (8 Cones along chicanes)
  // -------------------------------------------------------------
  const bodies: RigidProp[] = [];
  const GROUND_Y = 0.4;
  const CONE_COM_Y = 0.12; // weighted base: centre of mass sits low
  // Hollow cone body that starts on top of the base plate: no faces coincide with the plate,
  // so a knocked-over cone shows a clean dark underside instead of z-fighting
  const coneGeo = new THREE.ConeGeometry(0.24, 0.6, 8, 1, true);
  coneGeo.translate(0, 0.05 + 0.3, 0);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0xff6b00,
    roughness: 0.5,
    metalness: 0.1,
    flatShading: true,
  });
  const coneStripeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.2,
  });
  const coneBaseGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
  const coneBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });

  const conePositions = [
    new THREE.Vector3(-9.5, 0.4, 9.0),
    new THREE.Vector3(-11.5, 0.4, 12.2),
    new THREE.Vector3(-13.2, 0.4, 15.5),
    new THREE.Vector3(11.5, 0.4, -9.5),
    new THREE.Vector3(14.2, 0.4, -12.0),
    new THREE.Vector3(15.8, 0.4, -13.6), // kept inside the outer kerb
    new THREE.Vector3(-18.5, 0.4, -6.5),
    new THREE.Vector3(-21.0, 0.4, -3.5),
  ];

  conePositions.forEach((pos) => {
    // Outer group = centre of mass; the visible parts are offset inside it
    const cGroup = new THREE.Group();
    const shape = new THREE.Group();
    shape.position.y = -CONE_COM_Y;
    cGroup.add(shape);

    const base = new THREE.Mesh(coneBaseGeo, coneBaseMat);
    base.position.y = 0.025;
    base.castShadow = true;
    shape.add(base);

    const body = new THREE.Mesh(coneGeo, coneMat);
    body.castShadow = true;
    shape.add(body);

    // hugs the cone's taper (radius = 0.24 * (1 - (y - 0.05) / 0.6)) so it never pokes out
    const stripeGeo = new THREE.CylinderGeometry(0.093, 0.153, 0.15, 8, 1, true);
    stripeGeo.translate(0, 0.35, 0);
    const stripe = new THREE.Mesh(stripeGeo, coneStripeMat);
    shape.add(stripe);

    const com = new THREE.Vector3(pos.x, GROUND_Y + CONE_COM_Y, pos.z);
    cGroup.position.copy(com);
    propsGroup.add(cGroup);

    // Contact hull: square base corners, the cone's base rim and its tip
    const points: THREE.Vector3[] = [];
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
      points.push(new THREE.Vector3(sx * 0.25, -CONE_COM_Y, sz * 0.25));
      points.push(new THREE.Vector3(sx * 0.25, 0.05 - CONE_COM_Y, sz * 0.25));
    }));
    points.push(new THREE.Vector3(0, 0.65 - CONE_COM_Y, 0));

    bodies.push({
      kind: 'cone',
      mesh: cGroup,
      pos: com.clone(),
      quat: new THREE.Quaternion(),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      invMass: 1 / 1.0,
      invInertia: new THREE.Vector3(1 / 0.032, 1 / 0.02, 1 / 0.032),
      points,
      radius: 0.28,
      halfHeight: CONE_COM_Y,
      restitution: 0.3,
      kartRestitution: 0.55, // light plastic: gets punted away instead of being bulldozed
      friction: 0.55,
      initialPos: com.clone(),
      initialQuat: new THREE.Quaternion(),
      asleep: true,
      sleepTimer: 0,
      hitCooldown: 0,
      landCooldown: 0,
    });
  });

  // -------------------------------------------------------------
  // 2. LARGE BOUNCING CYBER ORBS (3 Glowing Kinetic Spheres)
  // -------------------------------------------------------------
  const orbs: OrbItem[] = [];
  const orbConfigs = [
    { pos: new THREE.Vector3(12.5, 0.85, 12.5), color: 0x8b5cf6, radius: 0.55 },
    { pos: new THREE.Vector3(-15.5, 0.85, 6.5), color: 0x06b6d4, radius: 0.55 },
    { pos: new THREE.Vector3(6.5, 0.85, -18.5), color: 0xf59e0b, radius: 0.55 },
  ];

  orbConfigs.forEach((cfg) => {
    cfg.pos.y = 0.4 + cfg.radius; // rest on the ground, not sunk into it
    const geo = new THREE.IcosahedronGeometry(cfg.radius, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.25,
      metalness: 0.7,
      emissive: cfg.color,
      emissiveIntensity: 0.35,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.copy(cfg.pos);
    propsGroup.add(mesh);

    orbs.push({
      mesh,
      initialPos: cfg.pos.clone(),
      pos: cfg.pos.clone(),
      vel: new THREE.Vector3(),
      radius: cfg.radius,
      color: cfg.color,
      mass: 4,
      hitCooldown: 0,
    });
  });

  // -------------------------------------------------------------
  // 3. SPEED BOOST NITRO PADS (4 Glowing Chevrons on track)
  // -------------------------------------------------------------
  const boostPads: BoostPadItem[] = [];
  const padGeo = new THREE.PlaneGeometry(1.76, 2.16);
  padGeo.rotateX(-Math.PI / 2);

  // Positioned along the middle driving lane (radius ~15.5m), keeping start line and stunt ramp clear
  // The pad's chevrons point along local -Z. Turning the pad by -φ (φ = polar angle of its
  // position) lines them up with the circuit's travel direction (sin φ, 0, -cos φ), the same
  // direction as the painted lane arrows.
  const boostPadPositions = [
    new THREE.Vector3(0, 0.415, -15.5), // back straight (the right straight holds the start line)
    new THREE.Vector3(11.0, 0.415, -11.0),
    new THREE.Vector3(0, 0.415, 15.5), // front straight
    new THREE.Vector3(-11.0, 0.415, -11.0),
  ].map((pos) => ({ pos, rotY: -Math.atan2(pos.z, pos.x) }));

  boostPadPositions.forEach((cfg) => {
    const padGroup = new THREE.Group();

    // High-tech chevron glowing texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 256, 320);

      // Glowing Cyan Border
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 244, 308);

      // Three Glowing Neon Arrow Chevrons
      ctx.fillStyle = '#38bdf8';
      [70, 150, 230].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(128, y - 46);
        ctx.lineTo(212, y + 25);
        ctx.lineTo(176, y + 25);
        ctx.lineTo(128, y - 14);
        ctx.lineTo(80, y + 25);
        ctx.lineTo(44, y + 25);
        ctx.closePath();
        ctx.fill();
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    // Beveled raised platform base
    const borderGeo = new THREE.BoxGeometry(1.9, 0.024, 2.3);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.7,
      metalness: 0.3,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.012;
    padGroup.add(border);

    // Glowing pad surface mounted elevated on top of base to prevent coplanar Z-fighting
    const padMat = new THREE.MeshBasicMaterial({
      map: tex,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.025;
    padGroup.add(padMesh);

    padGroup.position.copy(cfg.pos);
    padGroup.rotation.y = cfg.rotY;
    propsGroup.add(padGroup);

    boostPads.push({
      mesh: padGroup,
      pos: cfg.pos.clone(),
      cooldown: 0,
    });
  });

  // -------------------------------------------------------------
  // 4. COLLECTIBLE DATA GEMS / TECH CRYSTALS (8 Rotating Gems)
  // -------------------------------------------------------------
  const gems: GemItem[] = [];
  const gemGeo = new THREE.OctahedronGeometry(0.35, 0);
  const gemPositions = [
    new THREE.Vector3(7.5, 1.1, 14.5),
    new THREE.Vector3(16.0, 1.1, 7.0),
    new THREE.Vector3(19.5, 1.1, -7.0),
    new THREE.Vector3(12.5, 1.1, -16.5),
    new THREE.Vector3(-7.0, 1.1, -19.5),
    new THREE.Vector3(-16.5, 1.1, -11.5),
    new THREE.Vector3(-20.5, 1.1, 5.0),
    new THREE.Vector3(-11.5, 1.1, 17.0),
  ];

  gemPositions.forEach((pos, idx) => {
    const gGroup = new THREE.Group();
    const color = idx % 2 === 0 ? 0x00f5ff : 0xfacc15;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.15,
      metalness: 0.8,
      emissive: color,
      emissiveIntensity: 0.65,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(gemGeo, mat);
    mesh.castShadow = true;
    gGroup.add(mesh);

    // Floating halo ring
    const haloGeo = new THREE.RingGeometry(0.42, 0.46, 16);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    gGroup.add(halo);

    gGroup.position.copy(pos);
    propsGroup.add(gGroup);

    mat.transparent = true;
    gems.push({
      mesh: gGroup,
      initialPos: pos.clone(),
      collected: false,
      pulseTime: idx * 0.8,
      popTime: -1,
      materials: [mat, haloMat],
    });
  });

  // -------------------------------------------------------------
  // 5. STUNT JUMP RAMP (Dedicated wedge ramp on West straight)
  // -------------------------------------------------------------
  const rampGroup = new THREE.Group();
  const rampPos = new THREE.Vector3(-15.5, 0.4, 0);

  const rampWidth = 2.4;
  const rampLength = 3.0;
  const rampHeight = 0.55;

  // Wedge shape for ramp: slopes up smoothly in the direction of driving (+Z)
  const rampShape = new THREE.Shape();
  rampShape.moveTo(-rampLength * 0.5, 0);
  rampShape.lineTo(rampLength * 0.5, 0);
  rampShape.lineTo(rampLength * 0.5, rampHeight);
  rampShape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: rampWidth,
    bevelEnabled: false,
  };
  const rampGeo = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
  rampGeo.center();
  rampGeo.rotateY(-Math.PI / 2);
  rampGeo.translate(0, rampHeight * 0.5, 0);

  const rampMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.3,
    flatShading: true,
  });
  const rampMesh = new THREE.Mesh(rampGeo, rampMat);
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  rampGroup.add(rampMesh);

  // High-visibility racing hazard chevrons on ramp deck
  const rampCanvas = document.createElement('canvas');
  rampCanvas.width = 256;
  rampCanvas.height = 512;
  const rampCtx = rampCanvas.getContext('2d');
  if (rampCtx) {
    rampCtx.fillStyle = '#0f172a';
    rampCtx.fillRect(0, 0, 256, 512);

    rampCtx.fillStyle = '#eab308';
    [90, 200, 310, 420].forEach((y) => {
      rampCtx.beginPath();
      rampCtx.moveTo(128, y - 55);
      rampCtx.lineTo(220, y + 20);
      rampCtx.lineTo(185, y + 20);
      rampCtx.lineTo(128, y - 22);
      rampCtx.lineTo(71, y + 20);
      rampCtx.lineTo(36, y + 20);
      rampCtx.closePath();
      rampCtx.fill();
    });
  }
  const rampTex = new THREE.CanvasTexture(rampCanvas);

  const slopeAngle = Math.atan2(rampHeight, rampLength);
  const railLength = Math.hypot(rampLength, rampHeight);

  const deckGeo = new THREE.PlaneGeometry(rampWidth * 0.94, railLength);
  deckGeo.rotateZ(Math.PI); // chevrons point uphill once laid down
  deckGeo.rotateX(-(Math.PI / 2 + slopeAngle)); // face up, tilted to match the slope
  deckGeo.translate(0, rampHeight * 0.5 + 0.015, 0);
  const deckMat = new THREE.MeshBasicMaterial({
    map: rampTex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  rampGroup.add(deckMesh);

  // Neon Edge Stripes on ramp that follow the slope exactly
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const railGeo = new THREE.BoxGeometry(0.1, 0.08, railLength);
  railGeo.rotateX(-slopeAngle);
  railGeo.translate(0, rampHeight * 0.5, 0);

  const edgeL = new THREE.Mesh(railGeo, stripeMat);
  edgeL.position.x = -rampWidth * 0.5;
  rampGroup.add(edgeL);

  const edgeR = new THREE.Mesh(railGeo, stripeMat);
  edgeR.position.x = rampWidth * 0.5;
  rampGroup.add(edgeR);

  rampGroup.position.copy(rampPos);
  propsGroup.add(rampGroup);

  // Walls of the wedge that are too tall to drive over: the back face and the upper part of
  // each side. `top` lets anything above the deck height (e.g. a launching kart) pass.
  const rampTop = rampPos.y + rampHeight;
  const rampObstacles: Obstacle[] = [
    { kind: 'box', cx: rampPos.x, cz: rampPos.z + rampLength * 0.5 - 0.05, hx: rampWidth * 0.5, hz: 0.06, yaw: 0, top: rampTop },
    { kind: 'box', cx: rampPos.x - rampWidth * 0.5, cz: rampPos.z + rampLength * 0.2, hx: 0.06, hz: rampLength * 0.3, yaw: 0, top: rampTop },
    { kind: 'box', cx: rampPos.x + rampWidth * 0.5, cz: rampPos.z + rampLength * 0.2, hx: 0.06, hz: rampLength * 0.3, yaw: 0, top: rampTop },
  ];
  let onRamp = false;
  let wasInRamp = false;

  // -------------------------------------------------------------
  // 6. KNOCKABLE TECH CRATES (Stack of 3 crates)
  // -------------------------------------------------------------
  const CRATE_SIZE = 0.65;
  const crateGeo = new THREE.BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE);
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
    flatShading: true,
  });

  const crateConfigs = [
    new THREE.Vector3(5.5, GROUND_Y + CRATE_SIZE / 2, -5.5),
    new THREE.Vector3(6.2, GROUND_Y + CRATE_SIZE / 2, -5.3),
    new THREE.Vector3(5.8, GROUND_Y + CRATE_SIZE * 1.5, -5.4), // Stacked on top!
  ];

  const crateMass = 6.0;
  const crateInertia = (crateMass * CRATE_SIZE * CRATE_SIZE) / 6;
  crateConfigs.forEach((cPos) => {
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.position.copy(cPos);
    propsGroup.add(crate);

    const h = CRATE_SIZE / 2;
    const points: THREE.Vector3[] = [];
    [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => [-1, 1].forEach((sz) => points.push(new THREE.Vector3(sx * h, sy * h, sz * h)))));

    bodies.push({
      kind: 'crate',
      mesh: crate,
      pos: cPos.clone(),
      quat: new THREE.Quaternion(),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      invMass: 1 / crateMass,
      invInertia: new THREE.Vector3(1 / crateInertia, 1 / crateInertia, 1 / crateInertia),
      points,
      radius: 0.4,
      halfHeight: h,
      restitution: 0.15,
      kartRestitution: 0.2,
      friction: 0.6,
      initialPos: cPos.clone(),
      initialQuat: new THREE.Quaternion(),
      asleep: true,
      sleepTimer: 0,
      hitCooldown: 0,
      landCooldown: 0,
    });
  });

  // -------------------------------------------------------------
  // RIGID PROP PHYSICS
  // -------------------------------------------------------------
  const GRAVITY = 14.0;
  const MAX_SUBSTEP = 1 / 120;
  // Kart footprint = two circles along its heading (matches the vehicle's own collider)
  const KART_COLLIDERS = [
    { offset: 0.55, r: 0.5 },
    { offset: -0.3, r: 0.5 },
  ];
  const KART_MASS = 120; // kart + driver: props barely slow it, crates noticeably more than cones
  const BUMPER_HEIGHT = 0.18; // impulses land where the bumper actually touches
  const KART_TOP = 0.7;
  let staticObstacles: Obstacle[] = [];
  let wallRadius = islandRadius - 1.2; // inner face of the perimeter wall

  const _tmpA = new THREE.Vector3();
  const _tmpB = new THREE.Vector3();
  const _tmpC = new THREE.Vector3();
  const _r = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _vp = new THREE.Vector3();
  const _n = new THREE.Vector3();
  const _t = new THREE.Vector3();
  const _invQ = new THREE.Quaternion();
  const _dq = new THREE.Quaternion();

  // out = I_world^-1 * v
  const applyInvInertia = (b: RigidProp, v: THREE.Vector3, out: THREE.Vector3) => {
    _invQ.copy(b.quat).invert();
    out.copy(v).applyQuaternion(_invQ);
    out.set(out.x * b.invInertia.x, out.y * b.invInertia.y, out.z * b.invInertia.z);
    return out.applyQuaternion(b.quat);
  };

  const applyImpulse = (b: RigidProp, impulse: THREE.Vector3, r: THREE.Vector3) => {
    b.vel.addScaledVector(impulse, b.invMass);
    _tmpA.crossVectors(r, impulse);
    applyInvInertia(b, _tmpA, _tmpB);
    b.angVel.add(_tmpB);
  };

  // Effective inverse mass of the body at offset r along direction d
  const effectiveInvMass = (b: RigidProp, r: THREE.Vector3, d: THREE.Vector3) => {
    _tmpA.crossVectors(r, d);
    applyInvInertia(b, _tmpA, _tmpB);
    _tmpC.crossVectors(_tmpB, r);
    return b.invMass + d.dot(_tmpC);
  };

  const pointVelocity = (b: RigidProp, r: THREE.Vector3, out: THREE.Vector3) =>
    out.crossVectors(b.angVel, r).add(b.vel);

  const wake = (b: RigidProp) => {
    b.asleep = false;
    b.sleepTimer = 0;
  };

  // Height of whatever this body rests on: the island, or the top of a crate below it
  const supportHeight = (b: RigidProp) => {
    let h = GROUND_Y;
    if (b.kind !== 'crate') return h;
    for (const o of bodies) {
      if (o === b || o.kind !== 'crate') continue;
      if (o.pos.y > b.pos.y - CRATE_SIZE * 0.5) continue;
      if (Math.abs(o.pos.x - b.pos.x) < CRATE_SIZE * 0.85 && Math.abs(o.pos.z - b.pos.z) < CRATE_SIZE * 0.85) {
        h = Math.max(h, o.pos.y + o.halfHeight);
      }
    }
    return h;
  };

  const lowestPoint = (b: RigidProp) => {
    let minY = Infinity;
    for (const lp of b.points) {
      _p.copy(lp).applyQuaternion(b.quat);
      minY = Math.min(minY, b.pos.y + _p.y);
    }
    return minY;
  };

  // Returns the strongest downward impact speed this step (for landing sounds)
  const solveGroundContacts = (b: RigidProp, floorY: number) => {
    let maxPen = 0;
    let impact = 0;
    _n.set(0, 1, 0);
    for (let iter = 0; iter < 2; iter++) {
      for (const lp of b.points) {
        _r.copy(lp).applyQuaternion(b.quat);
        const py = b.pos.y + _r.y;
        const pen = floorY - py;
        if (pen <= 0) continue;
        maxPen = Math.max(maxPen, pen);

        pointVelocity(b, _r, _vp);
        const vn = _vp.y;
        if (vn < 0) {
          impact = Math.max(impact, -vn);
          const e = vn < -0.8 ? b.restitution : 0; // no micro-bounces at rest
          const jn = (-(1 + e) * vn) / effectiveInvMass(b, _r, _n);
          _tmpC.set(0, jn, 0);
          applyImpulse(b, _tmpC, _r);

          // Coulomb friction against the sliding direction
          pointVelocity(b, _r, _vp);
          _t.set(_vp.x, 0, _vp.z);
          const vt = _t.length();
          if (vt > 1e-4) {
            _t.multiplyScalar(1 / vt);
            let jt = vt / effectiveInvMass(b, _r, _t);
            jt = Math.min(jt, b.friction * jn);
            _tmpC.copy(_t).multiplyScalar(-jt);
            applyImpulse(b, _tmpC, _r);
          }
        }
      }
    }
    if (maxPen > 0) b.pos.y += maxPen * 0.8;
    // how many hull points rest on the floor: < 3 means balancing on an edge or tip
    let supports = 0;
    for (const lp of b.points) {
      _p.copy(lp).applyQuaternion(b.quat);
      if (b.pos.y + _p.y - floorY < 0.012) supports++;
    }
    return { touching: supports > 0, supports, impact };
  };

  const solveStaticObstacles = (b: RigidProp) => {
    for (const o of staticObstacles) {
      const hit = circleVsObstacle(b.pos.x, b.pos.z, b.radius, o);
      if (!hit) continue;
      b.pos.x += hit.nx * hit.depth;
      b.pos.z += hit.nz * hit.depth;
      const vn = b.vel.x * hit.nx + b.vel.z * hit.nz;
      if (vn < 0) {
        b.vel.x -= (1 + 0.35) * vn * hit.nx;
        b.vel.z -= (1 + 0.35) * vn * hit.nz;
        b.angVel.y += (Math.random() - 0.5) * 2;
        if (-vn > 1.2) soundManager.playConeHit(Math.min(1, -vn / 6));
      }
    }
    // island rim
    const d = Math.hypot(b.pos.x, b.pos.z);
    const limit = wallRadius - b.radius;
    if (d > limit) {
      const nx = -b.pos.x / d;
      const nz = -b.pos.z / d;
      b.pos.x += nx * (d - limit);
      b.pos.z += nz * (d - limit);
      const vn = b.vel.x * nx + b.vel.z * nz;
      if (vn < 0) {
        b.vel.x -= 1.4 * vn * nx;
        b.vel.z -= 1.4 * vn * nz;
      }
    }
  };

  // Simple sphere-like separation between props standing side by side
  const solvePropPairs = () => {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (a.asleep && b.asleep) continue;
        if (Math.abs(a.pos.y - b.pos.y) > 0.45) continue; // stacked crates are handled by support
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        const min = a.radius + b.radius;
        if (d >= min || d < 1e-5) continue;
        const nx = dx / d;
        const nz = dz / d;
        const pen = (min - d) * 0.5; // soft: resolved over a few substeps, no visible pop
        const wa = a.invMass / (a.invMass + b.invMass);
        const wb = 1 - wa;
        a.pos.x -= nx * pen * wa;
        a.pos.z -= nz * pen * wa;
        b.pos.x += nx * pen * wb;
        b.pos.z += nz * pen * wb;
        const rv = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz;
        if (rv < 0) {
          const jImp = (-(1 + 0.3) * rv) / (a.invMass + b.invMass);
          a.vel.x -= jImp * a.invMass * nx;
          a.vel.z -= jImp * a.invMass * nz;
          b.vel.x += jImp * b.invMass * nx;
          b.vel.z += jImp * b.invMass * nz;
          // off-centre knocks make things topple
          a.angVel.x += -nz * jImp * a.invMass * 2;
          a.angVel.z += nx * jImp * a.invMass * 2;
          b.angVel.x += nz * jImp * b.invMass * 2;
          b.angVel.z += -nx * jImp * b.invMass * 2;
          if (-rv > 0.6) {
            wake(a);
            wake(b);
          }
        }
      }
    }
  };

  // Nearest kart collider touching a horizontal circle; returns contact normal + overlap
  const kartContact = (x: number, z: number, r: number, carPos: THREE.Vector3, carYaw: number) => {
    let best: { nx: number; nz: number; overlap: number } | null = null;
    const hx = Math.sin(carYaw);
    const hz = Math.cos(carYaw);
    for (const c of KART_COLLIDERS) {
      const dx = x - (carPos.x + hx * c.offset);
      const dz = z - (carPos.z + hz * c.offset);
      const d = Math.hypot(dx, dz);
      const overlap = r + c.r - d;
      if (overlap <= 0 || d < 1e-5) continue;
      if (!best || overlap > best.overlap) best = { nx: dx / d, nz: dz / d, overlap };
    }
    return best;
  };

  // The kart is effectively immovable for props: impulse at bumper height along the
  // contact normal, applied once per approach (only while closing in).
  // Returns the speed the kart loses to this prop.
  const hitByKart = (b: RigidProp, carPos: THREE.Vector3, carYaw: number, carVel: THREE.Vector3) => {
    // anything flying or stacked above the ~0.7 m tall kart is not touched
    if (lowestPoint(b) > GROUND_Y + KART_TOP) return 0;
    const contact = kartContact(b.pos.x, b.pos.z, b.radius, carPos, carYaw);
    if (!contact) return 0;
    const { nx, nz } = contact;

    // keep the prop outside the kart (capped per frame so grazing contacts never pop)
    const push = Math.min(contact.overlap, 0.1);
    b.pos.x += nx * push;
    b.pos.z += nz * push;

    const vn = (carVel.x - b.vel.x) * nx + (carVel.z - b.vel.z) * nz; // closing speed
    if (vn <= 0.25) return 0;
    wake(b);

    _n.set(nx, 0, nz);
    _r.set(-nx * b.radius * 0.9, GROUND_Y + BUMPER_HEIGHT - b.pos.y, -nz * b.radius * 0.9);
    const jn = ((1 + b.kartRestitution) * vn) / effectiveInvMass(b, _r, _n);
    _tmpC.copy(_n).multiplyScalar(jn);
    applyImpulse(b, _tmpC, _r);

    // a little lift and spin so hits feel lively but not random
    b.vel.y += Math.min(1.8, vn * 0.15);
    b.angVel.y += (Math.random() - 0.5) * vn * 0.6;

    if (b.hitCooldown <= 0) {
      soundManager.playConeHit(Math.min(1, vn / 6));
      b.hitCooldown = 0.15;
    }
    return jn / KART_MASS;
  };

  // --- Orbs: heavy balls that roll, bounce and knock props over ---
  const ORB_GRAVITY = GRAVITY;
  const stepOrb = (orb: OrbItem, dt: number) => {
    const r = orb.radius;
    orb.vel.y -= ORB_GRAVITY * dt;
    orb.pos.addScaledVector(orb.vel, dt);

    // ground
    const floor = GROUND_Y + r;
    let grounded = false;
    if (orb.pos.y <= floor) {
      orb.pos.y = floor;
      if (orb.vel.y < -1.2) {
        if (orb.vel.y < -2.5) soundManager.playOrbHit();
        orb.vel.y = -orb.vel.y * 0.45;
      } else {
        orb.vel.y = 0;
        grounded = true;
      }
    }
    if (grounded) {
      // rolling resistance: balls roll a long way but do come to rest
      const hs = Math.hypot(orb.vel.x, orb.vel.z);
      if (hs > 1e-4) {
        const k = Math.max(0, hs - 0.9 * dt) / hs;
        orb.vel.x *= k;
        orb.vel.z *= k;
      }
    }

    // furniture, columns, ramp walls
    for (const o of staticObstacles) {
      if (o.top !== undefined && orb.pos.y - r > o.top) continue;
      const hit = circleVsObstacle(orb.pos.x, orb.pos.z, r, o);
      if (!hit) continue;
      orb.pos.x += hit.nx * hit.depth;
      orb.pos.z += hit.nz * hit.depth;
      const vn = orb.vel.x * hit.nx + orb.vel.z * hit.nz;
      if (vn < 0) {
        orb.vel.x -= 1.6 * vn * hit.nx;
        orb.vel.z -= 1.6 * vn * hit.nz;
        if (-vn > 1.5) soundManager.playOrbHit();
      }
    }

    // tyre wall: reflect only while moving outward (no jitter against the wall)
    const d = Math.hypot(orb.pos.x, orb.pos.z);
    const limit = wallRadius - r;
    if (d > limit) {
      const nx = -orb.pos.x / d;
      const nz = -orb.pos.z / d;
      orb.pos.x += nx * (d - limit);
      orb.pos.z += nz * (d - limit);
      const vn = orb.vel.x * nx + orb.vel.z * nz;
      if (vn < 0) {
        orb.vel.x -= 1.6 * vn * nx;
        orb.vel.z -= 1.6 * vn * nz;
        if (-vn > 1.5) soundManager.playOrbHit();
      }
    }

    // knock cones and crates
    for (const b of bodies) {
      if (Math.abs(b.pos.y - orb.pos.y) > r + 0.4) continue;
      const dx = b.pos.x - orb.pos.x;
      const dz = b.pos.z - orb.pos.z;
      const dist = Math.hypot(dx, dz);
      const min = r + b.radius;
      if (dist >= min || dist < 1e-5) continue;
      const nx = dx / dist;
      const nz = dz / dist;
      const invO = 1 / orb.mass;
      const pen = (min - dist) * 0.5;
      orb.pos.x -= nx * pen * (invO / (invO + b.invMass));
      orb.pos.z -= nz * pen * (invO / (invO + b.invMass));
      b.pos.x += nx * pen * (b.invMass / (invO + b.invMass));
      b.pos.z += nz * pen * (b.invMass / (invO + b.invMass));
      const rv = (orb.vel.x - b.vel.x) * nx + (orb.vel.z - b.vel.z) * nz;
      if (rv > 0.2) {
        wake(b);
        const j = ((1 + 0.4) * rv) / (invO + b.invMass);
        orb.vel.x -= j * invO * nx;
        orb.vel.z -= j * invO * nz;
        _n.set(nx, 0, nz);
        _r.set(-nx * b.radius * 0.9, orb.pos.y - b.pos.y, -nz * b.radius * 0.9);
        _tmpC.copy(_n).multiplyScalar(j);
        applyImpulse(b, _tmpC, _r);
        if (b.hitCooldown <= 0) {
          soundManager.playConeHit(Math.min(1, rv / 6));
          b.hitCooldown = 0.15;
        }
      }
    }

    // roll without slipping
    const hs = Math.hypot(orb.vel.x, orb.vel.z);
    if (hs > 1e-4) {
      _tmpA.set(orb.vel.z, 0, -orb.vel.x).normalize();
      orb.mesh.rotateOnWorldAxis(_tmpA, (hs * dt) / r);
    }
  };

  const solveOrbPairs = () => {
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const a = orbs[i];
        const b = orbs[j];
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        const min = a.radius + b.radius;
        if (d >= min || d < 1e-5) continue;
        const nx = dx / d;
        const nz = dz / d;
        a.pos.x -= nx * (min - d) * 0.5;
        a.pos.z -= nz * (min - d) * 0.5;
        b.pos.x += nx * (min - d) * 0.5;
        b.pos.z += nz * (min - d) * 0.5;
        const rv = (a.vel.x - b.vel.x) * nx + (a.vel.z - b.vel.z) * nz;
        if (rv > 0) {
          const jImp = rv * 0.85; // equal masses, restitution ~0.7
          a.vel.x -= jImp * nx;
          a.vel.z -= jImp * nz;
          b.vel.x += jImp * nx;
          b.vel.z += jImp * nz;
          if (rv > 1.2) soundManager.playOrbHit();
        }
      }
    }
  };

  const hitOrbByKart = (orb: OrbItem, carPos: THREE.Vector3, carYaw: number, carVel: THREE.Vector3) => {
    if (orb.pos.y - orb.radius > GROUND_Y + KART_TOP) return 0;
    const contact = kartContact(orb.pos.x, orb.pos.z, orb.radius, carPos, carYaw);
    if (!contact) return 0;
    const { nx, nz } = contact;
    const push = Math.min(contact.overlap, 0.12);
    orb.pos.x += nx * push;
    orb.pos.z += nz * push;
    const vn = (carVel.x - orb.vel.x) * nx + (carVel.z - orb.vel.z) * nz;
    if (vn <= 0.25) return 0;
    const e = 0.6;
    orb.vel.x += (1 + e) * vn * nx;
    orb.vel.z += (1 + e) * vn * nz;
    orb.vel.y += Math.min(1.5, vn * 0.12);
    if (orb.hitCooldown <= 0) {
      soundManager.playOrbHit();
      orb.hitCooldown = 0.2;
    }
    return (orb.mass * (1 + e) * vn) / KART_MASS;
  };

  const integrate = (b: RigidProp, dt: number) => {
    b.vel.y -= GRAVITY * dt;
    b.pos.addScaledVector(b.vel, dt);
    const w = b.angVel;
    _dq.set(w.x * dt * 0.5, w.y * dt * 0.5, w.z * dt * 0.5, 0).multiply(b.quat);
    b.quat.set(b.quat.x + _dq.x, b.quat.y + _dq.y, b.quat.z + _dq.z, b.quat.w + _dq.w).normalize();
    // light air drag
    b.angVel.multiplyScalar(Math.exp(-0.25 * dt));
  };

  const stepBody = (b: RigidProp, dt: number, floorY: number) => {
    integrate(b, dt);
    const { touching, supports, impact } = solveGroundContacts(b, floorY);
    if (touching) {
      // rolling resistance so cones don't spin forever on their side
      b.angVel.multiplyScalar(Math.exp(-1.6 * dt));
      // kinetic friction on the resting weight: steady deceleration while sliding/tumbling
      const hSpeed = Math.hypot(b.vel.x, b.vel.z);
      if (hSpeed > 1e-4) {
        const scale = Math.max(0, hSpeed - b.friction * GRAVITY * 0.6 * dt) / hSpeed;
        b.vel.x *= scale;
        b.vel.z *= scale;
      }
      if (impact > 1.6 && b.landCooldown <= 0) {
        soundManager.playConeHit(Math.min(0.6, impact / 8));
        b.landCooldown = 0.12;
      }
      const slow = b.vel.lengthSq() < 0.0064 && b.angVel.lengthSq() < 0.0225;
      if (slow && supports < 3) {
        // perfectly balanced on an edge is not a real resting pose: tip it gently
        b.angVel.x += (Math.random() - 0.5) * 0.3;
        b.angVel.z += (Math.random() - 0.5) * 0.3;
        b.sleepTimer = 0;
      } else if (slow) {
        b.sleepTimer += dt;
        if (b.sleepTimer > 0.4) {
          b.asleep = true;
          b.vel.set(0, 0, 0);
          b.angVel.set(0, 0, 0);
        }
      } else {
        b.sleepTimer = 0;
      }
    } else {
      b.sleepTimer = 0;
    }
  };

  const syncMesh = (b: RigidProp) => {
    b.mesh.position.copy(b.pos);
    b.mesh.quaternion.copy(b.quat);
  };

  // -------------------------------------------------------------
  // INTERACTIVE PHYSICS & GAMEPLAY UPDATE LOOP
  // -------------------------------------------------------------
  let collectedGemsCount = 0;

  return {
    group: propsGroup,

    update: (delta: number, carPos: THREE.Vector3, carSpeed: number, carYaw: number) => {
      let boostImpulse = false;
      let jumpElev = 0;
      let jumpVelocity = 0;
      let newlyCollectedGem = false;

      // 1. RIGID PROPS (cones & crates) and ORBS: kart hits, then sub-stepped physics
      const carVel = _tmpA.set(Math.sin(carYaw), 0, Math.cos(carYaw)).multiplyScalar(carSpeed).clone();
      let kartSpeedLoss = 0;
      for (const b of bodies) {
        b.hitCooldown = Math.max(0, b.hitCooldown - delta);
        b.landCooldown = Math.max(0, b.landCooldown - delta);
        kartSpeedLoss += hitByKart(b, carPos, carYaw, carVel);
      }
      for (const orb of orbs) {
        orb.hitCooldown = Math.max(0, orb.hitCooldown - delta);
        kartSpeedLoss += hitOrbByKart(orb, carPos, carYaw, carVel);
      }
      const steps = Math.max(1, Math.ceil(delta / MAX_SUBSTEP));
      const dt = delta / steps;
      for (let step = 0; step < steps; step++) {
        for (const b of bodies) {
          const floorY = supportHeight(b);
          if (b.asleep) {
            // wake if whatever held it up has gone (e.g. the crate underneath was knocked away)
            if (lowestPoint(b) > floorY + 0.02) wake(b);
            else continue;
          }
          stepBody(b, dt, floorY);
          solveStaticObstacles(b);
        }
        solvePropPairs();
        for (const orb of orbs) {
          const moving = orb.vel.lengthSq() > 1e-4 || orb.pos.y > GROUND_Y + orb.radius + 1e-3;
          if (moving) stepOrb(orb, dt);
        }
        solveOrbPairs();
      }
      bodies.forEach(syncMesh);
      orbs.forEach((orb) => orb.mesh.position.copy(orb.pos));

      // 3. UPDATE BOOST PADS
      boostPads.forEach((pad) => {
        pad.cooldown = Math.max(0, pad.cooldown - delta);
        const dist = Math.hypot(carPos.x - pad.pos.x, carPos.z - pad.pos.z);
        if (dist < 1.3 && pad.cooldown <= 0) {
          pad.cooldown = 1.6; // prevent rapid re-triggering
          boostImpulse = true;
          soundManager.playBoostPad();
        }
      });

      // 4. UPDATE DATA GEMS (Floating & Rotating)
      gems.forEach((gem) => {
        if (gem.collected) {
          // quick pop: grow and fade out, then hide
          if (gem.popTime >= 0) {
            gem.popTime += delta;
            const t = Math.min(1, gem.popTime / 0.35);
            gem.mesh.scale.setScalar(1 + t * 0.9);
            gem.mesh.position.y += delta * 1.2;
            gem.mesh.rotation.y += delta * 8;
            gem.materials.forEach((m) => {
              m.opacity = (1 - t) * (m === gem.materials[1] ? 0.6 : 1);
            });
            if (t >= 1) {
              gem.mesh.visible = false;
              gem.popTime = -1;
            }
          }
          return;
        }

        gem.pulseTime += delta;
        gem.mesh.rotation.y += delta * 1.8;
        gem.mesh.position.y = gem.initialPos.y + Math.sin(gem.pulseTime * 3.0) * 0.12;

        const dist = Math.hypot(carPos.x - gem.mesh.position.x, carPos.z - gem.mesh.position.z);
        if (dist < 0.95) {
          // Collected!
          gem.collected = true;
          gem.popTime = 0;
          collectedGemsCount += 1;
          newlyCollectedGem = true;
          soundManager.playGemCollect(collectedGemsCount);
        }
      });

      // 5. UPDATE JUMP RAMP INTERACTION
      const relX = carPos.x - rampPos.x;
      const relZ = carPos.z - rampPos.z;

      const inRamp = Math.abs(relX) < rampWidth * 0.55 && relZ >= -rampLength * 0.5 && relZ <= rampLength * 0.5;
      if (!inRamp) {
        onRamp = false;
        wasInRamp = false;
      } else {
        // only a fresh entry over the low part counts as driving up the deck
        if (!wasInRamp && relZ < -rampLength * 0.1) onRamp = true;
        wasInRamp = true;
      }
      if (inRamp && onRamp) {
        // Car is traversing the ramp incline
        const progress = THREE.MathUtils.clamp((relZ + rampLength * 0.5) / rampLength, 0, 1);
        jumpElev = progress * rampHeight;

        // Approaching the crest at speed: trigger dynamic stunt launch!
        if (progress > 0.78 && carSpeed > 2.0 && Math.cos(carYaw) > 0.3) {
          jumpVelocity = Math.min(8.5, Math.abs(carSpeed) * 0.65 + 3.2);
          soundManager.playNitro();
        }
      }

      return {
        boostImpulse,
        jumpElev,
        jumpVelocity,
        newlyCollectedGem,
        collectedCount: collectedGemsCount,
        totalGems: gems.length,
        kartSpeedLoss,
      };
    },

    resetAll: () => {
      bodies.forEach((b) => {
        b.pos.copy(b.initialPos);
        b.quat.copy(b.initialQuat);
        b.vel.set(0, 0, 0);
        b.angVel.set(0, 0, 0);
        b.asleep = true;
        b.sleepTimer = 0;
        syncMesh(b);
      });

      orbs.forEach((o) => {
        o.pos.copy(o.initialPos);
        o.vel.set(0, 0, 0);
        o.mesh.position.copy(o.pos);
        o.mesh.rotation.set(0, 0, 0);
      });

      gems.forEach((g) => {
        g.collected = false;
        g.mesh.visible = true;
        g.popTime = -1;
        g.mesh.scale.setScalar(1);
        g.materials.forEach((m, i) => {
          m.opacity = i === 1 ? 0.6 : 1;
        });
      });
      collectedGemsCount = 0;
    },

    setObstacles: (obstacles: Obstacle[], wall?: number) => {
      staticObstacles = [...obstacles, ...rampObstacles];
      if (wall !== undefined) wallRadius = wall;
    },

    rampObstacles,

    getGemCount: () => ({
      collected: collectedGemsCount,
      total: gems.length,
    }),
  };
}
