import * as THREE from 'three';
import { createDetailedWorkstation, WorkstationInstance } from './workstation';

// Create a solid, watertight, faceted rock island base with soothing asphalt driving circuit
export function createLowPolyIsland(radius: number = 28, depth: number = 12, color: number = 0x334155, rockColor: number = 0x1e293b): THREE.Group {
  const islandGroup = new THREE.Group();

  const segments = 56; // High segment count for smooth circular track and clear markings

  // Top island terrain surface (soothing matte slate neutral - easy on the eyes)
  const topGeo = new THREE.CylinderGeometry(radius, radius * 0.97, 0.8, segments, 1);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x2d3748, // Gentle slate gray
    flatShading: true,
    roughness: 0.8,
    metalness: 0.12,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.receiveShadow = true;
  islandGroup.add(topMesh);

  // Bottom tapered rock cone seamlessly matching the cylinder base radius at y = -0.4
  const rockGeo = new THREE.ConeGeometry(radius * 0.97, depth, segments, 4);
  rockGeo.rotateX(Math.PI);
  rockGeo.translate(0, -depth / 2 - 0.4, 0);

  // Only displace rock vertices deep below the seam (vy < -1.0) so the top rim remains 100% watertight
  const rockPos = rockGeo.attributes.position;
  for (let i = 0; i < rockPos.count; i++) {
    const vy = rockPos.getY(i);
    if (vy < -1.0) {
      const vx = rockPos.getX(i);
      const vz = rockPos.getZ(i);
      const factor = Math.min(1.0, Math.abs(vy + 0.4) / depth);
      rockPos.setX(i, vx + (Math.sin(i * 3.7) * 0.6) * factor);
      rockPos.setZ(i, vz + (Math.cos(i * 4.3) * 0.6) * factor);
    }
  }
  rockGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: rockColor,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.2,
  });
  const rockMesh = new THREE.Mesh(rockGeo, rockMat);
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  islandGroup.add(rockMesh);

  // Seamless transition collar rim sealing any seam
  const collarGeo = new THREE.CylinderGeometry(radius * 0.985, radius * 0.965, 0.25, segments);
  collarGeo.translate(0, -0.4, 0);
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x243042,
    flatShading: true,
    roughness: 0.85,
  });
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  islandGroup.add(collarMesh);

  // -------------------------------------------------------------
  // CIRCUIT LAYOUT (island-local radii)
  //   plaza (workstation)        0    - 4.8
  //   infield grass              4.8  - TRACK_IN
  //   asphalt circuit            TRACK_IN - TRACK_OUT, red/white kerbs on both edges
  //   run-off grass + tyre wall  TRACK_OUT - fence
  // -------------------------------------------------------------
  const TRACK_IN = 10.5;
  const TRACK_OUT = 22.0;
  const KERB_W = 0.45;
  const TYRE_WALL_R = 25.4;
  const FENCE_R = radius - 0.75;
  const GROUND_Y = 0.4;
  const obstacles: { kind: 'circle'; cx: number; cz: number; r: number }[] = [];

  // --- Perimeter fence: slim posts, light rails, one soft teal top rail ---
  const fencePostCount = 52;
  const postHeight = 1.9;
  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, postHeight, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5, metalness: 0.5 });
  [0.95, 1.55].forEach((h) => {
    const railGeo = new THREE.TorusGeometry(FENCE_R, 0.05, 6, segments * 2);
    railGeo.rotateX(Math.PI / 2);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = GROUND_Y + h;
    islandGroup.add(rail);
  });
  const topRailGeo = new THREE.TorusGeometry(FENCE_R, 0.06, 6, segments * 2);
  topRailGeo.rotateX(Math.PI / 2);
  const topRail = new THREE.Mesh(topRailGeo, new THREE.MeshStandardMaterial({ color: 0x2f7e7c, roughness: 0.4, metalness: 0.4 }));
  topRail.position.y = GROUND_Y + postHeight;
  islandGroup.add(topRail);
  const postsMesh = new THREE.InstancedMesh(postGeo, postMat, fencePostCount);
  const m4 = new THREE.Matrix4();
  for (let p = 0; p < fencePostCount; p++) {
    const a = (p / fencePostCount) * Math.PI * 2;
    m4.makeTranslation(Math.cos(a) * FENCE_R, GROUND_Y + postHeight / 2, Math.sin(a) * FENCE_R);
    postsMesh.setMatrixAt(p, m4);
  }
  postsMesh.castShadow = true;
  islandGroup.add(postsMesh);

  // --- Ground layers ---
  const flatRing = (rIn: number, rOut: number, mat: THREE.Material, y: number, segs = 96) => {
    const g = new THREE.RingGeometry(rIn, rOut, segs, 1);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.y = y;
    m.receiveShadow = true;
    islandGroup.add(m);
    return m;
  };

  // Inner Workstation Tech Plaza (unchanged look)
  flatRing(0.1, 4.8, new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.65, metalness: 0.15, flatShading: true }), 0.405, 36);
  const plazaAccentMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
  flatRing(4.4, 4.65, plazaAccentMat, 0.407, 36);

  // Grass with a little colour variation baked into a small tiling texture
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 128;
  grassCanvas.height = 128;
  const gctx = grassCanvas.getContext('2d');
  if (gctx) {
    gctx.fillStyle = '#5f8f5a';
    gctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const shade = Math.random();
      gctx.fillStyle = shade > 0.5 ? 'rgba(122,168,104,0.35)' : 'rgba(62,105,64,0.35)';
      gctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  }
  const grassTex = new THREE.CanvasTexture(grassCanvas);
  grassTex.colorSpace = THREE.SRGBColorSpace;
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(14, 14);
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95, metalness: 0 });
  flatRing(4.8, TRACK_IN - KERB_W, grassMat, 0.405);
  flatRing(TRACK_OUT + KERB_W, FENCE_R + 0.3, grassMat, 0.405);

  // Asphalt with fine grain and a darker rubbered-in racing line
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 1024;
  asphaltCanvas.height = 1024;
  const actx = asphaltCanvas.getContext('2d');
  if (actx) {
    actx.fillStyle = '#4b5563';
    actx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 26000; i++) {
      const v = 60 + Math.floor(Math.random() * 50);
      actx.fillStyle = `rgba(${v},${v + 4},${v + 10},0.35)`;
      actx.fillRect(Math.random() * 1024, Math.random() * 1024, 1.5, 1.5);
    }
    // ring UVs are planar: map track radii onto the 1024px square (outer edge = TRACK_OUT)
    const pxPerM = 512 / TRACK_OUT;
    const racingLine = actx.createRadialGradient(512, 512, 13.5 * pxPerM, 512, 512, 19.0 * pxPerM);
    racingLine.addColorStop(0, 'rgba(20,24,30,0)');
    racingLine.addColorStop(0.5, 'rgba(20,24,30,0.22)');
    racingLine.addColorStop(1, 'rgba(20,24,30,0)');
    actx.fillStyle = racingLine;
    actx.fillRect(0, 0, 1024, 1024);
  }
  const asphaltTex = new THREE.CanvasTexture(asphaltCanvas);
  asphaltTex.colorSpace = THREE.SRGBColorSpace;
  asphaltTex.anisotropy = 4;
  const trackMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.82, metalness: 0.05 });
  flatRing(TRACK_IN, TRACK_OUT, trackMat, 0.408, 128);

  // Red / white kerbs on both edges (one InstancedMesh-free ring per colour)
  const kerbRing = (rIn: number, rOut: number, blocks: number) => {
    const red = new THREE.MeshStandardMaterial({ color: 0xd62839, roughness: 0.6 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const step = (Math.PI * 2) / blocks;
    for (let k = 0; k < blocks; k++) {
      const g = new THREE.RingGeometry(rIn, rOut, 3, 1, k * step, step);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, k % 2 === 0 ? red : white);
      m.position.y = 0.412;
      m.receiveShadow = true;
      islandGroup.add(m);
    }
  };
  kerbRing(TRACK_IN - KERB_W, TRACK_IN, 64);
  kerbRing(TRACK_OUT, TRACK_OUT + KERB_W, 132);

  // White edge lines and a dashed centre line
  const paintMat = new THREE.MeshBasicMaterial({
    color: 0xe5e7eb,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const edgeLine = (r: number) => {
    const g = new THREE.RingGeometry(r - 0.06, r + 0.06, 160, 1);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, paintMat);
    m.position.y = 0.41;
    islandGroup.add(m);
  };
  edgeLine(TRACK_IN + 0.35);
  edgeLine(TRACK_OUT - 0.35);
  const centreR = (TRACK_IN + TRACK_OUT) / 2;
  const dashCount = Math.round((Math.PI * 2 * centreR) / 3.0);
  for (let d = 0; d < dashCount; d++) {
    const step = (Math.PI * 2) / dashCount;
    const g = new THREE.RingGeometry(centreR - 0.07, centreR + 0.07, 3, 1, d * step, step * 0.5);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, paintMat);
    m.position.y = 0.41;
    islandGroup.add(m);
  }

  // Direction chevrons on each lane (counter-clockwise flow)
  const chevronMat = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.7);
  arrowShape.lineTo(0.48, -0.36);
  arrowShape.lineTo(0.24, -0.36);
  arrowShape.lineTo(0, 0.18);
  arrowShape.lineTo(-0.24, -0.36);
  arrowShape.lineTo(-0.48, -0.36);
  arrowShape.closePath();
  const chevronGeo = new THREE.ShapeGeometry(arrowShape);
  chevronGeo.rotateX(Math.PI / 2);
  [(TRACK_IN + centreR) / 2, (centreR + TRACK_OUT) / 2].forEach((r) => {
    [0.3, 0.8, 1.3, 1.8].forEach((k) => {
      const ang = Math.PI * k;
      const arrow = new THREE.Mesh(chevronGeo, chevronMat);
      arrow.position.set(Math.sin(ang) * r, 0.413, Math.cos(ang) * r);
      arrow.rotation.y = ang + Math.PI / 2;
      islandGroup.add(arrow);
    });
  });

  // --- Start / finish line on the right-hand straight (+X), so the gantry frames the right
  // side of the default view instead of sitting behind the desk ---
  const SF_YAW = -Math.PI / 2;
  const startGroup = new THREE.Group();
  startGroup.rotation.y = SF_YAW;
  islandGroup.add(startGroup);
  const sfCanvas = document.createElement('canvas');
  sfCanvas.width = 2048;
  sfCanvas.height = 192;
  const sfCtx = sfCanvas.getContext('2d');
  const sfLength = TRACK_OUT - TRACK_IN;
  if (sfCtx) {
    const rows = 3;
    const cols = Math.round((sfLength / 1.0) * rows); // square checkers
    const cw = 2048 / cols;
    const rh = 192 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        sfCtx.fillStyle = (r + c) % 2 === 0 ? '#f8f7f3' : '#172b36';
        sfCtx.fillRect(c * cw, r * rh, cw + 1, rh + 1);
      }
    }
  }
  const sfTex = new THREE.CanvasTexture(sfCanvas);
  sfTex.colorSpace = THREE.SRGBColorSpace;
  sfTex.anisotropy = 4;
  const sfGeo = new THREE.PlaneGeometry(sfLength, 1.0);
  sfGeo.rotateX(-Math.PI / 2);
  sfGeo.rotateY(Math.PI / 2); // run radially along +Z
  const sfMesh = new THREE.Mesh(
    sfGeo,
    new THREE.MeshBasicMaterial({ map: sfTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  );
  sfMesh.position.set(0, 0.411, -(TRACK_IN + sfLength / 2));
  sfMesh.renderOrder = 2;
  startGroup.add(sfMesh);

  const gantry = new THREE.Group();
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x172b36, roughness: 0.45, metalness: 0.5 });
  const gantryH = 3.4;
  const legZ = [-(TRACK_OUT + KERB_W + 0.4), -(TRACK_IN - KERB_W - 0.4)];
  legZ.forEach((z) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, gantryH, 0.3), gantryMat);
    leg.position.set(0, GROUND_Y + gantryH / 2, z);
    leg.castShadow = true;
    gantry.add(leg);
    // leg position after the start group's yaw
    obstacles.push({ kind: 'circle', cx: z * Math.sin(SF_YAW), cz: z * Math.cos(SF_YAW), r: 0.25 });
  });
  const span = legZ[1] - legZ[0];
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, span + 0.3), gantryMat);
  beam.position.set(0, GROUND_Y + gantryH - 0.25, (legZ[0] + legZ[1]) / 2);
  beam.castShadow = true;
  gantry.add(beam);

  // Banner on both faces of the beam
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 2048;
  bannerCanvas.height = 96;
  const bctx = bannerCanvas.getContext('2d');
  if (bctx) {
    bctx.fillStyle = '#172b36';
    bctx.fillRect(0, 0, 2048, 96);
    bctx.fillStyle = '#2f7e7c';
    bctx.fillRect(0, 0, 2048, 6);
    bctx.fillRect(0, 90, 2048, 6);
    bctx.font = '800 54px Manrope, "Plus Jakarta Sans", system-ui, sans-serif';
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillStyle = '#edf2ef';
    bctx.fillText('START  ·  FINISH', 1024, 50);
    bctx.fillStyle = '#78bbb5';
    bctx.font = '700 34px Manrope, "Plus Jakarta Sans", system-ui, sans-serif';
    bctx.fillText('NOVA HOANG KART CIRCUIT', 300, 50);
    bctx.fillText('NOVAHOANGDEV.WEB.APP', 1748, 50);
  }
  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  bannerTex.anisotropy = 4;
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, toneMapped: false });
  [-1, 1].forEach((side) => {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(span, 0.42), bannerMat);
    banner.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    banner.position.set(side * 0.205, GROUND_Y + gantryH - 0.25, (legZ[0] + legZ[1]) / 2);
    gantry.add(banner);
  });
  startGroup.add(gantry);

  // --- Tyre wall in front of the fence (instanced: stacks of 3, alternating red / white) ---
  const tyreGeo = new THREE.TorusGeometry(0.3, 0.12, 8, 16);
  tyreGeo.rotateX(Math.PI / 2);
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const stackSpacing = 0.78;
  const stackCount = Math.floor((Math.PI * 2 * TYRE_WALL_R) / stackSpacing);
  const tyres = new THREE.InstancedMesh(tyreGeo, tyreMat, stackCount * 3);
  const tyreRed = new THREE.Color(0xc0262d);
  const tyreWhite = new THREE.Color(0xe5e7eb);
  const tyreBlack = new THREE.Color(0x1f2328);
  let ti = 0;
  for (let k = 0; k < stackCount; k++) {
    const a = (k / stackCount) * Math.PI * 2;
    const x = Math.cos(a) * TYRE_WALL_R;
    const z = Math.sin(a) * TYRE_WALL_R;
    for (let level = 0; level < 3; level++) {
      m4.makeTranslation(x, GROUND_Y + 0.12 + level * 0.24, z);
      tyres.setMatrixAt(ti, m4);
      // top tyre carries the colour band; lower ones are plain black rubber
      tyres.setColorAt(ti, level === 2 ? (Math.floor(k / 2) % 2 === 0 ? tyreRed : tyreWhite) : tyreBlack);
      ti++;
    }
  }
  tyres.castShadow = true;
  tyres.receiveShadow = true;
  islandGroup.add(tyres);

  islandGroup.userData.obstacles = obstacles;
  islandGroup.userData.wallRadius = TYRE_WALL_R - 0.45; // inner face of the tyre wall
  islandGroup.userData.track = { inner: TRACK_IN, outer: TRACK_OUT };

  return islandGroup;
}

// Low-poly stylized tree
export function createLowPolyTree(height: number = 3, foliageColor: number = 0x10b981): THREE.Group {
  const tree = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height * 0.4, 5);
  trunkGeo.translate(0, height * 0.2, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    flatShading: true,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage tier 1 (bottom)
  const fol1Geo = new THREE.ConeGeometry(height * 0.45, height * 0.5, 6);
  fol1Geo.translate(0, height * 0.45, 0);
  const folMat = new THREE.MeshStandardMaterial({
    color: foliageColor,
    flatShading: true,
    roughness: 0.7,
  });
  const fol1 = new THREE.Mesh(fol1Geo, folMat);
  fol1.castShadow = true;
  tree.add(fol1);

  // Foliage tier 2 (top)
  const fol2Geo = new THREE.ConeGeometry(height * 0.35, height * 0.45, 5);
  fol2Geo.translate(0, height * 0.7, 0);
  const fol2 = new THREE.Mesh(fol2Geo, folMat);
  fol2.castShadow = true;
  tree.add(fol2);

  return tree;
}

// Developer workstation model (Rich, interactive low-poly workspace with screens, lamp, PC, accessories)
export function createDeveloperDesk(): { group: THREE.Group; instance: WorkstationInstance } {
  const instance = createDetailedWorkstation();
  instance.group.userData.workstationController = instance;
  return { group: instance.group, instance };
}


// Interactive Project Showcase Pedestal with rotating artifact
export function createProjectPedestal(
  projectId: string,
  title: string,
  color: number = 0x06b6d4,
  shapeType: 'dodecahedron' | 'icosahedron' | 'octahedron' = 'dodecahedron'
): { group: THREE.Group; rotatingMesh: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = `pedestal-${projectId}`;
  group.userData = { isClickable: true, projectId, type: 'project' };

  // Pedestal base (octagonal stepped pillar)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    flatShading: true,
    roughness: 0.6,
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.3, 8), baseMat);
  pillar.position.y = 0.65;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Glowing energy ring on top of pillar
  const ringMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const energyRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 6, 8), ringMat);
  energyRing.rotation.x = Math.PI / 2;
  energyRing.position.y = 1.32;
  group.add(energyRing);

  // Floating rotating geometric artifact
  let artifactGeo: THREE.BufferGeometry;
  if (shapeType === 'dodecahedron') {
    artifactGeo = new THREE.DodecahedronGeometry(0.65, 0);
  } else if (shapeType === 'icosahedron') {
    artifactGeo = new THREE.IcosahedronGeometry(0.65, 0);
  } else {
    artifactGeo = new THREE.OctahedronGeometry(0.75, 0);
  }

  const artifactMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    flatShading: true,
    roughness: 0.2,
    metalness: 0.6,
  });
  const rotatingMesh = new THREE.Mesh(artifactGeo, artifactMat);
  rotatingMesh.position.y = 2.2;
  rotatingMesh.castShadow = true;
  rotatingMesh.userData = { isClickable: true, projectId, type: 'project' };
  group.add(rotatingMesh);

  // Wireframe halo around artifact
  const wireGeo = new THREE.WireframeGeometry(artifactGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  const wireLines = new THREE.LineSegments(wireGeo, wireMat);
  rotatingMesh.add(wireLines);

  return { group, rotatingMesh };
}

// Floating Skill Tech Crystal / Cube with glowing badge
export function createSkillCube(name: string, color: number, level: number): { group: THREE.Group; mesh: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = `skill-${name}`;
  group.userData = { isClickable: true, skillName: name, type: 'skill' };

  // Faceted skill diamond/cube
  const geo = new THREE.OctahedronGeometry(0.45, 0);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    flatShading: true,
    roughness: 0.3,
    metalness: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.userData = { isClickable: true, skillName: name, type: 'skill' };
  group.add(mesh);

  // Outer orbital ring
  const orbitGeo = new THREE.TorusGeometry(0.6, 0.02, 4, 12);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  mesh.add(orbit);

  return { group, mesh };
}

// Experience Timeline Monument / Tower
export function createTimelineTower(stepIndex: number, label: string, color: number = 0x3b82f6): THREE.Group {
  const tower = new THREE.Group();
  const height = 1.0 + stepIndex * 0.7;

  const colGeo = new THREE.CylinderGeometry(0.6, 0.75, height, 6);
  const colMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    flatShading: true,
    roughness: 0.7,
  });
  const col = new THREE.Mesh(colGeo, colMat);
  col.position.y = height / 2;
  col.castShadow = true;
  col.receiveShadow = true;
  tower.add(col);

  // Beacon sphere on top
  const sphereGeo = new THREE.IcosahedronGeometry(0.35, 0);
  const sphereMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.7,
    flatShading: true,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = height + 0.45;
  sphere.castShadow = true;
  tower.add(sphere);

  return tower;
}

// Contact Satellite Antenna / Beacon Tower
export function createContactBeacon(): { group: THREE.Group; dish: THREE.Mesh; ring: THREE.Mesh } {
  const group = new THREE.Group();
  group.userData = { isClickable: true, type: 'contact' };

  // Base platform
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, flatShading: true })
  );
  base.position.y = 0.25;
  group.add(base);

  // Lattice mast
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.3, 3.2, 5),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
  );
  mast.position.y = 2.0;
  mast.castShadow = true;
  group.add(mast);

  // Satellite dish
  const dishGeo = new THREE.ConeGeometry(1.0, 0.4, 8, 1, true);
  dishGeo.rotateX(Math.PI / 3);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    flatShading: true,
    side: THREE.DoubleSide,
    metalness: 0.5,
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 3.5, 0);
  dish.castShadow = true;
  group.add(dish);

  // Pulsing antenna beacon ring
  const ringGeo = new THREE.TorusGeometry(1.3, 0.04, 6, 12);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 3.8;
  group.add(ring);

  return { group, dish, ring };
}

// Continuous connecting pathway bridge between islands (eliminates gaps/cracks)
export function createSteppingStones(start: THREE.Vector3, end: THREE.Vector3, count: number = 5): THREE.Group {
  const group = new THREE.Group();

  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Main continuous bridge walkway beam
  const bridgeGeo = new THREE.BoxGeometry(1.3, 0.22, length);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    flatShading: true,
  });
  const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridgeMesh.position.copy(midPoint);
  bridgeMesh.position.y += 0.05;
  bridgeMesh.lookAt(end);
  bridgeMesh.castShadow = true;
  bridgeMesh.receiveShadow = true;
  group.add(bridgeMesh);

  // Top wooden boardwalk / stone decking planks along the bridge
  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.7,
    flatShading: true,
  });
  const plankCount = Math.floor(length / 0.7);
  for (let i = 0; i <= plankCount; i++) {
    const alpha = i / plankCount;
    const pos = new THREE.Vector3().lerpVectors(start, end, alpha);
    pos.y += 0.18;

    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.55), plankMat);
    plank.position.copy(pos);
    plank.lookAt(end);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // Glowing guide rails on the bridge sides
  const railGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 8);
  railGeo.rotateX(Math.PI / 2);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  });

  [-0.65, 0.65].forEach((rx) => {
    const rail = new THREE.Mesh(railGeo, railMat);
    const railPos = midPoint.clone();
    rail.position.copy(railPos);
    rail.position.y += 0.24;
    rail.lookAt(end);
    rail.translateX(rx);
    group.add(rail);
  });

  return group;
}
