Shader "ProceduralRPG/Triplanar SDF World"
{
    Properties
    {
        _StoneColor("Stone", Color) = (0.28, 0.31, 0.34, 1)
        _MetalColor("Metal veins", Color) = (0.22, 0.28, 0.31, 1)
        _WoodColor("Ancient wood", Color) = (0.22, 0.12, 0.07, 1)
        _PatternScale("Pattern scale", Range(0.02, 3)) = 0.28
        _MetalAmount("Metal amount", Range(0, 1)) = 0.2
        _WoodAmount("Wood amount", Range(0, 1)) = 0.12
        _Roughness("Roughness", Range(0, 1)) = 0.72
        _Wetness("Wetness", Range(0, 1)) = 0
        _AudioPulse("Audio pulse", Range(0, 3)) = 0
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "RenderType"="Opaque" "Queue"="Geometry" }
        Pass
        {
            Name "UniversalForward"
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            #include "Includes/ProceduralNoise.hlsl"

            CBUFFER_START(UnityPerMaterial)
                half4 _StoneColor, _MetalColor, _WoodColor;
                float _PatternScale, _MetalAmount, _WoodAmount, _Roughness, _Wetness, _AudioPulse;
            CBUFFER_END

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float fogFactor : TEXCOORD2;
            };

            Varyings Vert(Attributes input)
            {
                Varyings output;
                VertexPositionInputs pos = GetVertexPositionInputs(input.positionOS.xyz);
                output.positionCS = pos.positionCS;
                output.positionWS = pos.positionWS;
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.fogFactor = ComputeFogFactor(pos.positionCS.z);
                return output;
            }

            half4 Frag(Varyings input) : SV_Target
            {
                float3 n = normalize(input.normalWS);
                float3 p = input.positionWS * _PatternScale;
                float grain = TriplanarFbm(input.positionWS, n, _PatternScale);
                float cells = Worley3D(p * 1.45);
                float vein = smoothstep(0.08, 0.18, abs(sin((p.x + p.y * .35 + p.z * .2) * 8.0 + grain * 5.0)));
                float metalMask = (1.0 - cells) * _MetalAmount * (1.0 - vein * 0.35);
                float rings = sin(length(p.xz) * 23.0 + grain * 8.0) * .5 + .5;
                float woodMask = smoothstep(.66, .88, rings) * _WoodAmount * saturate(n.y * .35 + .65);
                float3 albedo = lerp(_StoneColor.rgb * (0.68 + grain * .62), _MetalColor.rgb, metalMask);
                albedo = lerp(albedo, _WoodColor.rgb * (0.65 + rings * .55), woodMask);
                // Rain darkens cavities and lower-facing rough stone.
                float wet = _Wetness * saturate(1.0 - n.y * .45) * (0.55 + grain * .45);
                albedo *= 1.0 - wet * .38;
                float metallic = metalMask * .9;
                float roughness = saturate(_Roughness - metalMask * .48 - wet * .36 + cells * .12);
                Light light = GetMainLight();
                float3 l = normalize(light.direction);
                float3 v = normalize(GetCameraPositionWS() - input.positionWS);
                float3 h = normalize(l + v);
                float ndl = saturate(dot(n, l));
                float spec = pow(saturate(dot(n, h)), lerp(6.0, 160.0, 1.0 - roughness));
                float3 f0 = lerp(0.04.xxx, albedo, metallic);
                float fresnel = pow(1.0 - saturate(dot(v, h)), 5.0);
                float pulse = sin(_Time.y * (1.5 + _AudioPulse * 5.0) + grain * 10.0) * 0.015 * _AudioPulse;
                float3 color = albedo * (SampleSH(n) + light.color * ndl * light.shadowAttenuation);
                color += (f0 + fresnel) * spec * light.color * (0.35 + metallic);
                color += pulse * _MetalColor.rgb;
                color = MixFog(color, input.fogFactor);
                return half4(color, 1);
            }
            ENDHLSL
        }
    }
}