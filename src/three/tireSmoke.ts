import * as THREE from 'three';

interface SmokeParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseSize: number;
  maxAlpha: number;
}

/**
 * High-performance, lightweight particle effect system that emits subtle, puffy smoke
 * particles from the rear tires when the vehicle is actively drifting.
 * Zero-allocation runtime with procedural soft-edge point sprites.
 */
export class TireSmokeSystem {
  public group: THREE.Group;
  private readonly maxParticles = 120;
  private particles: SmokeParticle[] = [];
  private headIndex = 0;

  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private pointsMesh: THREE.Points;

  private posArray: Float32Array;
  private sizeArray: Float32Array;
  private alphaArray: Float32Array;
  private posAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private alphaAttr: THREE.BufferAttribute;

  private spawnCooldown = 0;
  private hasActiveParticles = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'tire-drift-smoke';

    this.posArray = new Float32Array(this.maxParticles * 3);
    this.sizeArray = new Float32Array(this.maxParticles);
    this.alphaArray = new Float32Array(this.maxParticles);

    // Initialize all particles hidden below ground
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.6,
        baseSize: 0.18,
        maxAlpha: 0.4,
      });

      this.posArray[i * 3 + 0] = 0;
      this.posArray[i * 3 + 1] = -100;
      this.posArray[i * 3 + 2] = 0;
      this.sizeArray[i] = 0;
      this.alphaArray[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.posArray, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.sizeArray, 1);
    this.alphaAttr = new THREE.BufferAttribute(this.alphaArray, 1);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('size', this.sizeAttr);
    this.geometry.setAttribute('alpha', this.alphaAttr);

    // Custom point sprite shader with circular soft falloff
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        smokeColor: { value: new THREE.Color(0xdbeafe) }, // Light vapor gray with slight cyan tint
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;

        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Scale point size with camera distance for consistent 3D perspective
          gl_PointSize = size * (280.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 smokeColor;
        varying float vAlpha;

        void main() {
          if (vAlpha <= 0.005) discard;
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          // Puffy radial gradient falloff
          float radial = smoothstep(0.5, 0.08, dist);
          gl_FragColor = vec4(smokeColor, vAlpha * radial);
        }
      `,
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.frustumCulled = false;
    this.group.add(this.pointsMesh);
  }

  /**
   * Spawns smoke puffs from left and right tire contact locations while drifting.
   */
  public emit(
    leftContact: THREE.Vector3,
    rightContact: THREE.Vector3,
    forwardHeading: THREE.Vector3,
    delta: number
  ): void {
    this.spawnCooldown -= delta;
    if (this.spawnCooldown > 0) return;
    this.spawnCooldown = 0.032; // ~30 bursts per second for soft fluid smoke

    // Emit 1 particle from left tire and 1 from right tire
    this.spawnOne(leftContact, forwardHeading);
    this.spawnOne(rightContact, forwardHeading);
  }

  private spawnOne(contact: THREE.Vector3, forwardHeading: THREE.Vector3): void {
    const idx = this.headIndex;
    this.headIndex = (this.headIndex + 1) % this.maxParticles;

    const p = this.particles[idx];
    p.active = true;
    p.life = 0;
    p.maxLife = 0.48 + Math.random() * 0.24; // 0.48s - 0.72s duration
    p.baseSize = 0.16 + Math.random() * 0.10;
    p.maxAlpha = 0.32 + Math.random() * 0.14; // Subtle, non-intrusive smoke haze

    // Start slightly above tire ground contact with minor jitter
    p.x = contact.x + (Math.random() - 0.5) * 0.14;
    p.y = contact.y + 0.03 + Math.random() * 0.04;
    p.z = contact.z + (Math.random() - 0.5) * 0.14;

    // Upward rise + slight backward slip along heading + outward puff
    p.vx = (Math.random() - 0.5) * 0.40 - forwardHeading.x * 0.20;
    p.vy = 0.45 + Math.random() * 0.40;
    p.vz = (Math.random() - 0.5) * 0.40 - forwardHeading.z * 0.20;

    this.hasActiveParticles = true;
  }

  /**
   * Update particle positions, expansion, and smooth alpha fade.
   */
  public update(delta: number): void {
    if (!this.hasActiveParticles) return;

    let activeCount = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.y = -100;
        this.posArray[i * 3 + 1] = -100;
        this.alphaArray[i] = 0;
        continue;
      }

      activeCount++;
      const progress = p.life / p.maxLife; // 0 to 1

      // Motion dynamics
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // Gentle air resistance on upward drift
      p.vy *= Math.pow(0.92, delta * 60);

      // Expanding puff size
      const currentSize = p.baseSize * (1.0 + progress * 2.4);

      // Smooth entry fade-in and soft exit fade-out
      let alphaFade = 1.0;
      if (progress < 0.2) {
        alphaFade = progress / 0.2;
      } else {
        alphaFade = (1.0 - progress) / 0.8;
      }
      const currentAlpha = p.maxAlpha * Math.max(0, alphaFade);

      // Write to buffer
      this.posArray[i * 3 + 0] = p.x;
      this.posArray[i * 3 + 1] = p.y;
      this.posArray[i * 3 + 2] = p.z;
      this.sizeArray[i] = currentSize;
      this.alphaArray[i] = currentAlpha;
    }

    this.posAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;

    this.hasActiveParticles = activeCount > 0;
  }

  /**
   * Resets all particles (e.g. on vehicle reset).
   */
  public clear(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].active = false;
      this.particles[i].y = -100;
      this.posArray[i * 3 + 1] = -100;
      this.alphaArray[i] = 0;
      this.sizeArray[i] = 0;
    }
    this.posAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.hasActiveParticles = false;
  }

  /**
   * Clean up WebGL resources.
   */
  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
