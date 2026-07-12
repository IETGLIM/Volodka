import { useMemo } from 'react';
import type * as THREE from 'three';
import type {
  ComposerHairId,
  ComposerTopId,
  NpcComposePalette,
  NpcComposeRecipe,
} from '@/config/npcComposer/types';
import { ProceduralEyes } from '@/components/3d/proceduralNpc/ProceduralEyes';
import {
  boxGeo,
  capsuleGeo,
  clothingMat,
  cylinderGeo,
  emissiveMat,
  hairMat,
  mergedGeo,
  npcMat,
  sharedGeo,
  sharedMat,
  skinMat,
  sphereGeo,
  stubbleMat,
} from '@/components/3d/proceduralNpcShared';

function bodyDims(bodyId: NpcComposeRecipe['slots']['body']): { w: number; h: number; d: number } {
  switch (bodyId) {
    case 'heavy_male':
      return { w: 0.46, h: 0.5, d: 0.26 };
    case 'elder_male':
    case 'average_male':
      return { w: 0.4, h: 0.46, d: 0.23 };
    case 'average_female':
      return { w: 0.36, h: 0.46, d: 0.21 };
    case 'elder_female_stooped':
      return { w: 0.38, h: 0.42, d: 0.22 };
    case 'slim_female':
    case 'slim_male':
      return { w: 0.32, h: 0.44, d: 0.19 };
    default: {
      const _exhaustive: never = bodyId;
      return _exhaustive;
    }
  }
}

function accentMat(palette: NpcComposePalette) {
  return npcMat({ color: palette.accent, emissive: palette.glow, emissiveIntensity: 0.2, roughness: 0.6 });
}

function ComposerHair({ hair, palette }: { hair: ComposerHairId; palette: NpcComposePalette }) {
  switch (hair) {
    case 'scarf_wrap':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh position={[0, 0.04, 0]} geometry={sphereGeo(0.11, 6, 5)} material={npcMat({ color: palette.accent, emissive: palette.glow, emissiveIntensity: 0.1, roughness: 0.8 })} />
          <mesh geometry={mergedGeo.scarfEarPair} material={npcMat({ color: palette.accent, roughness: 0.8 })} />
        </group>
      );
    case 'gray_receding':
      return <mesh geometry={mergedGeo.hairGrayCluster} material={sharedMat.hairGray} />;
    case 'bun_gray':
      return <mesh position={[0, 0.08, -0.1]} geometry={sharedGeo.hairBunSm} material={sharedMat.hairGray} />;
    case 'bun_dark':
    case 'ponytail':
    case 'shoulder_length':
      return (
        <>
          <mesh position={[0, 0.08, -0.01]} geometry={sharedGeo.hairSphere} material={hairMat(palette.hair)} />
          <mesh geometry={mergedGeo.hairDarkSidesBack} material={hairMat(palette.hair)} />
        </>
      );
    case 'short_crop':
      return <mesh position={[0, 0.07, 0]} geometry={sphereGeo(0.09, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={hairMat(palette.hair)} />;
    case 'beanie':
      return <mesh position={[0, 0.06, 0]} geometry={sphereGeo(0.1, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={npcMat({ color: '#1a2a4a', roughness: 0.9 })} />;
    case 'cap':
      return (
        <>
          <mesh position={[0, 0.08, 0]} geometry={sphereGeo(0.09, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5)} material={hairMat(palette.hair)} />
          <mesh position={[0, 0.08, 0.08]} geometry={boxGeo(0.12, 0.008, 0.06)} material={npcMat({ color: '#4a4a38', roughness: 0.85 })} />
        </>
      );
    case 'hood':
      return (
        <mesh position={[0, 0.04, -0.02]} geometry={sphereGeo(0.12, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.65)} material={npcMat({ color: palette.body, roughness: 0.85 })} />
      );
    case 'bald':
      return null;
    default: {
      const _exhaustive: never = hair;
      return _exhaustive;
    }
  }
}

function ComposerTop({
  top,
  palette,
  topMat,
  dims,
}: {
  top: ComposerTopId;
  palette: NpcComposePalette;
  topMat: THREE.MeshStandardMaterial;
  dims: { w: number; h: number; d: number };
}) {
  switch (top) {
    case 'tweed_jacket':
      return (
        <>
          <mesh geometry={mergedGeo.lapelPair} material={npcMat({ color: '#6a5010', roughness: 0.8 })} />
          <mesh position={[0, 0.16, 0.138]} geometry={boxGeo(0.07, 0.035, 0.015)} material={accentMat(palette)} />
        </>
      );
    case 'dress_long':
      return (
        <>
          <mesh position={[0, -0.45, 0]} castShadow geometry={cylinderGeo(0.17, 0.26, 0.7, 8)} material={topMat} />
          <mesh position={[0, 0.2, 0.105]} rotation={[0.3, 0, 0]} geometry={boxGeo(0.28, 0.015, 0.01)} material={accentMat(palette)} />
        </>
      );
    case 'apron':
      return <mesh position={[0, -0.06, 0.115]} geometry={boxGeo(0.34, 0.28, 0.01)} material={npcMat({ color: '#f0ece4', roughness: 0.75 })} />;
    case 'suit':
      return (
        <>
          <mesh position={[0, 0, 0.112]} geometry={boxGeo(0.005, dims.h, 0.005)} material={sharedMat.metalGray} />
          <mesh geometry={mergedGeo.suitButtons} material={sharedMat.metalGray} />
        </>
      );
    case 'hoodie':
      return (
        <>
          <mesh position={[0, 0.12, -0.08]} geometry={boxGeo(0.14, 0.08, 0.06)} material={topMat} />
          <mesh geometry={mergedGeo.drawstringPair} material={npcMat({ color: '#888', roughness: 0.9 })} />
        </>
      );
    case 'cardigan':
      return <mesh geometry={mergedGeo.cardiganButtons} material={sharedMat.metalGray} />;
    case 'work_coat':
      return (
        <>
          <mesh geometry={mergedGeo.rivetPair} material={sharedMat.metalGray} />
          <mesh geometry={mergedGeo.coatPocketPair} material={npcMat({ color: palette.body, roughness: 0.85 })} />
        </>
      );
    case 'barista_uniform':
      return (
        <>
          <mesh position={[0, -0.06, 0.115]} geometry={boxGeo(0.3, 0.24, 0.01)} material={npcMat({ color: '#2a2a2a', roughness: 0.8 })} />
          <mesh position={[0, 0.1, 0.11]} geometry={boxGeo(0.08, 0.04, 0.01)} material={emissiveMat(palette.accent, palette.glow, 0.35)} />
        </>
      );
    case 'jacket_casual':
      return <mesh geometry={mergedGeo.elbowPatchPair} material={npcMat({ color: '#5a4030', roughness: 0.85 })} />;
    case 'windbreaker':
      return <mesh position={[0, 0.14, 0.1]} geometry={boxGeo(0.22, 0.02, 0.01)} material={accentMat(palette)} />;
    case 'blouse':
      return <mesh position={[0, 0.08, 0.11]} geometry={boxGeo(0.16, 0.04, 0.01)} material={accentMat(palette)} />;
    default: {
      const _exhaustive: never = top;
      return _exhaustive;
    }
  }
}

function ComposerProp({
  prop,
  palette,
}: {
  prop: NpcComposeRecipe['slots']['prop'];
  palette: NpcComposePalette;
}) {
  if (prop === 'none') return null;
  const accent = npcMat({ color: palette.accent, emissive: palette.glow, emissiveIntensity: 0.2, roughness: 0.6 });

  switch (prop) {
    case 'book':
      return (
        <group position={[0, -0.36, 0.05]} rotation={[0.35, 0.15, -0.2]}>
          <mesh geometry={boxGeo(0.06, 0.08, 0.02)} material={npcMat({ color: '#5a4030', roughness: 0.85 })} />
          <mesh position={[-0.034, 0, 0]} geometry={boxGeo(0.006, 0.08, 0.024)} material={accent} />
          <mesh position={[0.01, 0, 0.012]} geometry={boxGeo(0.04, 0.075, 0.002)} material={sharedMat.bookPages} />
        </group>
      );
    case 'ladle':
      return (
        <group position={[0, -0.34, 0.05]} rotation={[0.5, 0.1, -0.15]}>
          <mesh geometry={sphereGeo(0.022, 6, 5)} material={npcMat({ color: '#8a6a40', roughness: 0.75 })} />
          <mesh position={[0, 0.02, -0.05]} rotation={[0.8, 0, 0]} geometry={cylinderGeo(0.007, 0.005, 0.11, 4)} material={npcMat({ color: '#6a5030', roughness: 0.8 })} />
        </group>
      );
    case 'guitar':
      return (
        <group position={[0.08, -0.05, 0.14]} rotation={[0.15, -0.35, 0.25]}>
          <mesh geometry={boxGeo(0.14, 0.22, 0.05)} material={npcMat({ color: '#5a3828', roughness: 0.8 })} />
          <mesh position={[0, 0.14, 0]} geometry={cylinderGeo(0.012, 0.01, 0.28, 5)} material={npcMat({ color: '#3a2818', roughness: 0.85 })} />
        </group>
      );
    case 'soldering_iron':
      return (
        <group position={[0, -0.32, 0.06]} rotation={[0.2, 0.2, -0.35]}>
          <mesh geometry={cylinderGeo(0.008, 0.008, 0.14, 4)} material={sharedMat.metalGray} />
          <mesh position={[0, 0.08, 0.02]} geometry={sphereGeo(0.012, 5, 4)} material={emissiveMat(palette.glow, palette.glow, 0.7)} />
        </group>
      );
    case 'phone':
      return (
        <mesh position={[-0.24, -0.28, 0.08]} rotation={[0.3, 0, 0]} geometry={boxGeo(0.03, 0.05, 0.005)} material={npcMat({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.7 })} />
      );
    case 'coffee_cup':
      return (
        <mesh position={[0.22, -0.3, 0.1]} geometry={cylinderGeo(0.03, 0.035, 0.05, 6)} material={npcMat({ color: '#e8e0d0', roughness: 0.6 })} />
      );
    case 'fishing_rod':
      return (
        <group position={[0.26, -0.1, 0.1]} rotation={[0.3, 0, 0.2]}>
          <mesh geometry={cylinderGeo(0.006, 0.004, 0.5, 4)} material={npcMat({ color: '#6a5040', roughness: 0.85 })} />
        </group>
      );
    case 'wrench':
      return (
        <mesh position={[-0.24, -0.32, 0.06]} rotation={[0.4, 0, -0.2]} geometry={boxGeo(0.02, 0.12, 0.02)} material={sharedMat.metalGray} />
      );
    default: {
      const _exhaustive: never = prop;
      return _exhaustive;
    }
  }
}

export function ComposerFigure({
  recipe,
  palette,
}: {
  recipe: NpcComposeRecipe;
  palette: NpcComposePalette;
}) {
  const dims = bodyDims(recipe.slots.body);
  const torsoY = recipe.slots.body === 'elder_female_stooped' ? 0.98 : 1.05;
  const torsoLean = recipe.bodyLean ?? 0.04;
  const topColor = palette.body;
  const topMat = useMemo(() => clothingMat(topColor, palette.glow, 0.06), [topColor, palette.glow]);
  const skin = skinMat(palette.skin);

  const hideLegs = recipe.slots.bottom === 'hidden_dress';

  return (
    <group>
      <group name="torso" position={[0, torsoY, 0.02]} rotation={[torsoLean, 0, 0]}>
        <mesh castShadow geometry={boxGeo(dims.w, dims.h, dims.d)} material={topMat} />
        <ComposerTop top={recipe.slots.top} palette={palette} topMat={topMat} dims={dims} />

        <mesh position={[0, dims.h * 0.5, 0]} geometry={sharedGeo.neckCylinderMd} material={skin} />

        <group name="head" position={[0, dims.h * 0.92, 0.02]}>
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skin} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skin} />
          <ProceduralEyes showBrows={false} />
          <mesh position={[0, 0.008, 0.1]} geometry={sharedGeo.noseBridge} material={skin} />
          <mesh position={[0, -0.02, 0.105]} geometry={mergedGeo.mouthLineOnly} material={sharedMat.mouth} />

          <ComposerHair hair={recipe.slots.hair} palette={palette} />

          {recipe.slots.accessory === 'glasses_scholarly' && (
            <group position={[0, 0.02, 0.1]}>
              <mesh geometry={mergedGeo.glassesLenses} material={npcMat({ color: palette.accent, emissive: palette.glow, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.7 })} />
              <mesh geometry={mergedGeo.glassesTemples} material={sharedMat.metalGray} />
            </group>
          )}
          {recipe.slots.accessory === 'glasses_round' && (
            <group position={[0, 0.02, 0.1]}>
              <mesh geometry={mergedGeo.glassesLensesRound} material={npcMat({ color: palette.accent, emissive: palette.glow, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.7 })} />
              <mesh geometry={mergedGeo.glassesTemplesRound} material={sharedMat.metalGray} />
            </group>
          )}
          {recipe.slots.accessory === 'earring' && (
            <mesh position={[0.09, -0.02, 0.04]} geometry={sphereGeo(0.012, 6, 6)} material={emissiveMat(palette.accent, palette.glow, 0.5)} />
          )}
          {recipe.slots.accessory === 'badge' && (
            <mesh position={[0.12, 0.02, 0.1]} geometry={boxGeo(0.03, 0.04, 0.005)} material={emissiveMat(palette.accent, palette.glow, 0.35)} />
          )}
          {recipe.slots.head === 'bearded_male' && (
            <mesh position={[0, -0.07, 0.04]} geometry={sharedGeo.stubblePlane} material={stubbleMat(palette.skinShadow, 0.2)} />
          )}
        </group>

        <group name="leftArm" position={[dims.w * 0.52, 0.18, 0]} rotation={[0, 0, 0.12]}>
          <mesh castShadow geometry={capsuleGeo(0.04, 0.14, 4)} material={topMat} />
          <mesh position={[0, -0.3, 0]} geometry={capsuleGeo(0.035, 0.12, 4)} material={topMat} />
          <mesh position={[0, -0.42, 0]} geometry={sharedGeo.handSphere} material={skin} />
          <ComposerProp prop={recipe.slots.prop} palette={palette} />
        </group>
        <group name="rightArm" position={[-dims.w * 0.52, 0.18, 0]} rotation={[0, 0, -0.12]}>
          <mesh castShadow geometry={capsuleGeo(0.04, 0.14, 4)} material={topMat} />
          <mesh position={[0, -0.3, 0]} geometry={capsuleGeo(0.035, 0.12, 4)} material={topMat} />
          <mesh position={[0, -0.42, 0]} geometry={sharedGeo.handSphere} material={skin} />
          {recipe.slots.accessory === 'cyber_arm' && (
            <mesh position={[0, -0.28, 0.02]} geometry={boxGeo(0.05, 0.14, 0.05)} material={emissiveMat(palette.accent, palette.glow, 0.45)} />
          )}
        </group>
      </group>

      {!hideLegs && (
        <>
          <group name="leftLeg" position={[0.09, 0.9, 0]}>
            <mesh position={[0, -0.22, 0]} geometry={capsuleGeo(0.045, 0.22, 4)} material={npcMat({ color: palette.body, roughness: 0.85 })} />
            <mesh position={[0, -0.55, 0.02]} geometry={sharedGeo.sneakerBox} material={npcMat({ color: '#2a2a2a', roughness: 0.9 })} />
          </group>
          <group name="rightLeg" position={[-0.09, 0.9, 0]}>
            <mesh position={[0, -0.22, 0]} geometry={capsuleGeo(0.045, 0.22, 4)} material={npcMat({ color: palette.body, roughness: 0.85 })} />
            <mesh position={[0, -0.55, 0.02]} geometry={sharedGeo.sneakerBox} material={npcMat({ color: '#2a2a2a', roughness: 0.9 })} />
          </group>
        </>
      )}
      {hideLegs && (
        <>
          <group name="leftLeg" position={[0.09, 0.9, 0]}>
            <mesh position={[0, -0.18, 0]} geometry={capsuleGeo(0.04, 0.12, 4)} material={topMat} />
          </group>
          <group name="rightLeg" position={[-0.09, 0.9, 0]}>
            <mesh position={[0, -0.18, 0]} geometry={capsuleGeo(0.04, 0.12, 4)} material={topMat} />
          </group>
        </>
      )}
    </group>
  );
}
