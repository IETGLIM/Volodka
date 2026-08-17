using UnityEngine;
using UnityEngine.Rendering;

namespace ProceduralRPG.Materials
{
    public enum ProceduralSurfaceType { Stone, Metal, Wood, Skin }

    /// <summary>
    /// Generates four unique material maps on the GPU and owns their lifetime.
    /// Maps are RenderTextures: no source PNG and no disk import is required.
    /// </summary>
    [ExecuteAlways]
    [RequireComponent(typeof(Renderer))]
    public sealed class ProceduralMaterialBaker : MonoBehaviour
    {
        [SerializeField] private ComputeShader materialCompute;
        [SerializeField] private ProceduralSurfaceType surfaceType = ProceduralSurfaceType.Stone;
        [SerializeField, Range(512, 2048)] private int textureResolution = 1024;
        [SerializeField, Range(.05f, 3f)] private float patternScale = .55f;
        [SerializeField] private int seed = 123;
        [SerializeField] private bool bakeOnEnable = true;
        [SerializeField] private bool preferSharedMaterial = false;

        private RenderTexture baseColor;
        private RenderTexture normal;
        private RenderTexture mask;
        private RenderTexture height;
        private MaterialPropertyBlock propertyBlock;
        private Renderer targetRenderer;

        private static readonly int BaseColorId = Shader.PropertyToID("_GeneratedBaseColor");
        private static readonly int NormalId = Shader.PropertyToID("_GeneratedNormal");
        private static readonly int MaskId = Shader.PropertyToID("_GeneratedMask");
        private static readonly int HeightId = Shader.PropertyToID("_GeneratedHeight");

        private void OnEnable()
        {
            targetRenderer = GetComponent<Renderer>();
            propertyBlock = new MaterialPropertyBlock();
            if (bakeOnEnable && materialCompute != null) Bake();
        }

        private void OnDisable() => ReleaseMaps();

        public void Configure(ComputeShader compute, ProceduralSurfaceType type, int newSeed, int resolution = 1024)
        {
            materialCompute = compute;
            surfaceType = type;
            seed = newSeed;
            textureResolution = resolution;
        }

        [ContextMenu("Bake GPU Material Maps")]
        public void Bake()
        {
            if (materialCompute == null) return;
            if (targetRenderer == null) targetRenderer = GetComponent<Renderer>();
            ReleaseMaps();
            int resolution = Mathf.ClosestPowerOfTwo(Mathf.Clamp(textureResolution, 512, 2048));
            baseColor = CreateMap(resolution, "Generated Base Color");
            normal = CreateMap(resolution, "Generated Normal");
            mask = CreateMap(resolution, "Generated Mask");
            height = CreateMap(resolution, "Generated Height");

            int kernel = materialCompute.FindKernel("KGenerateMaps");
            materialCompute.SetInt("_Resolution", resolution);
            materialCompute.SetFloat("_Seed", seed);
            materialCompute.SetVector("_WorldOrigin", transform.position);
            materialCompute.SetFloat("_PatternScale", patternScale);
            materialCompute.SetFloat("_MaterialMode", (float)surfaceType);
            materialCompute.SetTexture(kernel, "_BaseColor", baseColor);
            materialCompute.SetTexture(kernel, "_NormalMap", normal);
            materialCompute.SetTexture(kernel, "_MaskMap", mask);
            materialCompute.SetTexture(kernel, "_HeightMap", height);
            materialCompute.Dispatch(kernel, Mathf.CeilToInt(resolution / 8f), Mathf.CeilToInt(resolution / 8f), 1);

            propertyBlock.Clear();
            propertyBlock.SetTexture(BaseColorId, baseColor);
            propertyBlock.SetTexture(NormalId, normal);
            propertyBlock.SetTexture(MaskId, mask);
            propertyBlock.SetTexture(HeightId, height);
            propertyBlock.SetFloat("_MaterialSeed", seed);
            targetRenderer.SetPropertyBlock(propertyBlock);
        }

        private static RenderTexture CreateMap(int resolution, string name)
        {
            var map = new RenderTexture(resolution, resolution, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Linear)
            {
                name = name,
                enableRandomWrite = true,
                useMipMap = true,
                autoGenerateMips = true,
                wrapMode = TextureWrapMode.Repeat,
                filterMode = FilterMode.Trilinear
            };
            map.Create();
            return map;
        }

        private void ReleaseMaps()
        {
            Release(ref baseColor);
            Release(ref normal);
            Release(ref mask);
            Release(ref height);
        }

        private static void Release(ref RenderTexture map)
        {
            if (map == null) return;
            map.Release();
            if (Application.isPlaying) Destroy(map); else DestroyImmediate(map);
            map = null;
        }
    }
}