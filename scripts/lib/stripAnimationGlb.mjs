/**
 * Strip mesh/skin/material data from a rigged GLB, keeping skeleton nodes + animations.
 * Used for public/models/animations/* (animation-only clips, smaller downloads).
 */

const COMPONENT_BYTES = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

export function parseGlb(buffer) {
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error('Not a GLB file');
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported GLB version ${version}`);

  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkData = buffer.subarray(chunkStart, chunkStart + chunkLength);

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(chunkData.toString('utf8'));
    } else if (chunkType === 0x004e4942) {
      bin = chunkData;
    }
    offset = chunkStart + chunkLength;
  }

  if (!json) throw new Error('GLB missing JSON chunk');
  if (!bin) throw new Error('GLB missing BIN chunk');
  return { json, bin };
}

export function buildGlb(json, bin) {
  const jsonStr = JSON.stringify(json);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonChunk = Buffer.from(jsonStr + ' '.repeat(jsonPad), 'utf8');

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const chunks = [jsonHeader, jsonChunk];
  let totalLength = 12 + 8 + jsonChunk.length;

  if (bin && bin.length > 0) {
    const binPad = (4 - (bin.length % 4)) % 4;
    const binChunk = Buffer.concat([bin, Buffer.alloc(binPad)]);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    chunks.push(binHeader, binChunk);
    totalLength += 8 + binChunk.length;
  }

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  return Buffer.concat([header, ...chunks]);
}

function accessorByteLength(json, accessorIndex, bin) {
  const acc = json.accessors[accessorIndex];
  if (!acc) throw new Error(`Missing accessor ${accessorIndex}`);
  const componentBytes = COMPONENT_BYTES[acc.componentType];
  const typeComponents = TYPE_COMPONENTS[acc.type];
  if (!componentBytes || !typeComponents) {
    throw new Error(`Unsupported accessor ${accessorIndex}: ${acc.componentType}/${acc.type}`);
  }
  return componentBytes * typeComponents * acc.count;
}

function collectAnimationDependencies(json) {
  const requiredNodes = new Set();
  const requiredAccessors = new Set();
  const parent = new Map();

  (json.nodes ?? []).forEach((node, index) => {
    for (const child of node.children ?? []) parent.set(child, index);
  });

  for (const anim of json.animations ?? []) {
    for (const sampler of anim.samplers ?? []) {
      requiredAccessors.add(sampler.input);
      requiredAccessors.add(sampler.output);
    }
    for (const channel of anim.channels ?? []) {
      let nodeIndex = channel.target?.node;
      while (nodeIndex !== undefined) {
        requiredNodes.add(nodeIndex);
        nodeIndex = parent.get(nodeIndex);
      }
    }
  }

  return { requiredNodes, requiredAccessors };
}

/**
 * @param {Buffer} buffer
 * @returns {Buffer}
 */
export function stripAnimationGlb(buffer) {
  const { json, bin } = parseGlb(buffer);
  if (!json.animations?.length) {
    throw new Error('GLB has no animations to keep');
  }

  const { requiredNodes, requiredAccessors } = collectAnimationDependencies(json);
  const sortedNodeIndices = [...requiredNodes].sort((a, b) => a - b);
  const nodeOldToNew = new Map();
  const newNodes = [];

  for (const oldIndex of sortedNodeIndices) {
    const newIndex = newNodes.length;
    nodeOldToNew.set(oldIndex, newIndex);
    const src = json.nodes[oldIndex];
    const node = { name: src.name };
    if (src.translation) node.translation = [...src.translation];
    if (src.rotation) node.rotation = [...src.rotation];
    if (src.scale) node.scale = [...src.scale];
    newNodes.push(node);
  }

  for (let i = 0; i < newNodes.length; i += 1) {
    const oldIndex = sortedNodeIndices[i];
    const kids = (json.nodes[oldIndex].children ?? [])
      .filter((child) => requiredNodes.has(child))
      .map((child) => nodeOldToNew.get(child));
    if (kids.length > 0) newNodes[i].children = kids;
  }

  const sortedAccessorIndices = [...requiredAccessors].sort((a, b) => a - b);
  const accessorOldToNew = new Map();
  const newAccessors = [];
  const newBufferViews = [];
  const newBinParts = [];
  let binOffset = 0;

  for (const oldIndex of sortedAccessorIndices) {
    const acc = json.accessors[oldIndex];
    const byteLength = accessorByteLength(json, oldIndex, bin);
    const bufferView = json.bufferViews[acc.bufferView];
    const start = (bufferView.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const slice = bin.subarray(start, start + byteLength);
    const pad = (4 - (slice.length % 4)) % 4;

    accessorOldToNew.set(oldIndex, newAccessors.length);
    newBufferViews.push({
      buffer: 0,
      byteOffset: binOffset,
      byteLength: slice.length,
    });
    newAccessors.push({
      bufferView: newBufferViews.length - 1,
      componentType: acc.componentType,
      count: acc.count,
      type: acc.type,
    });
    newBinParts.push(slice, Buffer.alloc(pad));
    binOffset += slice.length + pad;
  }

  const newAnimations = json.animations.map((anim) => ({
    name: anim.name,
    samplers: anim.samplers.map((sampler) => ({
      input: accessorOldToNew.get(sampler.input),
      interpolation: sampler.interpolation ?? 'LINEAR',
      output: accessorOldToNew.get(sampler.output),
    })),
    channels: anim.channels.map((channel) => ({
      sampler: channel.sampler,
      target: {
        node: nodeOldToNew.get(channel.target.node),
        path: channel.target.path,
      },
    })),
  }));

  const parent = new Map();
  (json.nodes ?? []).forEach((node, index) => {
    for (const child of node.children ?? []) parent.set(child, index);
  });

  const sceneRoots = sortedNodeIndices
    .filter((index) => {
      const parentIndex = parent.get(index);
      return parentIndex === undefined || !requiredNodes.has(parentIndex);
    })
    .map((index) => nodeOldToNew.get(index));

  const newJson = {
    asset: json.asset ?? { version: '2.0', generator: 'volodka stripAnimationGlb' },
    scene: 0,
    scenes: [{ nodes: sceneRoots }],
    nodes: newNodes,
    animations: newAnimations,
    accessors: newAccessors,
    bufferViews: newBufferViews,
    buffers: [{ byteLength: binOffset }],
  };

  return buildGlb(newJson, Buffer.concat(newBinParts));
}
