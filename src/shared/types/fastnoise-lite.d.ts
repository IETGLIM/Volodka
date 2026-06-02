/* ─── TypeScript declarations for fastnoise-lite ─── */

declare module 'fastnoise-lite' {
  export default class FastNoiseLite {
    constructor(seed?: number);

    static NoiseType: Readonly<{
      OpenSimplex2: 'OpenSimplex2';
      OpenSimplex2S: 'OpenSimplex2S';
      Cellular: 'Cellular';
      Perlin: 'Perlin';
      ValueCubic: 'ValueCubic';
      Value: 'Value';
    }>;

    static FractalType: Readonly<{
      None: 'None';
      FBm: 'FBm';
      Ridged: 'Ridged';
      PingPong: 'PingPong';
      DomainWarpProgressive: 'DomainWarpProgressive';
      DomainWarpIndependent: 'DomainWarpIndependent';
    }>;

    static CellularDistanceFunction: Readonly<{
      Euclidean: 'Euclidean';
      EuclideanSq: 'EuclideanSq';
      Manhattan: 'Manhattan';
      Hybrid: 'Hybrid';
    }>;

    static CellularReturnType: Readonly<{
      CellValue: 'CellValue';
      Distance: 'Distance';
      Distance2: 'Distance2';
      Distance2Add: 'Distance2Add';
      Distance2Sub: 'Distance2Sub';
      Distance2Mul: 'Distance2Mul';
      Distance2Div: 'Distance2Div';
    }>;

    static DomainWarpType: Readonly<{
      OpenSimplex2: 'OpenSimplex2';
      OpenSimplex2Reduced: 'OpenSimplex2Reduced';
      BasicGrid: 'BasicGrid';
    }>;

    SetSeed(seed: number): void;
    SetFrequency(frequency: number): void;
    SetNoiseType(noiseType: string): void;
    SetFractalType(fractalType: string): void;
    SetFractalOctaves(octaves: number): void;
    SetFractalLacunarity(lacunarity: number): void;
    SetFractalGain(gain: number): void;
    SetFractalWeightedStrength(weightedStrength: number): void;
    SetFractalPingPongStrength(pingPongStrength: number): void;
    SetCellularDistanceFunction(func: string): void;
    SetCellularReturnType(returnType: string): void;
    SetCellularJitter(jitter: number): void;
    SetDomainWarpType(warpType: string): void;
    SetDomainWarpAmp(amp: number): void;

    /** 2D noise (x, y) or 3D noise (x, y, z). Returns -1..1 */
    GetNoise(x: number, y: number): number;
    GetNoise(x: number, y: number, z: number): number;

    /** Domain warp — mutates the coord object's x/y/z in place */
    DomainWrap(coord: { x: number; y: number; z?: number }): void;
  }
}
