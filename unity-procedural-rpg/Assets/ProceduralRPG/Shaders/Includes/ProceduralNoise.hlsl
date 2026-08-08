#ifndef PROCEDURAL_RPG_NOISE_INCLUDED
#define PROCEDURAL_RPG_NOISE_INCLUDED

// Stateless hash / value noise / Worley / fbm. All source is mathematical;
// no texture lookup is needed for the macro surface pattern.
float Hash11(float p)
{
    p = frac(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return frac(p);
}

float Hash31(float3 p)
{
    p = frac(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return frac((p.x + p.y) * p.z);
}

float3 Hash33(float3 p)
{
    p = frac(p * float3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return frac((p.xxy + p.yzz) * p.zyx);
}

float ValueNoise3D(float3 x)
{
    float3 i = floor(x);
    float3 f = frac(x);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = Hash31(i + float3(0,0,0));
    float n100 = Hash31(i + float3(1,0,0));
    float n010 = Hash31(i + float3(0,1,0));
    float n110 = Hash31(i + float3(1,1,0));
    float n001 = Hash31(i + float3(0,0,1));
    float n101 = Hash31(i + float3(1,0,1));
    float n011 = Hash31(i + float3(0,1,1));
    float n111 = Hash31(i + float3(1,1,1));
    return lerp(lerp(lerp(n000,n100,f.x), lerp(n010,n110,f.x), f.y),
                lerp(lerp(n001,n101,f.x), lerp(n011,n111,f.x), f.y), f.z);
}

float Fbm3D(float3 p, int octaves)
{
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    [loop] for (int i = 0; i < octaves; i++)
    {
        sum += ValueNoise3D(p * freq) * amp;
        freq *= 2.03;
        amp *= 0.5;
    }
    return sum;
}

float Worley3D(float3 p)
{
    float3 cell = floor(p);
    float3 local = frac(p);
    float minDistance = 8.0;
    [unroll] for (int z = -1; z <= 1; z++)
    [unroll] for (int y = -1; y <= 1; y++)
    [unroll] for (int x = -1; x <= 1; x++)
    {
        float3 offset = float3(x, y, z);
        float3 feature = Hash33(cell + offset);
        float dist = length(offset + feature - local);
        minDistance = min(minDistance, dist);
    }
    return minDistance;
}

float TriplanarFbm(float3 worldPos, float3 worldNormal, float scale)
{
    float3 weight = pow(abs(worldNormal), 4.0);
    weight /= max(dot(weight, 1.0.xxx), 0.0001);
    return Fbm3D(float3(worldPos.zy, worldPos.x) * scale, 4) * weight.x +
           Fbm3D(float3(worldPos.xz, worldPos.y) * scale, 4) * weight.y +
           Fbm3D(float3(worldPos.xy, worldPos.z) * scale, 4) * weight.z;
}

#endif