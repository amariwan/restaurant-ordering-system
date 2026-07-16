'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, type ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Table as TableType, Wall as WallType } from '@/features/restaurant/api/types';

const WORLD_W = 10;
const WORLD_H = 7.5;

function toWorld(nx: number, ny: number): [number, number] {
  return [nx * WORLD_W, (1 - ny) * WORLD_H];
}

function toNorm(wx: number, wz: number): [number, number] {
  return [wx / WORLD_W, 1 - wz / WORLD_H];
}

function pxToWorld(px: number): number {
  return (px / 72) * 0.5;
}

const STATUS_COLORS: Record<string, string> = {
  free: '#22c55e',
  occupied: '#ef4444',
  reserved: '#f59e0b',
};

// ---- Ground plane for empty-space interaction ----

function GroundPlane({ drawWallMode, wallStart, onWallDrawStart, onWallDrawEnd, onCanvasClick }: {
  drawWallMode: boolean;
  wallStart: { x: number; y: number } | null;
  onWallDrawStart: (nx: number, ny: number) => void;
  onWallDrawEnd: (nx: number, ny: number) => void;
  onCanvasClick: (nx: number, ny: number) => void;
}) {
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const [nx, ny] = toNorm(e.point.x, e.point.z);
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    if (drawWallMode) {
      if (!wallStart) {
        onWallDrawStart(nx, ny);
      } else {
        onWallDrawEnd(nx, ny);
      }
    } else {
      onCanvasClick(nx, ny);
    }
  }, [drawWallMode, wallStart, onWallDrawStart, onWallDrawEnd, onCanvasClick]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[WORLD_W / 2, -0.005, WORLD_H / 2]}
      onPointerDown={handlePointerDown}
    >
      <planeGeometry args={[WORLD_W, WORLD_H]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---- Background plane ----

function BackgroundPlane({ url }: { url?: string | null }) {
  const textureRef = useRef<THREE.Texture | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url) { setLoaded(false); return; }
    setLoaded(false);
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      textureRef.current = tex;
      tex.colorSpace = THREE.SRGBColorSpace;
      setLoaded(true);
    });
  }, [url]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WORLD_W / 2, -0.01, WORLD_H / 2]}>
      <planeGeometry args={[WORLD_W, WORLD_H]} />
      <meshBasicMaterial
        color={loaded ? 'white' : '#111827'}
        map={loaded ? textureRef.current : undefined}
        transparent
        opacity={loaded ? 0.35 : 1}
        toneMapped={false}
      />
    </mesh>
  );
}

// ---- Grid ----

function SceneGrid({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <gridHelper
      args={[WORLD_W, 20, '#444', '#333']}
      position={[WORLD_W / 2, 0.001, WORLD_H / 2]}
    />
  );
}

// ---- Wall line ----

function SceneWall({ wall, drawWallMode, onClick }: {
  wall: WallType;
  drawWallMode: boolean;
  onClick: () => void;
}) {
  const sx = wall.startX * WORLD_W;
  const sy = (1 - wall.startY) * WORLD_H;
  const ex = wall.endX * WORLD_W;
  const ey = (1 - wall.endY) * WORLD_H;
  const color = wall.colorHex || '#ffffff';

  const points = useMemo(() => [
    new THREE.Vector3(sx, 0.02, sy),
    new THREE.Vector3(ex, 0.02, ey),
  ], [sx, sy, ex, ey]);

  return (
    <group
      onClick={(e) => { e.stopPropagation(); if (!drawWallMode) onClick(); }}
    >
      <Line points={points} color={color} lineWidth={1} transparent opacity={0.7} />
      <Line points={points} color={color} lineWidth={8} transparent opacity={0.01} />
    </group>
  );
}

// ---- Wall preview while drawing ----

function DrawWallPreview({ start, end }: { start: { x: number; y: number }; end: { x: number; y: number } }) {
  const sx = start.x * WORLD_W;
  const sy = (1 - start.y) * WORLD_H;
  const ex = end.x * WORLD_W;
  const ey = (1 - end.y) * WORLD_H;

  const points = useMemo(() => [
    new THREE.Vector3(sx, 0.05, sy),
    new THREE.Vector3(ex, 0.05, ey),
  ], [sx, sy, ex, ey]);

  return (
    <Line
      points={points}
      color='#ffffff'
      lineWidth={1}
      dashed
      dashSize={0.1}
      gapSize={0.05}
      transparent
      opacity={0.5}
    />
  );
}

// ---- Table mesh ----

function TableMesh({ table, isSelected, isHovered, drawWallMode, onClick, onDoubleClick, onDragEnd, onHover }: {
  table: TableType;
  isSelected: boolean;
  isHovered: boolean;
  drawWallMode: boolean;
  onClick: (shiftKey: boolean) => void;
  onDoubleClick: () => void;
  onDragEnd: (id: number, nx: number, ny: number) => void;
  onHover: (id: number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dragRef = useRef({ dragging: false, startWX: 0, startWZ: 0, startNX: 0, startNY: 0 });
  const [previewPos, setPreviewPos] = useState<[number, number] | null>(null);
  const lastClickTime = useRef(0);

  const basePos = useMemo(() => toWorld(table.posX, table.posY), [table.posX, table.posY]);
  const displayPos = previewPos ?? basePos;
  const [px, pz] = displayPos;

  const color = table.colorHex || STATUS_COLORS[table.status] || '#22c55e';
  const wScale = table.width && table.width !== 72 ? table.width / 72 : 1;
  const hScale = table.height && table.height !== 72 ? table.height / 72 : 1;
  const r = pxToWorld(72) * wScale * 0.5;
  const bw = pxToWorld(72) * wScale;
  const bh = pxToWorld(72) * hScale;

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (drawWallMode) return;
    e.stopPropagation();
    dragRef.current = {
      dragging: true,
      startWX: e.point.x,
      startWZ: e.point.z,
      startNX: table.posX,
      startNY: table.posY,
    };
  }, [drawWallMode, table.posX, table.posY]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current.dragging || drawWallMode) return;
    e.stopPropagation();
    const dx = (e.point.x - dragRef.current.startWX) / WORLD_W;
    const dz = -(e.point.z - dragRef.current.startWZ) / WORLD_H;
    const nx = Math.min(1, Math.max(0, +(dragRef.current.startNX + dx).toFixed(2)));
    const ny = Math.min(1, Math.max(0, +(dragRef.current.startNY + dz).toFixed(2)));
    setPreviewPos(toWorld(nx, ny));
  }, [drawWallMode]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const dx = (e.point.x - dragRef.current.startWX) / WORLD_W;
    const dz = -(e.point.z - dragRef.current.startWZ) / WORLD_H;
    if (Math.abs(dx) > 0.005 || Math.abs(dz) > 0.005) {
      const nx = Math.min(1, Math.max(0, +(dragRef.current.startNX + dx).toFixed(2)));
      const ny = Math.min(1, Math.max(0, +(dragRef.current.startNY + dz).toFixed(2)));
      onDragEnd(table.id, nx, ny);
    }
    setPreviewPos(null);
  }, [table.id, onDragEnd]);

  const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (dragRef.current.dragging) return;
    const now = Date.now();
    if (now - lastClickTime.current < 400) {
      onDoubleClick();
      lastClickTime.current = 0;
      return;
    }
    lastClickTime.current = now;
    setTimeout(() => {
      if (lastClickTime.current === now) {
        onClick(e.nativeEvent.shiftKey);
      }
    }, 300);
  }, [onClick, onDoubleClick]);

  const polePosition = useMemo<[number, number, number]>(() => [px, -0.02, pz], [px, pz]);
  const statusDotPos = useMemo<[number, number, number]>(() => [px + r - 0.04, 0.12, pz - r + 0.04], [px, pz, r]);
  const hoverPos = useMemo<[number, number, number]>(() => [px, 0.4, pz], [px, pz]);

  const geometry = useMemo(() => {
    switch (table.shape) {
      case 'Circle':
        return <cylinderGeometry args={[r, r, 0.15, 24]} />;
      case 'Oval':
        return <cylinderGeometry args={[r, r, 0.15, 24]} />;
      default:
        return <boxGeometry args={[bw, 0.15, bh]} />;
    }
  }, [table.shape, r, bw, bh]);

  const rimGeom = useMemo(() => <cylinderGeometry args={[r + 0.02, r + 0.02, 0.15, 24]} />, [r]);

  return (
    <group>
      {isSelected && (
        <mesh position={polePosition}>
          <ringGeometry args={[Math.max(bw, bh) * 0.5 + 0.08, Math.max(bw, bh) * 0.5 + 0.12, 32]} />
          <meshBasicMaterial color='#fbbf24' transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh
        ref={meshRef}
        position={[px, 0.08, pz]}
        rotation={[0, THREE.MathUtils.degToRad(table.rotation), 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); onHover(table.id); }}
        onPointerOut={() => onHover(null)}
        castShadow
      >
        {geometry}
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {(table.shape === 'Circle' || table.shape === 'Oval') && (
        <mesh position={[px, 0.08, pz]}>
          {rimGeom}
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}
      <Text position={[px, 0.25, pz]} fontSize={0.12} color='white' anchorX='center' anchorY='middle'
        outlineWidth={0.01} outlineColor='black'>
        {`${table.number}`}
      </Text>
      <Text position={[px, 0.12, pz]} fontSize={0.06} color='rgba(255,255,255,0.7)' anchorX='center' anchorY='middle'
        outlineWidth={0.005} outlineColor='black'>
        {`${table.capacity}p`}
      </Text>
      {(table.shape === 'Circle' || table.shape === 'Oval') && (
        <mesh position={statusDotPos}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={STATUS_COLORS[table.status] || '#666'} />
        </mesh>
      )}
      {isHovered && table.description && (
        <Html position={hoverPos} center>
          <div className='rounded-lg bg-foreground px-2.5 py-1.5 text-[10px] text-background shadow-lg whitespace-nowrap'>
            {table.description}
          </div>
        </Html>
      )}
    </group>
  );
}

// ---- Area label ----

function SceneAreaLabel({ name, nx, ny }: { name: string; nx: number; ny: number }) {
  const [wx, wz] = toWorld(nx, ny);
  return (
    <Text position={[wx, 0.5, wz]} fontSize={0.12} color='#888' anchorX='center' anchorY='middle'>
      {name}
    </Text>
  );
}

// ---- Camera fitter for aspect ratio ----

function CameraFitter() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const oc = camera as THREE.OrthographicCamera;
    const w = gl.domElement.clientWidth;
    const h = gl.domElement.clientHeight;
    if (w === 0 || h === 0) return;
    const aspect = w / h;
    const worldAspect = WORLD_W / WORLD_H;

    if (aspect > worldAspect) {
      oc.left = -((aspect * WORLD_H) - WORLD_W) / 2;
      oc.right = WORLD_W + ((aspect * WORLD_H) - WORLD_W) / 2;
      oc.top = WORLD_H;
      oc.bottom = 0;
    } else {
      oc.left = 0;
      oc.right = WORLD_W;
      const extra = (WORLD_W / aspect - WORLD_H) / 2;
      oc.top = WORLD_H + extra;
      oc.bottom = -extra;
    }
    oc.updateProjectionMatrix();
  }, [camera, gl]);

  return null;
}

// ---- Wall draw move tracker ----

function WallMoveTracker({ onMove }: { onMove: (nx: number, ny: number) => void }) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      raycaster.current.ray.intersectPlane(plane.current, intersection.current);
      const [nx, ny] = toNorm(intersection.current.x, intersection.current.z);
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        onMove(nx, ny);
      }
    };
    gl.domElement.addEventListener('pointermove', handleMouseMove);
    return () => gl.domElement.removeEventListener('pointermove', handleMouseMove);
  }, [camera, gl, onMove]);

  return null;
}

// ---- Main scene content ----

function SceneContent({ tables, walls, background, gridVisible, drawWallMode, wallStart, wallMousePos, selectedIds, hoveredTable,
  onCanvasClick, onTableClick, onTableDoubleClick, onTableDragEnd, onTableDragEndMulti, onHoverTable,
  onWallDrawStart, onWallDrawEnd, onWallDrawMove, onDeleteWall, areas }: {
  tables: TableType[]; walls: WallType[]; background?: string | null; gridVisible: boolean;
  drawWallMode: boolean; wallStart: { x: number; y: number } | null; wallMousePos: { x: number; y: number } | null;
  selectedIds: Set<number>; hoveredTable: number | null;
  onCanvasClick: (nx: number, ny: number) => void;
  onTableClick: (id: number, shiftKey: boolean) => void;
  onTableDoubleClick: (id: number) => void;
  onTableDragEnd: (id: number, nx: number, ny: number) => void;
  onTableDragEndMulti: (positions: { id: number; posX: number; posY: number }[]) => void;
  onHoverTable: (id: number | null) => void;
  onWallDrawStart: (nx: number, ny: number) => void;
  onWallDrawEnd: (nx: number, ny: number) => void;
  onWallDrawMove: (nx: number, ny: number) => void;
  onDeleteWall: (id: number) => void;
  areas: { name: string; nx: number; ny: number }[];
}) {
  const handleDragEnd = useCallback((id: number, nx: number, ny: number) => {
    const isMulti = selectedIds.has(id) && selectedIds.size > 1;
    if (!isMulti) {
      onTableDragEnd(id, nx, ny);
      return;
    }
    const table = tables.find(t => t.id === id);
    if (!table) return;
    const deltaX = nx - table.posX;
    const deltaY = ny - table.posY;
    const positions = tables
      .filter(t => selectedIds.has(t.id))
      .map(t => ({
        id: t.id,
        posX: Math.min(1, Math.max(0, +(t.posX + deltaX).toFixed(2))),
        posY: Math.min(1, Math.max(0, +(t.posY + deltaY).toFixed(2))),
      }));
    onTableDragEndMulti(positions);
  }, [selectedIds, tables, onTableDragEnd, onTableDragEndMulti]);

  return (
    <>
      <CameraFitter />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      <OrbitControls
        makeDefault
        enableRotate={!drawWallMode}
        enablePan={!drawWallMode}
        enableZoom
        zoomSpeed={1}
        target={[WORLD_W / 2, 0, WORLD_H / 2]}
        maxPolarAngle={Math.PI / 2.2}
        minZoom={20}
        maxZoom={200}
      />

      {/* Wall move tracker for preview */}
      {drawWallMode && wallStart && <WallMoveTracker onMove={onWallDrawMove} />}

      <BackgroundPlane url={background} />
      <SceneGrid visible={gridVisible} />

      <GroundPlane
        drawWallMode={drawWallMode}
        wallStart={wallStart}
        onWallDrawStart={onWallDrawStart}
        onWallDrawEnd={onWallDrawEnd}
        onCanvasClick={onCanvasClick}
      />

      {walls.map((wall) => (
        <SceneWall key={wall.id} wall={wall} drawWallMode={drawWallMode} onClick={() => onDeleteWall(wall.id)} />
      ))}

      {drawWallMode && wallStart && wallMousePos && (
        <DrawWallPreview start={wallStart} end={wallMousePos} />
      )}

      {tables.map((table) => (
        <TableMesh
          key={table.id}
          table={table}
          isSelected={selectedIds.has(table.id)}
          isHovered={hoveredTable === table.id}
          drawWallMode={drawWallMode}
          onClick={(shiftKey) => onTableClick(table.id, shiftKey)}
          onDoubleClick={() => onTableDoubleClick(table.id)}
          onDragEnd={handleDragEnd}
          onHover={onHoverTable}
        />
      ))}

      {areas.map((area) => (
        <SceneAreaLabel key={area.name} name={area.name} nx={area.nx} ny={area.ny} />
      ))}

      {tables.length === 0 && !drawWallMode && (
        <Text position={[WORLD_W / 2, 1, WORLD_H / 2]} fontSize={0.2} color='#666' anchorX='center' anchorY='middle'>
          No tables. Click to add.
        </Text>
      )}
    </>
  );
}

// ---- Public component ----

export function TableScene(props: {
  tables: TableType[];
  walls: WallType[];
  background?: string | null;
  gridVisible: boolean;
  drawWallMode: boolean;
  wallStart: { x: number; y: number } | null;
  wallMousePos: { x: number; y: number } | null;
  selectedIds: Set<number>;
  hoveredTable: number | null;
  onCanvasClick: (nx: number, ny: number) => void;
  onTableClick: (id: number, shiftKey: boolean) => void;
  onTableDoubleClick: (id: number) => void;
  onTableDragEnd: (id: number, nx: number, ny: number) => void;
  onTableDragEndMulti: (positions: { id: number; posX: number; posY: number }[]) => void;
  onHoverTable: (id: number | null) => void;
  onWallDrawStart: (nx: number, ny: number) => void;
  onWallDrawEnd: (nx: number, ny: number) => void;
  onWallDrawMove: (nx: number, ny: number) => void;
  onDeleteWall: (id: number) => void;
  areas: { name: string; nx: number; ny: number }[];
}) {
  return (
    <div className='h-[600px] min-h-[500px] w-full overflow-hidden rounded-xl border'>
      <Canvas
        orthographic
        camera={{
          position: [WORLD_W / 2, 15, WORLD_H / 2],
          zoom: 60,
          near: -100,
          far: 100,
          left: 0,
          right: WORLD_W,
          top: WORLD_H,
          bottom: 0,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%', minHeight: 500, background: '#111827' }}
        onCreated={({ gl }) => { gl.setClearColor('#111827'); }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
