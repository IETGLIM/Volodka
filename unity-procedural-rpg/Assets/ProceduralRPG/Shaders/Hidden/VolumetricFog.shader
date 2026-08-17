Shader "Hidden/ProceduralRPG/VolumetricFog"
{
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" }
        Pass
        {
            ZTest Always ZWrite Off Cull Off
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
            TEXTURE2D_X(_BlitTexture); SAMPLER(sampler_LinearClamp);
            float4 _FogColor;
            float _FogDensity, _FogBaseHeight, _FogHeightFalloff, _RainFog;
            int _FogSteps;

            half4 Frag(Varyings input) : SV_Target
            {
                float2 uv = input.texcoord;
                float rawDepth = SampleSceneDepth(uv);
                float3 worldEnd = ComputeWorldSpacePosition(uv, rawDepth, UNITY_MATRIX_I_VP);
                float3 cameraPos = GetCameraPositionWS();
                float3 ray = worldEnd - cameraPos;
                float distanceToSurface = length(ray);
                float3 dir = ray / max(distanceToSurface, .0001);
                int steps = max(1, _FogSteps);
                float stepLength = distanceToSurface / steps;
                float transmittance = 1.0;
                float scattering = 0.0;
                Light main = GetMainLight();
                [loop] for (int i = 0; i < 24; i++)
                {
                    if (i >= steps) break;
                    float travel = (i + .5) * stepLength;
                    float3 p = cameraPos + dir * travel;
                    float heightDensity = exp(-max(0, p.y - _FogBaseHeight) * _FogHeightFalloff);
                    float noise = sin(p.x * .17 + p.z * .13 + _Time.y * .08) * .15 + .85;
                    float density = _FogDensity * heightDensity * noise * (1.0 + _RainFog * 1.4);
                    float sunForward = saturate(dot(dir, -main.direction));
                    float phase = pow(sunForward, 10.0) * .55 + .45;
                    scattering += transmittance * density * phase * stepLength;
                    transmittance *= exp(-density * stepLength);
                }
                float3 source = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv).rgb;
                float3 fog = _FogColor.rgb * scattering * main.color;
                return half4(source * transmittance + fog, 1);
            }
            ENDHLSL
        }
    }
}