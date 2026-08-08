Shader "Hidden/ProceduralRPG/AutoColorGrade"
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
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"
            TEXTURE2D_X(_BlitTexture); SAMPLER(sampler_LinearClamp);
            TEXTURE2D(_AutoLut); SAMPLER(sampler_AutoLut);
            float _GradeStrength;
            float3 SampleLut(float3 c)
            {
                c = saturate(c);
                float blue = c.b * 31.0;
                float b0 = floor(blue);
                float b1 = min(31.0, b0 + 1.0);
                float2 uv0 = float2((c.r * 31.0 + b0 * 32.0 + .5) / 1024.0, (c.g * 31.0 + .5) / 32.0);
                float2 uv1 = float2((c.r * 31.0 + b1 * 32.0 + .5) / 1024.0, (c.g * 31.0 + .5) / 32.0);
                return lerp(SAMPLE_TEXTURE2D(_AutoLut, sampler_AutoLut, uv0).rgb, SAMPLE_TEXTURE2D(_AutoLut, sampler_AutoLut, uv1).rgb, frac(blue));
            }
            half4 Frag(Varyings input) : SV_Target
            {
                float3 source = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, input.texcoord).rgb;
                return half4(lerp(source, SampleLut(source), _GradeStrength), 1);
            }
            ENDHLSL
        }
    }
}