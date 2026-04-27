import { useStore } from '@/store/useStore';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Shape,
  Vector3,
} from 'three';

const isMobile =
  typeof navigator !== 'undefined' &&
  (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

// ============================================
// Seeded PRNG for deterministic placement
// ============================================
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = createRng(42);

// ============================================
// Placement utility
// Camera is at Z≈+9 looking toward Z≈0 and beyond into -Z.
// The desk opens toward -Z. Visible scenery is at -Z (behind desk).
// Angle 0 = straight -Z, spread ±100° to cover sides.
// ============================================
function visiblePos(minD: number, maxD: number): [number, number, number] {
  const angle = Math.PI + (rng() - 0.5) * Math.PI * 1.1; // ±100° centered on -Z
  const d = minD + rng() * (maxD - minD);
  return [Math.sin(angle) * d, 0, Math.cos(angle) * d];
}

// Pre-generated data - VISIBLE ARC ONLY
// Sur mobile on réduit le nombre de palmiers et de coquillages
const PALM_COUNT = isMobile ? 6 : 10;

interface PalmInfo {
  position: [number, number, number];
  scale: number;
  lean: number;
  leanDir: number;
}

// Generate palmiers balanced left & right
const PALMS: PalmInfo[] = Array.from({ length: PALM_COUNT }, (_, i) => {
  // Force alternating sides: even = left (-X), odd = right (+X)
  const side = i % 2 === 0 ? -1 : 1;
  const d = 10 + rng() * 14;
  const lateralSpread = 0.3 + rng() * 0.7; // how far to the side vs straight ahead
  const x = side * lateralSpread * d;
  const z = -(Math.sqrt(1 - lateralSpread * lateralSpread) * d + 2); // always -Z
  return {
    position: [x, 0, z] as [number, number, number],
    scale: 0.55 + rng() * 0.55,
    lean: 0.08 + rng() * 0.2,
    leanDir: rng() * Math.PI * 2,
  };
});

const SHELL_COLORS = ['#FFE4C4', '#FFF0E0', '#F5DEB3', '#FAEBD7', '#FFD1A4'];

interface ShellInfo {
  position: [number, number, number];
  scale: number;
  rotation: number;
  color: string;
}

const SHELLS: ShellInfo[] = Array.from({ length: 12 }, () => {
  const pos = visiblePos(6, 14);
  return {
    position: [pos[0], 0.015, pos[2]] as [number, number, number],
    scale: 0.03 + rng() * 0.06,
    rotation: rng() * Math.PI * 2,
    color: SHELL_COLORS[Math.floor(rng() * SHELL_COLORS.length)],
  };
});

interface IslandInfo {
  position: [number, number, number];
  radius: number;
  height: number;
  hasPalm: boolean;
}

// Islands far to the SIDES at -Z so they're visible
const ISLANDS: IslandInfo[] = [
  { position: [-55, 0, -20], radius: 3.5, height: 4, hasPalm: true },
  { position: [60, 0, -30], radius: 2.5, height: 3, hasPalm: true },
  { position: [-40, 0, -50], radius: 4, height: 5, hasPalm: true },
];

// Résolution de l'océan : réduite sur mobile pour économiser les calculs CPU par frame
const OCEAN_SEGMENTS = isMobile ? 24 : 48;

// ============================================
// OCEAN with per-frame vertex animation
// ============================================

function Ocean({ night }: { night: boolean }) {
  const geoRef = useRef<PlaneGeometry>(null);
  const baseRef = useRef<Float32Array | null>(null);
  const frameCount = useRef(0);

  useFrame(({ clock }) => {
    // Sur mobile on anime moins souvent (~15Hz au lieu de ~30Hz)
    frameCount.current++;
    const throttle = isMobile ? 4 : 2;
    if (frameCount.current % throttle !== 0) return;

    const geo = geoRef.current;
    if (!geo) return;
    if (!baseRef.current) {
      baseRef.current = new Float32Array(geo.attributes.position.array);
    }
    const positions = geo.attributes.position.array as Float32Array;
    const base = baseRef.current;
    const t = clock.elapsedTime;

    for (let i = 0; i < positions.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const dist = Math.sqrt(x * x + y * y);
      const fade = Math.min(1, Math.max(0, (dist - 20) * 0.06));
      positions[i + 2] =
        fade *
        (Math.sin(x * 0.04 + t * 0.5) * 0.3 +
          Math.cos(y * 0.05 + t * 0.35) * 0.2 +
          Math.sin((x + y) * 0.025 + t * 0.25) * 0.12);
    }
    geo.attributes.position.needsUpdate = true;
    // Recompute normals moins souvent sur mobile
    const normalThrottle = isMobile ? 16 : 8;
    if (frameCount.current % normalThrottle === 0) {
      geo.computeVertexNormals();
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
      <planeGeometry ref={geoRef} args={[300, 300, OCEAN_SEGMENTS, OCEAN_SEGMENTS]} />
      <meshStandardMaterial
        color={night ? '#081828' : '#0088cc'}
        roughness={night ? 0.5 : 0.2}
        metalness={0.15}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ============================================
// BEACH SAND (front half only - use semicircle)
// ============================================

function Beach({ night }: { night: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color={night ? '#2a2318' : '#f0deb0'} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <ringGeometry args={[19, 26, 64]} />
        <meshStandardMaterial
          color={night ? '#1e1c18' : '#c4a87c'}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <ringGeometry args={[21, 34, 64]} />
        <meshStandardMaterial
          color={night ? '#0a2838' : '#40E0D0'}
          transparent
          opacity={night ? 0.35 : 0.5}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
      {[10, 13, 16].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <ringGeometry args={[r - 0.06, r + 0.06, 64]} />
          <meshStandardMaterial color={night ? '#352e22' : '#e8d4a0'} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// PALM TREE (wind-animated)
// ============================================

function PalmTree({ data, night }: { data: PalmInfo; night: boolean }) {
  const trunk = night ? '#2A1F15' : '#8B6914';
  const leaf = night ? '#0A2A10' : '#228B22';
  const leafLight = night ? '#0C3012' : '#2EAD2E';

  const leanX = Math.sin(data.leanDir) * data.lean;
  const leanZ = Math.cos(data.leanDir) * data.lean;

  const upperTrunkRef = useRef<Group>(null);
  const crownRef = useRef<Group>(null);
  const frondRefs = useRef<Group[]>([]);
  const windPhase = data.position[0] * 0.5 + data.position[2] * 0.3;
  const palmFrameCount = useRef(0);

  useFrame(({ clock }) => {
    // Sur mobile, on anime les palmiers toutes les 3 frames (~20Hz) au lieu de chaque frame
    palmFrameCount.current++;
    if (isMobile && palmFrameCount.current % 3 !== 0) return;

    const t = clock.elapsedTime;
    if (upperTrunkRef.current) {
      upperTrunkRef.current.rotation.x = leanZ * 0.5 + Math.sin(t * 0.7 + windPhase) * 0.025;
      upperTrunkRef.current.rotation.z = -leanX * 0.5 + Math.cos(t * 0.5 + windPhase) * 0.02;
    }
    if (crownRef.current) {
      crownRef.current.rotation.x = Math.sin(t * 0.8 + windPhase) * 0.05;
      crownRef.current.rotation.z = Math.cos(t * 0.6 + windPhase) * 0.04;
    }
    for (let i = 0; i < frondRefs.current.length; i++) {
      const frond = frondRefs.current[i];
      if (!frond) continue;
      frond.rotation.z = Math.sin(t * 1.5 + windPhase + i * 1.1) * 0.06;
    }
  });

  return (
    <group position={data.position} scale={data.scale}>
      <group rotation={[leanZ, 0, -leanX]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 3, 6]} />
          <meshStandardMaterial color={trunk} flatShading roughness={0.9} />
        </mesh>
        <group ref={upperTrunkRef} position={[0, 3, 0]} rotation={[leanZ * 0.5, 0, -leanX * 0.5]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 2.2, 5]} />
            <meshStandardMaterial color={trunk} flatShading roughness={0.9} />
          </mesh>
          <group ref={crownRef} position={[0, 2.3, 0]}>
            <mesh position={[0.08, -0.15, 0.1]}>
              <sphereGeometry args={[0.07, 5, 5]} />
              <meshStandardMaterial color="#5C3A0A" flatShading />
            </mesh>
            <mesh position={[-0.06, -0.1, -0.08]}>
              <sphereGeometry args={[0.06, 5, 5]} />
              <meshStandardMaterial color="#5C3A0A" flatShading />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => {
              const angle = (i / 7) * Math.PI * 2;
              const col = i % 2 === 0 ? leaf : leafLight;
              const tilt = i % 2 === 0 ? 1.1 : 0.85;
              return (
                <group key={i} rotation={[0, angle, 0]}>
                  <group
                    ref={(el) => {
                      if (el) frondRefs.current[i] = el;
                    }}
                    rotation={[tilt, 0, 0]}
                  >
                    <mesh position={[0, 0.65, 0]}>
                      <boxGeometry args={[0.4, 1.3, 0.02]} />
                      <meshStandardMaterial color={col} flatShading side={DoubleSide} />
                    </mesh>
                    <group position={[0, 1.3, 0]} rotation={[0.4, 0, 0]}>
                      <mesh position={[0, 0.35, 0]}>
                        <boxGeometry args={[0.22, 0.7, 0.02]} />
                        <meshStandardMaterial color={col} flatShading side={DoubleSide} />
                      </mesh>
                    </group>
                  </group>
                </group>
              );
            })}
          </group>
        </group>
      </group>
    </group>
  );
}

function PalmTrees({ night }: { night: boolean }) {
  return (
    <group>
      {PALMS.map((p, i) => (
        <PalmTree key={i} data={p} night={night} />
      ))}
    </group>
  );
}

// ============================================
// SHELLS
// ============================================

function ShellElements({ night }: { night: boolean }) {
  return (
    <group>
      {SHELLS.map((s, i) => (
        <mesh key={i} position={s.position} rotation={[0, s.rotation, 0.15]} scale={s.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={night ? '#3a3530' : s.color}
            flatShading
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// DISTANT ISLANDS (front only)
// ============================================

function DistantIslands({ night }: { night: boolean }) {
  const sand = night ? '#2a2520' : '#f0deb0';
  const green = night ? '#0e1e10' : '#5a9e5a';

  return (
    <group>
      {ISLANDS.map((isl, i) => (
        <group key={i} position={isl.position}>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[isl.radius * 1.3, 1.5, 6]} />
            <meshStandardMaterial color={sand} flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, isl.height * 0.4, 0]}>
            <coneGeometry args={[isl.radius, isl.height, 6]} />
            <meshStandardMaterial color={green} flatShading roughness={0.85} />
          </mesh>
          {isl.hasPalm && (
            <group position={[0, isl.height * 0.7, 0]} scale={0.4}>
              <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.05, 0.1, 2, 5]} />
                <meshStandardMaterial color="#8B6914" flatShading />
              </mesh>
              {[0, 1.2, 2.4, 3.6, 5].map((a, j) => (
                <group key={j} position={[0, 2.2, 0]} rotation={[0.7, a, 0]}>
                  <mesh position={[0, 0, 0.5]} rotation={[0.4, 0, 0]}>
                    <boxGeometry args={[0.06, 0.015, 1]} />
                    <meshStandardMaterial color="#228B22" flatShading side={DoubleSide} />
                  </mesh>
                </group>
              ))}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

// ============================================
// FOAM (at water edge)
// ============================================

function Foam({ night }: { night: boolean }) {
  const ref = useRef<Group>(null);
  const foamFrameCount = useRef(0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Throttle mousse sur mobile
    foamFrameCount.current++;
    if (isMobile && foamFrameCount.current % 3 !== 0) return;

    const t = clock.elapsedTime;
    ref.current.children.forEach((mesh, i) => {
      const phase = (i / 3) * Math.PI * 2;
      const wave = Math.sin(t * 0.5 + phase) * 0.5 + 0.5;
      ((mesh as Mesh).material as MeshStandardMaterial).opacity = wave * (night ? 0.12 : 0.45);
    });
  });

  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 + i * 0.004, 0]}>
          <ringGeometry args={[20.3 + i * 1.4, 20.8 + i * 1.4, 64]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.4}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// SAILBOAT - elegant schooner drifting across the horizon
// ============================================

function Sailboat({ night }: { night: boolean }) {
  const ref = useRef<Group>(null);
  const flagRef = useRef<Mesh>(null);
  const mainSailRef = useRef<Mesh>(null);
  const jibSailRef = useRef<Mesh>(null);
  const boatFrameCount = useRef(0);

  // Custom hull - smaller bevel for clean shape
  const hullGeo = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.35, 0.3);
    shape.lineTo(-0.38, 0.1);
    shape.quadraticCurveTo(-0.32, -0.15, 0, -0.2);
    shape.quadraticCurveTo(0.32, -0.15, 0.38, 0.1);
    shape.lineTo(0.35, 0.3);
    shape.lineTo(-0.35, 0.3);
    const geo = new ExtrudeGeometry(shape, {
      steps: 5,
      depth: 3.6,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.15,
      bevelOffset: 0,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, []);

  // Main sail - curved plane (wind belly)
  const mainSailGeo = useMemo(() => {
    const geo = new PlaneGeometry(1.6, 2.8, 8, 12);
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const u = (pos[i] + 0.8) / 1.6;
      const v = (pos[i + 1] + 1.4) / 2.8;
      pos[i + 2] = Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.85) * 0.25;
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Jib sail - triangular curved shape
  const jibSailGeo = useMemo(() => {
    const geo = new BufferGeometry();
    const segsU = 6;
    const segsV = 10;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let j = 0; j <= segsV; j++) {
      const v = j / segsV;
      const width = (1 - v) * 1.0;
      for (let i = 0; i <= segsU; i++) {
        const u = i / segsU;
        const x = (u - 0.5) * width;
        const y = v * 2.4;
        const belly = Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.7) * 0.18 * (1 - v * 0.5);
        vertices.push(x, y, belly);
      }
    }
    for (let j = 0; j < segsV; j++) {
      for (let i = 0; i < segsU; i++) {
        const a = j * (segsU + 1) + i;
        const b = a + 1;
        const c = a + segsU + 1;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Flag geometry
  const flagGeo = useMemo(() => {
    return new PlaneGeometry(0.5, 0.25, 8, 2);
  }, []);

  // Rigging line helper - compute position/rotation/length from two 3D points
  const riggingLine = (
    from: [number, number, number],
    to: [number, number, number],
    radius = 0.006
  ) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const midX = (from[0] + to[0]) / 2;
    const midY = (from[1] + to[1]) / 2;
    const midZ = (from[2] + to[2]) / 2;
    // Cylinder is along Y by default; we need to orient it from->to
    const dir = new Vector3(dx, dy, dz).normalize();
    const up = new Vector3(0, 1, 0);
    const quat = new Quaternion().setFromUnitVectors(up, dir);
    const euler = new Euler().setFromQuaternion(quat);
    return { position: [midX, midY, midZ] as const, rotation: euler, length, radius };
  };

  useFrame(({ clock }) => {
    if (!ref.current) return;
    boatFrameCount.current++;
    const t = clock.elapsedTime;

    // Drift right to left (toujours exécuté pour la position)
    const x = 55 - ((t * 0.8) % 110);
    ref.current.position.x = x;

    // Sur mobile, on throttle les animations secondaires du bateau
    if (isMobile && boatFrameCount.current % 3 !== 0) return;

    // Ocean rocking - reduced heave so it doesn't float above water
    ref.current.position.y = -0.3 + Math.sin(t * 0.6) * 0.08 + Math.sin(t * 1.1) * 0.03;
    ref.current.rotation.z = Math.sin(t * 0.4) * 0.03 + Math.sin(t * 0.9) * 0.01;
    ref.current.rotation.x = Math.sin(t * 0.5 + 0.5) * 0.015;

    // Animate flag (skip sur mobile)
    if (!isMobile && flagRef.current) {
      const flagPos = flagRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < flagPos.length; i += 3) {
        const u = (flagPos[i] + 0.25) / 0.5;
        flagPos[i + 2] = Math.sin(u * Math.PI * 2 + t * 5) * 0.03 * u;
      }
      flagRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Subtle sail flutter
    if (mainSailRef.current) {
      mainSailRef.current.rotation.y = Math.sin(t * 0.3) * 0.02;
    }
    if (jibSailRef.current) {
      jibSailRef.current.rotation.y = Math.sin(t * 0.35 + 1) * 0.03;
    }
  });

  const hullDark = night ? '#1a1520' : '#5C2E0A';
  const hullLight = night ? '#221a28' : '#8B5A2B';
  const deckCol = night ? '#1a1818' : '#D2B48C';
  const sailCol = night ? '#2a2a40' : '#FFFEF0';
  const sailAccent = night ? '#222238' : '#F0E8D0';
  const mastCol = night ? '#1a1510' : '#4A3000';
  const cabinCol = night ? '#181215' : '#6B3510';
  const cabinRoof = night ? '#121018' : '#4A2508';
  const metalCol = night ? '#222228' : '#C0A060';
  const flagCol = night ? '#1a1028' : '#CC2200';
  const riggingCol = night ? '#1a1a18' : '#3A3020';
  const wakeOpacity = night ? 0.06 : 0.25;

  // Rigging geometry - from/to points
  const mastTop: [number, number, number] = [0.2, 4.2, 0];
  const mastSpread: [number, number, number] = [0.2, 2.8, 0];
  const hullPortAft: [number, number, number] = [-0.8, 0.3, 0.35];
  const hullStarAft: [number, number, number] = [-0.8, 0.3, -0.35];
  const hullPortFwd: [number, number, number] = [0.8, 0.3, 0.35];
  const hullStarFwd: [number, number, number] = [0.8, 0.3, -0.35];
  const bowspritTip: [number, number, number] = [2.3, 0.45, 0];

  const shroud1 = riggingLine(hullPortAft, mastSpread);
  const shroud2 = riggingLine(hullStarAft, mastSpread);
  const shroud3 = riggingLine(hullPortFwd, mastSpread);
  const shroud4 = riggingLine(hullStarFwd, mastSpread);
  const forestay = riggingLine(bowspritTip, mastTop, 0.005);

  return (
    <group ref={ref} position={[40, -0.3, -35]} rotation={[0, Math.PI + 0.3, 0]}>
      {/* === HULL === */}
      <mesh geometry={hullGeo} position={[0, 0.05, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <meshStandardMaterial color={hullDark} flatShading roughness={0.75} />
      </mesh>

      {/* Hull stripe / waterline accent */}
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.62, 0.04, 3.6]} />
        <meshStandardMaterial color={hullLight} roughness={0.6} />
      </mesh>

      {/* Keel */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[2.2, 0.08, 0.04]} />
        <meshStandardMaterial color={hullDark} flatShading />
      </mesh>

      {/* === DECK === */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 0.6]} />
        <meshStandardMaterial color={deckCol} roughness={0.9} side={DoubleSide} />
      </mesh>

      {/* Deck planking lines */}
      {[-0.15, 0, 0.15].map((z, i) => (
        <mesh key={i} position={[0, 0.325, z]}>
          <boxGeometry args={[3.0, 0.004, 0.008]} />
          <meshStandardMaterial color={night ? '#151212' : '#B89968'} />
        </mesh>
      ))}

      {/* === CABIN / DECKHOUSE (compact) === */}
      <group position={[-0.4, 0.32, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.8, 0.3, 0.4]} />
          <meshStandardMaterial color={cabinCol} flatShading roughness={0.8} />
        </mesh>
        {/* Cabin roof */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.85, 0.04, 0.44]} />
          <meshStandardMaterial color={cabinRoof} flatShading roughness={0.7} />
        </mesh>
        {/* Windows - port & starboard */}
        {[-0.2, 0.1].map((x, i) => (
          <group key={`w${i}`}>
            <mesh position={[x, 0.16, 0.205]}>
              <boxGeometry args={[0.1, 0.08, 0.02]} />
              <meshStandardMaterial
                color={night ? '#1a2a4a' : '#87CEEB'}
                emissive={night ? '#0a1525' : '#000000'}
                emissiveIntensity={night ? 0.3 : 0}
                roughness={0.1}
                metalness={0.3}
              />
            </mesh>
            <mesh position={[x, 0.16, -0.205]}>
              <boxGeometry args={[0.1, 0.08, 0.02]} />
              <meshStandardMaterial
                color={night ? '#1a2a4a' : '#87CEEB'}
                emissive={night ? '#0a1525' : '#000000'}
                emissiveIntensity={night ? 0.3 : 0}
                roughness={0.1}
                metalness={0.3}
              />
            </mesh>
          </group>
        ))}
        {/* Cabin door */}
        <mesh position={[0.41, 0.12, 0]}>
          <boxGeometry args={[0.02, 0.24, 0.14]} />
          <meshStandardMaterial color={night ? '#0a0808' : '#3A1A00'} roughness={0.9} />
        </mesh>
      </group>

      {/* === MAIN MAST === */}
      <mesh position={[0.2, 2.3, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 3.8, 6]} />
        <meshStandardMaterial color={mastCol} flatShading roughness={0.85} />
      </mesh>

      {/* Mast top cap */}
      <mesh position={[0.2, 4.25, 0]}>
        <sphereGeometry args={[0.05, 5, 5]} />
        <meshStandardMaterial color={metalCol} flatShading metalness={0.5} />
      </mesh>

      {/* === BOOM (horizontal spar) === */}
      <mesh position={[-0.5, 0.85, 0]} rotation={[0, 0, Math.PI / 2 + 0.06]}>
        <cylinderGeometry args={[0.02, 0.025, 1.6, 5]} />
        <meshStandardMaterial color={mastCol} flatShading />
      </mesh>

      {/* === GAFF (upper spar) === */}
      <mesh position={[-0.3, 3.4, 0]} rotation={[0, 0, Math.PI / 2 + 0.18]}>
        <cylinderGeometry args={[0.015, 0.02, 1.2, 5]} />
        <meshStandardMaterial color={mastCol} flatShading />
      </mesh>

      {/* === SPREADERS === */}
      <mesh position={[0.2, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.7, 4]} />
        <meshStandardMaterial color={mastCol} flatShading />
      </mesh>

      {/* === MAIN SAIL - curved === */}
      <mesh
        ref={mainSailRef}
        geometry={mainSailGeo}
        position={[0.2, 2.3, 0]}
        rotation={[0, 0.05, 0.04]}
      >
        <meshStandardMaterial
          color={sailCol}
          flatShading
          side={DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Sail battens */}
      {[0.6, 0, -0.6].map((y, i) => (
        <mesh key={`b${i}`} position={[0.2, 2.3 + y, 0.08]}>
          <boxGeometry args={[0.008, 0.012, 1.2]} />
          <meshStandardMaterial color={sailAccent} />
        </mesh>
      ))}

      {/* === FOREMAST (shorter) === */}
      <mesh position={[1.2, 1.3, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1.8, 5]} />
        <meshStandardMaterial color={mastCol} flatShading roughness={0.85} />
      </mesh>

      {/* === BOWSPRIT === */}
      <mesh position={[2.0, 0.45, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.015, 0.025, 1.0, 5]} />
        <meshStandardMaterial color={mastCol} flatShading />
      </mesh>

      {/* === JIB SAIL === */}
      <mesh
        ref={jibSailRef}
        geometry={jibSailGeo}
        position={[1.4, 0.55, 0]}
        rotation={[0, 0.06, 0.1]}
      >
        <meshStandardMaterial
          color={sailCol}
          flatShading
          side={DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* === RIGGING - properly computed from point-to-point === */}
      {[shroud1, shroud2, shroud3, shroud4, forestay].map((line, i) => (
        <mesh
          key={`rig${i}`}
          position={[line.position[0], line.position[1], line.position[2]]}
          rotation={line.rotation}
        >
          <cylinderGeometry args={[line.radius, line.radius, line.length, 3]} />
          <meshStandardMaterial color={riggingCol} />
        </mesh>
      ))}

      {/* === FLAG at masthead === */}
      <mesh ref={flagRef} geometry={flagGeo} position={[0.45, 4.35, 0]}>
        <meshStandardMaterial color={flagCol} side={DoubleSide} />
      </mesh>

      {/* === RAILING POSTS === */}
      {[-1.2, -0.6, 0.2, 0.8, 1.3].map((x, i) => (
        <group key={`rail${i}`}>
          <mesh position={[x, 0.42, 0.28]}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
            <meshStandardMaterial color={metalCol} metalness={0.4} />
          </mesh>
          <mesh position={[x, 0.42, -0.28]}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
            <meshStandardMaterial color={metalCol} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Railing wires */}
      {[0.28, -0.28].map((z, i) => (
        <mesh key={`rw${i}`} position={[0, 0.5, z]}>
          <boxGeometry args={[2.8, 0.006, 0.006]} />
          <meshStandardMaterial color={metalCol} metalness={0.4} />
        </mesh>
      ))}

      {/* === RUDDER === */}
      <mesh position={[-1.7, -0.08, 0]}>
        <boxGeometry args={[0.04, 0.35, 0.18]} />
        <meshStandardMaterial color={hullDark} flatShading />
      </mesh>

      {/* Tiller */}
      <mesh position={[-1.3, 0.38, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 4]} />
        <meshStandardMaterial color={mastCol} />
      </mesh>

      {/* === STERN LANTERN === */}
      <mesh position={[-1.65, 0.48, 0]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshStandardMaterial
          color={night ? '#FFaa44' : '#886622'}
          emissive={night ? '#FF8800' : '#000000'}
          emissiveIntensity={night ? 0.8 : 0}
        />
      </mesh>

      {/* === WAKE === */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`wake${i}`}
          position={[-2.2 - i * 1.0, -0.06 - i * 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.4 - i * 0.3, 0.3 + i * 0.12]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={wakeOpacity * (1 - i * 0.3)}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Bow wave */}
      {[-1, 1].map((side) => (
        <mesh
          key={`bow${side}`}
          position={[1.9, -0.03, side * 0.25]}
          rotation={[-Math.PI / 2, 0, side * 0.45]}
        >
          <planeGeometry args={[0.6, 0.1]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={wakeOpacity * 0.6}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// BEACH UMBRELLA - decorative, on the sand
// ============================================

function BeachUmbrella({ night }: { night: boolean }) {
  const canopyCol = night ? '#2a1a2a' : '#FF6B6B';
  const canopyCol2 = night ? '#1a1a2a' : '#FFFFFF';
  const pole = night ? '#2a2a20' : '#C0C0C0';

  return (
    <group position={[-12, 0, -8]} rotation={[0, -0.5, 0.08]}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 5]} />
        <meshStandardMaterial color={pole} />
      </mesh>
      {/* Canopy - octagonal cone */}
      <mesh position={[0, 2.9, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.8, 0.6, 8]} />
        <meshStandardMaterial color={canopyCol} flatShading side={DoubleSide} />
      </mesh>
      {/* Canopy stripe ring */}
      <mesh position={[0, 2.75, 0]}>
        <torusGeometry args={[1.2, 0.06, 3, 8]} />
        <meshStandardMaterial color={canopyCol2} flatShading />
      </mesh>
      {/* Towel underneath */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[0.3, 0.01, 0.2]}>
        <planeGeometry args={[2, 1.2]} />
        <meshStandardMaterial
          color={night ? '#1a1a2a' : '#4FC3F7'}
          side={DoubleSide}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export function EnvironmentBackground() {
  const mainLightsOn = useStore((s) => s.mainLightsOn);
  const night = !mainLightsOn;

  return (
    <group>
      <Ocean night={night} />
      <Beach night={night} />
      <Foam night={night} />
      <PalmTrees night={night} />
      <ShellElements night={night} />
      <DistantIslands night={night} />
      <Sailboat night={night} />
      <BeachUmbrella night={night} />

      <hemisphereLight
        intensity={night ? 0.15 : 0.6}
        color={night ? '#1a2040' : '#87CEEB'}
        groundColor={night ? '#0a0a15' : '#f5deb3'}
      />
    </group>
  );
}
