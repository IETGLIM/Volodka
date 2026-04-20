import * as THREE from 'three';

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export type MeshWorldAuditRow = {
  name: string;
  wx: number;
  wy: number;
  wz: number;
  meshUuid: string;
  geometryUuid: string;
};

/**
 * Все `Mesh` в поддереве сцены с мировой позицией **origin** меша (как в прежнем `console.table`).
 * Для поиска дубликатов GLTF часто важнее совпадение `geometry.uuid` + позиции — см. {@link findGeometryPlacementDuplicates}.
 */
export function collectMeshWorldAuditRows(scene: THREE.Scene): MeshWorldAuditRow[] {
  scene.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const rows: MeshWorldAuditRow[] = [];
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.getWorldPosition(v);
    rows.push({
      name: mesh.name || '(unnamed)',
      wx: round3(v.x),
      wy: round3(v.y),
      wz: round3(v.z),
      meshUuid: mesh.uuid.slice(0, 8),
      geometryUuid: mesh.geometry.uuid.slice(0, 8),
    });
  });
  rows.sort((a, b) => a.name.localeCompare(b.name) || a.wx - b.wx || a.wy - b.wy || a.wz - b.wz);
  return rows;
}

/** Два+ меша с одним `geometry.uuid` и (после округления) одной мировой позицией — типичный дубликат узла в GLTF. */
export function findGeometryPlacementDuplicates(rows: MeshWorldAuditRow[]): MeshWorldAuditRow[][] {
  const map = new Map<string, MeshWorldAuditRow[]>();
  for (const r of rows) {
    const key = `${r.geometryUuid}|${r.wx}|${r.wy}|${r.wz}`;
    const arr = map.get(key);
    if (arr) arr.push(r);
    else map.set(key, [r]);
  }
  return [...map.values()].filter((g) => g.length > 1);
}

/** Два+ меша с одним `name` и одной позицией (после округления) — кандидаты на лишний дубль или z-fight. */
export function findNamePlacementDuplicates(rows: MeshWorldAuditRow[]): MeshWorldAuditRow[][] {
  const map = new Map<string, MeshWorldAuditRow[]>();
  for (const r of rows) {
    const key = `${r.name}|${r.wx}|${r.wy}|${r.wz}`;
    const arr = map.get(key);
    if (arr) arr.push(r);
    else map.set(key, [r]);
  }
  return [...map.values()].filter((g) => g.length > 1);
}
