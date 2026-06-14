/**
 * Pre-allocated THREE scratch objects for layout/setup hot paths.
 * Do not store long-lived references to these — copy values out if needed.
 */

import * as THREE from 'three';

export const scratchColor = new THREE.Color();
export const scratchColorB = new THREE.Color();
export const scratchObject3D = new THREE.Object3D();
