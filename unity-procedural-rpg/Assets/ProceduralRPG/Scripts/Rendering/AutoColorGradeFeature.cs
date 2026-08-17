using Unity.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace ProceduralRPG.Rendering
{
    /// <summary>
    /// Creates a runtime 32^3 strip LUT from the average scene colour. A tiny
    /// 16x16 downsample is asynchronously read back every update interval;
    /// this keeps the cost low while adapting grading like a film colourist.
    /// </summary>
    public sealed class AutoColorGradeFeature : ScriptableRendererFeature
    {
        [System.Serializable]
        public sealed class Settings
        {
            public Shader gradeShader;
            [Range(.1f, 4f)] public float updateInterval = .75f;
            [Range(0f, 1f)] public float gradeStrength = .65f;
            public RenderPassEvent passEvent = RenderPassEvent.AfterRenderingPostProcessing;
        }

        public Settings settings = new Settings();
        private GradePass pass;

        public override void Create() => pass = new GradePass(settings) { renderPassEvent = settings.passEvent };
        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
        {
            if (settings.gradeShader == null || renderingData.cameraData.cameraType == CameraType.Preview) return;
            pass.Setup(renderer.cameraColorTargetHandle);
            renderer.EnqueuePass(pass);
        }
        protected override void Dispose(bool disposing) => pass?.Dispose();

        private sealed class GradePass : ScriptableRenderPass
        {
            private readonly Settings settings;
            private readonly Material material;
            private readonly Texture2D lut;
            private RTHandle source, temp, average;
            private float nextReadback;
            private bool readbackPending;
            private Color sceneAverage = Color.gray;

            public GradePass(Settings s)
            {
                settings = s;
                material = CoreUtils.CreateEngineMaterial(s.gradeShader);
                lut = new Texture2D(32 * 32, 32, TextureFormat.RGBA32, false, true) { name = "Runtime Auto Grade LUT", wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
                BuildLut();
            }
            public void Setup(RTHandle cameraTarget) => source = cameraTarget;
            public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
            {
                var desc = renderingData.cameraData.cameraTargetDescriptor;
                desc.depthBufferBits = 0;
                RenderingUtils.ReAllocateIfNeeded(ref temp, desc, FilterMode.Bilinear, TextureWrapMode.Clamp, name: "_AutoGradeTemp");
                var small = desc;
                small.width = 16; small.height = 16;
                RenderingUtils.ReAllocateIfNeeded(ref average, small, FilterMode.Bilinear, TextureWrapMode.Clamp, name: "_AutoGradeAverage");
            }
            public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
            {
                var cmd = CommandBufferPool.Get("Procedural Auto Grade");
                if (Time.unscaledTime >= nextReadback && !readbackPending)
                {
                    nextReadback = Time.unscaledTime + settings.updateInterval;
                    Blitter.BlitCameraTexture(cmd, source, average);
                    context.ExecuteCommandBuffer(cmd);
                    cmd.Clear();
                    readbackPending = true;
                    AsyncGPUReadback.Request(average.rt, 0, request =>
                    {
                        readbackPending = false;
                        if (request.hasError) return;
                        NativeArray<Color32> pixels = request.GetData<Color32>();
                        Color sum = Color.black;
                        for (int i = 0; i < pixels.Length; i++) sum += (Color)pixels[i];
                        sceneAverage = sum / Mathf.Max(1, pixels.Length);
                        BuildLut();
                    });
                }
                material.SetTexture("_AutoLut", lut);
                material.SetFloat("_GradeStrength", settings.gradeStrength);
                Blitter.BlitCameraTexture(cmd, source, temp, material, 0);
                Blitter.BlitCameraTexture(cmd, temp, source);
                context.ExecuteCommandBuffer(cmd);
                CommandBufferPool.Release(cmd);
            }
            private void BuildLut()
            {
                // Neutralise a portion of the average colour, retain warm
                // highlights and cool dense shadows. This is a runtime LUT,
                // not an imported grading asset.
                float luminance = Mathf.Max(.05f, sceneAverage.r * .2126f + sceneAverage.g * .7152f + sceneAverage.b * .0722f);
                float exposure = Mathf.Clamp(0.52f / luminance, .75f, 1.35f);
                Color balance = new Color(1f / Mathf.Max(.2f, sceneAverage.r), 1f / Mathf.Max(.2f, sceneAverage.g), 1f / Mathf.Max(.2f, sceneAverage.b), 1);
                for (int b = 0; b < 32; b++)
                for (int g = 0; g < 32; g++)
                for (int r = 0; r < 32; r++)
                {
                    Color c = new Color(r / 31f, g / 31f, b / 31f);
                    c *= exposure;
                    c = Color.Lerp(c, new Color(c.r * balance.r, c.g * balance.g, c.b * balance.b), .28f);
                    float shadow = 1f - Mathf.Clamp01((c.r + c.g + c.b) / 1.5f);
                    c = Color.Lerp(c, new Color(c.r * .87f, c.g * .95f, Mathf.Min(1f, c.b * 1.08f)), shadow * .22f);
                    lut.SetPixel(r + b * 32, g, c);
                }
                lut.Apply(false, false);
            }
            public void Dispose()
            {
                temp?.Release(); average?.Release();
                CoreUtils.Destroy(material); CoreUtils.Destroy(lut);
            }
        }
    }
}