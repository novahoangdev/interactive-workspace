import * as THREE from 'three';

/**
 * Creates a sleek modern RGB Studio Ambient Light Column (Trụ đèn LED Ambient Cyberpunk)
 * Replaces the out-of-place outdoor pine trees with sophisticated indoor studio lighting.
 */
export function createRgbStudioColumn(height: number = 2.2, colorHex: number = 0x06b6d4): THREE.Group {
  const column = new THREE.Group();

  // Heavy weighted minimalist circular base
  const baseGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.08, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.2,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.04;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  column.add(baseMesh);

  // Black anodized spine / aluminum profile
  const spineGeo = new THREE.BoxGeometry(0.06, height, 0.06);
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.3,
  });
  const spineMesh = new THREE.Mesh(spineGeo, spineMat);
  spineMesh.position.set(0, height / 2 + 0.08, -0.02);
  spineMesh.castShadow = true;
  column.add(spineMesh);

  // Frosted acrylic LED light strip bar
  const lightBarGeo = new THREE.BoxGeometry(0.04, height * 0.9, 0.04);
  const lightBarMat = new THREE.MeshBasicMaterial({
    color: colorHex,
  });
  const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
  lightBar.position.set(0, height / 2 + 0.08, 0.02);
  column.add(lightBar);

  // Point light casting ambient room illumination from the column
  const pLight = new THREE.PointLight(colorHex, 0.9, 6.0);
  pLight.position.set(0, height * 0.6, 0.15);
  column.add(pLight);

  // Top cap with floating neon ring
  const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
  const cap = new THREE.Mesh(capGeo, baseMat);
  cap.position.set(0, height + 0.08, 0);
  column.add(cap);

  const ringGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, height + 0.1, 0);
  column.add(ring);

  return column;
}
