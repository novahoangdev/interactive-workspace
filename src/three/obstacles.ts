import * as THREE from 'three';

// Static ground-level obstacles in island-local XZ space.
// Boxes are oriented by `yaw` (same convention as Object3D.rotation.y).
export type Obstacle = (
  | { kind: 'box'; cx: number; cz: number; hx: number; hz: number; yaw: number }
  | { kind: 'circle'; cx: number; cz: number; r: number }
) & {
  /** Optional top height (island-local y). Anything above it passes over (e.g. the jump ramp). */
  top?: number;
};

export interface ObstacleHit {
  nx: number; // push-out normal (points away from the obstacle)
  nz: number;
  depth: number; // penetration depth
}

/** Circle (x, z, r) against one obstacle. Returns null when not touching. */
export function circleVsObstacle(x: number, z: number, r: number, o: Obstacle): ObstacleHit | null {
  if (o.kind === 'circle') {
    const dx = x - o.cx;
    const dz = z - o.cz;
    const d = Math.hypot(dx, dz);
    const min = r + o.r;
    if (d >= min) return null;
    if (d < 1e-6) return { nx: 1, nz: 0, depth: min };
    return { nx: dx / d, nz: dz / d, depth: min - d };
  }

  const c = Math.cos(o.yaw);
  const s = Math.sin(o.yaw);
  const dx = x - o.cx;
  const dz = z - o.cz;
  // world -> box-local (rotate by -yaw)
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const qx = THREE.MathUtils.clamp(lx, -o.hx, o.hx);
  const qz = THREE.MathUtils.clamp(lz, -o.hz, o.hz);
  const ex = lx - qx;
  const ez = lz - qz;
  const d = Math.hypot(ex, ez);

  let nlx: number;
  let nlz: number;
  let depth: number;
  if (d > 1e-6) {
    if (d >= r) return null;
    nlx = ex / d;
    nlz = ez / d;
    depth = r - d;
  } else {
    // centre is inside the box: leave through the nearest face
    const px = o.hx - Math.abs(lx);
    const pz = o.hz - Math.abs(lz);
    if (px < pz) {
      nlx = Math.sign(lx) || 1;
      nlz = 0;
      depth = px + r;
    } else {
      nlx = 0;
      nlz = Math.sign(lz) || 1;
      depth = pz + r;
    }
  }
  // box-local -> world (rotate by +yaw)
  return { nx: nlx * c + nlz * s, nz: -nlx * s + nlz * c, depth };
}

/**
 * Oriented XZ footprint of an object, expressed in `space`'s local frame.
 * Measures the object un-rotated so the box hugs it, then re-applies its yaw.
 */
export function footprintOf(obj: THREE.Object3D, space: THREE.Object3D, shrink = 0.03): Obstacle {
  const yaw = obj.rotation.y;
  obj.rotation.y = 0;
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  obj.rotation.y = yaw;
  obj.updateMatrixWorld(true);

  space.updateMatrixWorld(true);
  const min = space.worldToLocal(box.min.clone());
  const max = space.worldToLocal(box.max.clone());
  const pivot = space.worldToLocal(obj.getWorldPosition(new THREE.Vector3()));

  const ox = (min.x + max.x) / 2 - pivot.x;
  const oz = (min.z + max.z) / 2 - pivot.z;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return {
    kind: 'box',
    cx: pivot.x + ox * c + oz * s,
    cz: pivot.z - ox * s + oz * c,
    hx: Math.max(0.05, Math.abs(max.x - min.x) / 2 - shrink),
    hz: Math.max(0.05, Math.abs(max.z - min.z) / 2 - shrink),
    yaw,
  };
}
