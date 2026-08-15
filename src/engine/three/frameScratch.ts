/**
 * Pre-allocated THREE scratch objects for layout/setup hot paths.
 * Do not store long-lived references to these — copy values out if needed.
 */

import { Color, Object3D } from 'three';

export const scratchColor = new Color();
export const scratchColorB = new Color();
export const scratchObject3D = new Object3D();
