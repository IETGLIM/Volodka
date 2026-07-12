import { useMemo } from 'react';
import { npcMat, sharedGeo, sharedMat } from '@/components/3d/proceduralNpcShared';

export interface ProceduralEyesProps {
  browAngle?: number;
  irisColor?: string;
  /** When false, skip eyebrows (composer scarf/hair may cover them). */
  showBrows?: boolean;
}

/**
 * Named leftEye / rightEye groups — required by npcProceduralLayers (blink + look-at).
 */
export function ProceduralEyes({
  browAngle = 0.1,
  irisColor = '#4a3520',
  showBrows = true,
}: ProceduralEyesProps) {
  const irisMat = useMemo(
    () => npcMat({ color: irisColor, roughness: 0.4, metalness: 0.2 }),
    [irisColor],
  );

  return (
    <>
      <group name="leftEye" position={[-0.038, 0.015, 0.092]}>
        <mesh geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite} />
        <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
        <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={irisMat} />
      </group>
      <group name="rightEye" position={[0.038, 0.015, 0.092]}>
        <mesh geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite} />
        <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
        <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={irisMat} />
      </group>
      {showBrows && (
        <>
          <mesh position={[-0.038, 0.035, 0.095]} rotation={[0, 0, browAngle]} geometry={sharedGeo.browBox} material={sharedMat.brow} />
          <mesh position={[0.038, 0.035, 0.095]} rotation={[0, 0, -browAngle]} geometry={sharedGeo.browBox} material={sharedMat.brow} />
        </>
      )}
    </>
  );
}
