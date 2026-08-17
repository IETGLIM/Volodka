using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace ProceduralRPG.Rendering
{
    /// <summary>
    /// URP camera pass: short raymarch through height/distance density. It is a
    /// deliberate cinematic approximation, not a costly full froxel volume.
    /// </summary>
    public sealed class VolumetricFogFeature : ScriptableRendererFeature
    {
        [System.Serializable]
        public sealed class Settings
        {
            public Shader shader;
            [Range(.0001f, .08f)] public float density = .014f;
            [Range(0f, 20f)] public float baseHeight = 0f;
            [Range(.05f, 4f)] public float heightFalloff = .55f;
            [Range(4, 24)] public int raymarchSteps = 10;
            public Color fogColor = new Color(.42f, .51f, .62f, 1f);
            public RenderPassEvent passEvent = RenderPassEvent.BeforeRenderingPostProcessing;
        }

        public Settings settings = new Settings();
        private FogPass pass;

        public override void Create()
        {
            pass = new FogPass(settings) { renderPassEvent = settings.passEvent };
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
        {
            if (settings.shader == null || renderingData.cameraData.cameraType == CameraType.Preview) return;
            pass.Setup(renderer.cameraColorTargetHandle);
            renderer.EnqueuePass(pass);
        }

        protected override void Dispose(bool disposing) => pass?.Dispose();

        private sealed class FogPass : ScriptableRenderPass
        {
            private readonly Settings settings;
            private readonly Material material;
            private RTHandle source;
            private RTHandle temp;

            public FogPass(Settings sourceSettings)
            {
                settings = sourceSettings;
                material = CoreUtils.CreateEngineMaterial(sourceSettings.shader);
                ConfigureInput(ScriptableRenderPassInput.Depth);
            }

            public void Setup(RTHandle sourceTarget) => source = sourceTarget;

            public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
            {
                var descriptor = renderingData.cameraData.cameraTargetDescriptor;
                descriptor.depthBufferBits = 0;
                RenderingUtils.ReAllocateIfNeeded(ref temp, descriptor, FilterMode.Bilinear, TextureWrapMode.Clamp, name: "_ProceduralFogTemp");
            }

            public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
            {
                if (material == null) return;
                material.SetFloat("_FogDensity", settings.density);
                material.SetFloat("_FogBaseHeight", settings.baseHeight);
                material.SetFloat("_FogHeightFalloff", settings.heightFalloff);
                material.SetInt("_FogSteps", settings.raymarchSteps);
                material.SetColor("_FogColor", settings.fogColor);
                material.SetFloat("_RainFog", Shader.GetGlobalFloat("_ProceduralRain"));
                var cmd = CommandBufferPool.Get("Procedural Volumetric Fog");
                Blitter.BlitCameraTexture(cmd, source, temp, material, 0);
                Blitter.BlitCameraTexture(cmd, temp, source);
                context.ExecuteCommandBuffer(cmd);
                CommandBufferPool.Release(cmd);
            }

            public void Dispose()
            {
                temp?.Release();
                CoreUtils.Destroy(material);
            }
        }
    }
}