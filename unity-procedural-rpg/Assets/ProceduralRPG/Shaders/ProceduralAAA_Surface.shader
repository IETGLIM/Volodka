Shader "ProceduralRPG/AAA Surface"
{
    Properties
    {
        _BaseTint("Base tint", Color) = (1,1,1,1)
        _GeneratedBaseColor("Generated Base Color", 2D) = "white" {}
        _GeneratedNormal("Generated Normal", 2D) = "bump" {}
        _GeneratedMask("Generated Mask", 2D) = "white" {}
        _GeneratedHeight("Generated Height", 2D) = "gray" {}
        _ParallaxDepth("Parallax depth", Range(0, .12)) = .028
        _ParallaxSteps("Parallax steps", Range(4, 32)) = 16
        _Anisotropy("Anisotropy", Range(0, 1)) = .45
        _WearAmount("Edge wear", Range(0, 1)) = .45
        _Dirt("Dirt", Range(0, 1)) = 0
        _Rain("Rain wash", Range(0, 1)) = 0
        _ObjectBaseY("Object base world Y", Float) = 0
        _ObjectHeight("Object height", Float) = 2
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

            TEXTURE2D(_GeneratedBaseColor); SAMPLER(sampler_GeneratedBaseColor);
            TEXTURE2D(_GeneratedNormal); SAMPLER(sampler_GeneratedNormal);
            TEXTURE2D(_GeneratedMask); SAMPLER(sampler_GeneratedMask);
            TEXTURE2D(_GeneratedHeight); SAMPLER(sampler_GeneratedHeight);
            CBUFFER_START(UnityPerMaterial)
                half4 _BaseTint;
                float _ParallaxDepth, _ParallaxSteps, _Anisotropy, _WearAmount, _Dirt, _Rain;
                float _ObjectBaseY, _ObjectHeight, _AudioPulse;
            CBUFFER_END

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float4 tangentOS : TANGENT; float2 uv : TEXCOORD0; };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float3 tangentWS : TEXCOORD2;
                float3 bitangentWS : TEXCOORD3;
                float2 uv : TEXCOORD4;
                float fogFactor : TEXCOORD5;
            };

            Varyings Vert(Attributes input)
            {
                Varyings o;
                VertexPositionInputs p = GetVertexPositionInputs(input.positionOS.xyz);
                VertexNormalInputs n = GetVertexNormalInputs(input.normalOS, input.tangentOS);
                o.positionCS = p.positionCS;
                o.positionWS = p.positionWS;
                o.normalWS = n.normalWS;
                o.tangentWS = n.tangentWS;
                o.bitangentWS = n.bitangentWS;
                o.uv = input.uv;
                o.fogFactor = ComputeFogFactor(p.positionCS.z);
                return o;
            }

            float2 ParallaxOcclusion(float2 uv, float3 viewTS)
            {
                int steps = (int)_ParallaxSteps;
                float layerDepth = 1.0 / steps;
                float currentDepth = 0;
                float2 delta = viewTS.xy / max(viewTS.z, .12) * _ParallaxDepth / steps;
                float2 currentUV = uv;
                float sampled = SAMPLE_TEXTURE2D(_GeneratedHeight, sampler_GeneratedHeight, currentUV).r;
                [loop] for (int i = 0; i < 32; i++)
                {
                    if (i >= steps || currentDepth >= sampled) break;
                    currentUV -= delta;
                    sampled = SAMPLE_TEXTURE2D(_GeneratedHeight, sampler_GeneratedHeight, currentUV).r;
                    currentDepth += layerDepth;
                }
                return currentUV;
            }

            half4 Frag(Varyings i) : SV_Target
            {
                float3 n = normalize(i.normalWS);
                float3 t = normalize(i.tangentWS);
                float3 b = normalize(i.bitangentWS);
                float3 v = normalize(GetCameraPositionWS() - i.positionWS);
                float3 viewTS = float3(dot(v, t), dot(v, b), dot(v, n));
                float2 uv = ParallaxOcclusion(i.uv, viewTS);
                float4 baseMap = SAMPLE_TEXTURE2D(_GeneratedBaseColor, sampler_GeneratedBaseColor, uv) * _BaseTint;
                float3 normalTS = SAMPLE_TEXTURE2D(_GeneratedNormal, sampler_GeneratedNormal, uv).xyz * 2.0 - 1.0;
                n = normalize(t * normalTS.x + b * normalTS.y + n * normalTS.z);
                float3 mask = SAMPLE_TEXTURE2D(_GeneratedMask, sampler_GeneratedMask, uv).rgb;
                float metallic = mask.r;
                float roughness = saturate(mask.g);
                float ao = mask.b;

                // Curvature surrogate from a high-frequency Voronoi edge mask.
                float macro = Worley3D(i.positionWS * 1.35);
                float wear = smoothstep(.12, .32, macro) * _WearAmount * saturate(1.0 - roughness);
                baseMap.rgb = lerp(baseMap.rgb, baseMap.rgb * 1.45 + .08, wear);
                roughness = lerp(roughness, .32, wear);

                // Dirt settles in low world space, rain washes it away.
                float low = saturate(1.0 - (i.positionWS.y - _ObjectBaseY) / max(_ObjectHeight, .01));
                float dirtNoise = Fbm3D(i.positionWS * 2.5, 4);
                float dirt = _Dirt * low * smoothstep(.32, .78, dirtNoise) * (1.0 - _Rain * .85);
                baseMap.rgb = lerp(baseMap.rgb, float3(.075, .058, .04), dirt * .75);
                roughness = lerp(roughness, .97, dirt);
                roughness = lerp(roughness, .18, _Rain * (1.0 - dirt));

                Light light = GetMainLight();
                float3 l = normalize(light.direction);
                float3 h = normalize(v + l);
                float ndl = saturate(dot(n, l));
                float ndv = saturate(dot(n, v));
                float ndh = saturate(dot(n, h));
                // Anisotropic lobe: tangent/bitangent exponents differ.
                float tdH = dot(t, h);
                float bdH = dot(b, h);
                float alphaT = lerp(.55, .12, _Anisotropy) * roughness;
                float alphaB = lerp(.55, .95, _Anisotropy) * roughness;
                float anisoD = exp(-(tdH * tdH / max(.001, alphaT * alphaT) + bdH * bdH / max(.001, alphaB * alphaB)) / max(.001, ndh * ndh));
                float3 f0 = lerp(.04.xxx, baseMap.rgb, metallic);
                float fresnel = pow(1.0 - saturate(dot(v, h)), 5.0);
                float3 specular = (f0 + fresnel) * anisoD * (1.0 - roughness * .5);
                float pulse = sin(_Time.y * (1.2 + _AudioPulse * 4.0) + macro * 12.0) * .015 * _AudioPulse;
                float3 ambient = SampleSH(n) * ao;
                float3 color = baseMap.rgb * (ambient + light.color * ndl * light.shadowAttenuation);
                color += specular * light.color * ndl;
                color += pulse * f0;
                color = MixFog(color, i.fogFactor);
                return half4(color, 1);
            }
            ENDHLSL
        }
    }
}