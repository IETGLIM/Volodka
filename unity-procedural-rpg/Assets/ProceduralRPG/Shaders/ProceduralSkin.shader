Shader "ProceduralRPG/Procedural Skin"
{
    Properties
    {
        _SkinColor("Skin colour", Color) = (0.65, 0.28, 0.16, 1)
        _SubsurfaceColor("Subsurface colour", Color) = (1.0, 0.16, 0.07, 1)
        _FuzzStrength("Micro fuzz", Range(0, 1)) = .25
        _ScatterDistance("Beer scatter distance", Range(.05, 4)) = 1.2
        _PoreScale("Pore scale", Range(5, 80)) = 38
        _AudioPulse("Audio pulse", Range(0, 3)) = 0
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "RenderType"="Opaque" }
        Pass
        {
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            #include "Includes/ProceduralNoise.hlsl"
            CBUFFER_START(UnityPerMaterial)
                half4 _SkinColor, _SubsurfaceColor;
                float _FuzzStrength, _ScatterDistance, _PoreScale, _AudioPulse;
            CBUFFER_END
            struct A { float4 positionOS : POSITION; float3 normalOS : NORMAL; };
            struct V { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; float3 normalWS : TEXCOORD1; float fog : TEXCOORD2; };
            V Vert(A a) { V o; VertexPositionInputs p = GetVertexPositionInputs(a.positionOS.xyz); o.positionCS=p.positionCS; o.positionWS=p.positionWS; o.normalWS=TransformObjectToWorldNormal(a.normalOS); o.fog=ComputeFogFactor(p.positionCS.z); return o; }
            half4 Frag(V i) : SV_Target
            {
                float3 n = normalize(i.normalWS);
                float3 l = normalize(GetMainLight().direction);
                float3 v = normalize(GetCameraPositionWS() - i.positionWS);
                float pores = Fbm3D(i.positionWS * _PoreScale, 3);
                n = normalize(n + (pores - .5) * .18);
                float ndl = saturate(dot(n,l));
                // Beer-Lambert-style skin approximation: light travels further
                // through thin grazing regions, creating warm transmission.
                float thickness = saturate(1.0 - dot(n, -l));
                float transmission = exp(-thickness * _ScatterDistance);
                float fuzz = pow(1.0 - saturate(dot(n,v)), 4.0) * _FuzzStrength;
                Light light = GetMainLight();
                float3 color = _SkinColor.rgb * (SampleSH(n) + light.color * ndl * light.shadowAttenuation);
                color += _SubsurfaceColor.rgb * transmission * .34 * light.color;
                color += fuzz * light.color * (.4 + pores * .35);
                color += sin(_Time.y * (1.2 + _AudioPulse * 3.0) + pores * 20.0) * .006 * _AudioPulse;
                return half4(MixFog(color, i.fog), 1);
            }
            ENDHLSL
        }
    }
}