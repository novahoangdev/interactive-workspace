import * as THREE from 'three';

/**
 * High-performance, lightweight tire track system for drift skid marks.
 * Renders dual realistic rubber skid marks on the road surface behind the vehicle's
 * rear wheels with soft tread edges and procedural time-based fade out.
 */
export class TireTrackSystem {
  public group: THREE.Group;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;

  private readonly maxSegmentsPerWheel = 250;
  private readonly totalQuads = 500; // 250 left + 250 right
  private readonly trackWidth = 0.14; // Matches rear tire contact width
  private readonly minDistance = 0.10; // Minimum travel distance to create next quad
  private readonly maxDistance = 2.0; // Distance break limit to prevent map-crossing glitches
  private readonly fadeSpeed = 0.16; // Fades out over ~5.3 seconds

  private posArray: Float32Array;
  private alphaArray: Float32Array;
  private quadAlphas: Float32Array;
  private posAttr: THREE.BufferAttribute;
  private alphaAttr: THREE.BufferAttribute;

  private leftHead = 0;
  private rightHead = 0;
  private lastLeftPoint: THREE.Vector3 | null = null;
  private lastRightPoint: THREE.Vector3 | null = null;
  private hasActiveTracks = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'tire-tracks-system';

    const numVertices = this.totalQuads * 4;
    const numIndices = this.totalQuads * 6;

    this.posArray = new Float32Array(numVertices * 3);
    this.alphaArray = new Float32Array(numVertices);
    this.quadAlphas = new Float32Array(this.totalQuads);
    const uvArray = new Float32Array(numVertices * 2);
    const indexArray = new Uint16Array(numIndices);

    // Pre-populate static indices and UVs for all quads
    for (let i = 0; i < this.totalQuads; i++) {
      const v = i * 4;
      const idx = i * 6;

      // Quad triangle indices
      indexArray[idx + 0] = v + 0;
      indexArray[idx + 1] = v + 1;
      indexArray[idx + 2] = v + 2;
      indexArray[idx + 3] = v + 0;
      indexArray[idx + 4] = v + 2;
      indexArray[idx + 5] = v + 3;

      // Normalized quad UVs (U along length, V across width)
      uvArray[v * 2 + 0] = 0; uvArray[v * 2 + 1] = 0;
      uvArray[v * 2 + 2] = 0; uvArray[v * 2 + 3] = 1;
      uvArray[v * 2 + 4] = 1; uvArray[v * 2 + 5] = 1;
      uvArray[v * 2 + 6] = 1; uvArray[v * 2 + 7] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.posArray, 3);
    this.alphaAttr = new THREE.BufferAttribute(this.alphaArray, 1);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('alpha', this.alphaAttr);
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    this.geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    // Custom shader material for authentic rubber skid marks with soft edges and anti-Z-fighting
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide,
      uniforms: {
        baseColor: { value: new THREE.Color(0x0f172a) }, // Deep carbon techwear charcoal
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec2 vUv;
        void main() {
          vAlpha = alpha;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        varying float vAlpha;
        varying vec2 vUv;
        void main() {
          if (vAlpha <= 0.005) discard;
          // Soft tread edge profile across width
          float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
          float opacity = vAlpha * (0.68 + 0.32 * edge);
          gl_FragColor = vec4(baseColor, opacity);
        }
      `,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  /**
   * Called while the vehicle is actively drifting and touching the ground.
   * Adds new skid mark segments behind the left and right rear tires.
   */
  public addPoints(leftContact: THREE.Vector3, rightContact: THREE.Vector3): void {
    let changed = false;

    // 1. Process left rear wheel segment
    if (this.lastLeftPoint) {
      const dist = this.lastLeftPoint.distanceTo(leftContact);
      if (dist >= this.minDistance && dist <= this.maxDistance) {
        this.emitQuad(this.leftHead, this.lastLeftPoint, leftContact);
        this.leftHead = (this.leftHead + 1) % this.maxSegmentsPerWheel;
        this.lastLeftPoint.copy(leftContact);
        changed = true;
      } else if (dist > this.maxDistance) {
        this.lastLeftPoint.copy(leftContact);
      }
    } else {
      this.lastLeftPoint = leftContact.clone();
    }

    // 2. Process right rear wheel segment
    if (this.lastRightPoint) {
      const dist = this.lastRightPoint.distanceTo(rightContact);
      if (dist >= this.minDistance && dist <= this.maxDistance) {
        const quadIdx = this.maxSegmentsPerWheel + this.rightHead;
        this.emitQuad(quadIdx, this.lastRightPoint, rightContact);
        this.rightHead = (this.rightHead + 1) % this.maxSegmentsPerWheel;
        this.lastRightPoint.copy(rightContact);
        changed = true;
      } else if (dist > this.maxDistance) {
        this.lastRightPoint.copy(rightContact);
      }
    } else {
      this.lastRightPoint = rightContact.clone();
    }

    if (changed) {
      this.hasActiveTracks = true;
      this.posAttr.needsUpdate = true;
      this.alphaAttr.needsUpdate = true;
    }
  }

  /**
   * Helper to write a quad connecting previous wheel position to current position.
   */
  private emitQuad(quadIndex: number, prev: THREE.Vector3, curr: THREE.Vector3): void {
    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.0001) return;

    // Normal on horizontal plane (XZ)
    const ndx = dx / len;
    const ndz = dz / len;

    const halfW = this.trackWidth * 0.5;
    const px = -ndz * halfW;
    const pz = ndx * halfW;

    const vBase = quadIndex * 4;
    const pBase = vBase * 3;

    // Quad corners on the ground surface
    // P0: prev - perp
    this.posArray[pBase + 0] = prev.x - px;
    this.posArray[pBase + 1] = prev.y;
    this.posArray[pBase + 2] = prev.z - pz;

    // P1: prev + perp
    this.posArray[pBase + 3] = prev.x + px;
    this.posArray[pBase + 4] = prev.y;
    this.posArray[pBase + 5] = prev.z + pz;

    // P2: curr + perp
    this.posArray[pBase + 6] = curr.x + px;
    this.posArray[pBase + 7] = curr.y;
    this.posArray[pBase + 8] = curr.z + pz;

    // P3: curr - perp
    this.posArray[pBase + 9] = curr.x - px;
    this.posArray[pBase + 10] = curr.y;
    this.posArray[pBase + 11] = curr.z - pz;

    // Initialize full skid mark opacity
    const initialAlpha = 0.85;
    this.quadAlphas[quadIndex] = initialAlpha;
    this.alphaArray[vBase + 0] = initialAlpha;
    this.alphaArray[vBase + 1] = initialAlpha;
    this.alphaArray[vBase + 2] = initialAlpha;
    this.alphaArray[vBase + 3] = initialAlpha;
  }

  /**
   * Called when drift key is released or car becomes airborne.
   * Breaks the continuous ribbon so new drift streaks don't connect across the gap.
   */
  public endDrift(): void {
    this.lastLeftPoint = null;
    this.lastRightPoint = null;
  }

  /**
   * Tick function: gradually fades out older tire tracks over time.
   */
  public update(delta: number): void {
    if (!this.hasActiveTracks) return;

    let anyActive = false;
    const fadeDelta = delta * this.fadeSpeed;

    for (let i = 0; i < this.totalQuads; i++) {
      if (this.quadAlphas[i] > 0) {
        this.quadAlphas[i] = Math.max(0, this.quadAlphas[i] - fadeDelta);
        const a = this.quadAlphas[i];
        const vBase = i * 4;
        this.alphaArray[vBase + 0] = a;
        this.alphaArray[vBase + 1] = a;
        this.alphaArray[vBase + 2] = a;
        this.alphaArray[vBase + 3] = a;
        if (a > 0) {
          anyActive = true;
        }
      }
    }

    this.alphaAttr.needsUpdate = true;
    this.hasActiveTracks = anyActive;
  }

  /**
   * Immediately clears all skid marks (e.g. when car position is reset).
   */
  public clear(): void {
    this.endDrift();
    this.quadAlphas.fill(0);
    this.alphaArray.fill(0);
    this.alphaAttr.needsUpdate = true;
    this.hasActiveTracks = false;
  }

  /**
   * Clean up WebGL resources
   */
  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
