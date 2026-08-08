import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const REPO_BASE = 'https://raw.githubusercontent.com/IETGLIM/Volodka/main/public/';

export class AssetManager {
  private static gltfLoader = new GLTFLoader();
  private static rgbeLoader = new RGBELoader();

  private static models = new Map<string, THREE.Group>();
  private static animations = new Map<string, THREE.AnimationClip>();

  static async loadModel(path: string): Promise<THREE.Group> {
    if (this.models.has(path)) {
      return this.models.get(path)!.clone(true);
    }
    return new Promise((resolve) => {
      this.gltfLoader.load(
        REPO_BASE + path,
        (gltf) => {
          this.models.set(path, gltf.scene);
          // Extract animations if any
          if (gltf.animations && gltf.animations.length > 0) {
             gltf.animations.forEach(clip => {
                 this.animations.set(`${path}:${clip.name}`, clip);
             });
          }
          resolve(gltf.scene.clone(true));
        },
        undefined,
        (err) => {
          console.error(`Failed to load model ${path}:`, err);
          // Return an empty group as fallback
          resolve(new THREE.Group());
        }
      );
    });
  }

  static async loadAnimation(path: string): Promise<THREE.AnimationClip | null> {
    if (this.animations.has(path)) {
      return this.animations.get(path)!;
    }
    return new Promise((resolve) => {
      this.gltfLoader.load(
        REPO_BASE + path,
        (gltf) => {
          if (gltf.animations && gltf.animations.length > 0) {
            const clip = gltf.animations[0];
            this.animations.set(path, clip);
            resolve(clip);
          } else {
            resolve(null);
          }
        },
        undefined,
        (err) => {
          console.error(`Failed to load animation ${path}:`, err);
          resolve(null);
        }
      );
    });
  }

  static async loadHDRI(path: string): Promise<THREE.DataTexture> {
    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        REPO_BASE + path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
}
