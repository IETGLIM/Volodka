using ProceduralRPG.Audio;
using ProceduralRPG.Characters;
using ProceduralRPG.Materials;
using ProceduralRPG.World;
using UnityEngine;
using UnityEngine.Rendering;

namespace ProceduralRPG.Core
{
    /// <summary>
    /// One-button bootstrap for the complete code-only scene. It produces a
    /// distinct layout from a seed, materials from compute, characters from
    /// capsules/spheres, and an atmospheric daylight / weather setup.
    /// </summary>
    [ExecuteAlways]
    public sealed class ProceduralSceneManager : MonoBehaviour
    {
        [Header("Required generated-code assets")]
        [SerializeField] private Shader triplanarWorldShader;
        [SerializeField] private Shader aaaSurfaceShader;
        [SerializeField] private Shader proceduralSkinShader;
        [SerializeField] private ComputeShader materialCompute;

        [Header("Scene tuning")]
        [SerializeField] private int seed = 2048;
        [SerializeField, Range(24, 80)] private int worldResolution = 52;
        [SerializeField] private bool generateOnStart;
        [SerializeField] private Transform generatedRoot;

        [Header("Atmosphere")]
        [SerializeField] private Color ambientSky = new Color(.18f, .25f, .35f);
        [SerializeField] private Color fogColor = new Color(.42f, .51f, .62f);

        private void Start()
        {
            if (generateOnStart && Application.isPlaying) GenerateEntireScene();
        }

        [ContextMenu("Generate Entire Scene")]
        public void GenerateEntireScene()
        {
            if (triplanarWorldShader == null) triplanarWorldShader = Shader.Find("ProceduralRPG/Triplanar SDF World");
            if (aaaSurfaceShader == null) aaaSurfaceShader = Shader.Find("ProceduralRPG/AAA Surface");
            if (proceduralSkinShader == null) proceduralSkinShader = Shader.Find("ProceduralRPG/Procedural Skin");
            if (triplanarWorldShader == null || aaaSurfaceShader == null || proceduralSkinShader == null)
            {
                Debug.LogError("Assign the ProceduralRPG shader assets in ProceduralSceneManager before generation.");
                return;
            }

            EnsureRoot();
            ClearGenerated();
            Random.InitState(seed);
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = ambientSky;
            RenderSettings.ambientEquatorColor = new Color(.27f, .23f, .18f);
            RenderSettings.ambientGroundColor = new Color(.08f, .11f, .08f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = fogColor;
            RenderSettings.fogDensity = .008f;

            var worldMaterial = new Material(triplanarWorldShader);
            worldMaterial.SetColor("_StoneColor", new Color(.26f, .30f, .32f));
            worldMaterial.SetColor("_MetalColor", new Color(.22f, .32f, .35f));
            worldMaterial.SetFloat("_PatternScale", .31f);
            worldMaterial.SetFloat("_MetalAmount", .16f);

            CreateSdfChunk("Citadel Ruins", Vector3.zero, new Vector3(36, 18, 36), worldMaterial, seed, true);
            CreateSdfChunk("Eastern Cliff", new Vector3(26, -2, -12), new Vector3(24, 18, 26), worldMaterial, seed + 31, false);
            CreateSdfChunk("Western Shrine", new Vector3(-24, -1, 18), new Vector3(22, 16, 22), worldMaterial, seed + 71, false);

            Material cloth = new Material(aaaSurfaceShader) { color = new Color(.16f, .24f, .34f) };
            Material boots = new Material(aaaSurfaceShader) { color = new Color(.06f, .05f, .04f) };
            Material skin = new Material(proceduralSkinShader) { color = new Color(.65f, .26f, .15f) };
            CreateCharacter("The Poet", new Vector3(0, 1.5f, 4f), skin, cloth, boots, seed + 9);
            CreateCharacter("The Watcher", new Vector3(-5f, 1.5f, -2f), skin, cloth, boots, seed + 89);

            CreateLightAndWeather();
            CreateSoundscape();
            EnsureCamera();
        }

        private void CreateSdfChunk(string title, Vector3 position, Vector3 size, Material material, int localSeed, bool ruinsPreset)
        {
            var node = new GameObject(title);
            node.transform.SetParent(generatedRoot, false);
            node.transform.localPosition = position;
            var world = node.AddComponent<SdfWorldGenerator>();
            world.Configure(size, worldResolution, material, localSeed);
            world.ClearPrimitives();
            if (ruinsPreset) world.CreateRuinsPreset();
            else
            {
                world.AddPrimitive(new SdfPrimitiveSettings { type = SdfPrimitiveType.Sphere, localPosition = new Vector3(-3, -2, 1), size = new Vector3(7, 0, 0), smoothUnion = 1.5f, noiseAmplitude = .42f, noiseFrequency = .17f });
                world.AddPrimitive(new SdfPrimitiveSettings { type = SdfPrimitiveType.Sphere, localPosition = new Vector3(5, -3, -3), size = new Vector3(8, 0, 0), smoothUnion = 1.9f, noiseAmplitude = .36f, noiseFrequency = .22f });
                world.AddPrimitive(new SdfPrimitiveSettings { type = SdfPrimitiveType.Box, localPosition = new Vector3(0, 1, 0), size = new Vector3(4, 5, 3), smoothUnion = .8f, noiseAmplitude = .16f, noiseFrequency = .32f });
                world.AddPrimitive(new SdfPrimitiveSettings { type = SdfPrimitiveType.Cylinder, localPosition = new Vector3(1, 3, 1), size = new Vector3(2.2f, 5.5f, 0), smoothUnion = .9f, noiseAmplitude = .25f, noiseFrequency = .18f });
            }
            world.Generate();
            node.AddComponent<SurfaceDirtController>();
            var audio = node.AddComponent<ProceduralSoundscape>();
            audio.Configure(ProceduralAudioMaterial.Stone, size.magnitude, localSeed, .12f);
            audio.Regenerate();
            var baker = node.AddComponent<ProceduralMaterialBaker>();
            baker.Configure(materialCompute, ProceduralSurfaceType.Stone, localSeed, 1024);
        }

        private void CreateCharacter(string title, Vector3 position, Material skin, Material cloth, Material boots, int characterSeed)
        {
            var node = new GameObject(title);
            node.transform.SetParent(generatedRoot, false);
            node.transform.localPosition = position;
            var character = node.AddComponent<ProceduralCharacter>();
            character.Configure(skin, cloth, boots, characterSeed);
            character.Generate();
            var ambience = node.AddComponent<ProceduralSoundscape>();
            ambience.Configure(ProceduralAudioMaterial.Cloth, 1.8f, characterSeed, .04f);
        }

        private void CreateLightAndWeather()
        {
            var sunNode = new GameObject("Procedural Sun");
            sunNode.transform.SetParent(generatedRoot, false);
            sunNode.transform.rotation = Quaternion.Euler(42, -35, 0);
            var sun = sunNode.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, .77f, .58f);
            sun.intensity = 1.3f;
            sun.shadows = LightShadows.Soft;
            var weather = generatedRoot.gameObject.GetComponent<ProceduralWeatherController>();
            if (weather == null) weather = generatedRoot.gameObject.AddComponent<ProceduralWeatherController>();
            weather.Configure(sun);
        }

        private void CreateSoundscape()
        {
            var node = new GameObject("Wind and Water Soundscape");
            node.transform.SetParent(generatedRoot, false);
            node.transform.localPosition = new Vector3(0, 4, 0);
            var sound = node.AddComponent<ProceduralSoundscape>();
            sound.Configure(ProceduralAudioMaterial.Wind, 18f, seed + 505, .16f);
        }

        private void EnsureCamera()
        {
            if (Camera.main != null) return;
            var cameraNode = new GameObject("Procedural Camera");
            cameraNode.transform.position = new Vector3(15, 10, 18);
            cameraNode.transform.LookAt(Vector3.zero + Vector3.up * 2f);
            cameraNode.tag = "MainCamera";
            cameraNode.AddComponent<Camera>();
            cameraNode.AddComponent<AudioListener>();
        }

        private void EnsureRoot()
        {
            if (generatedRoot != null) return;
            var root = new GameObject("Generated Procedural World");
            root.transform.SetParent(transform, false);
            generatedRoot = root.transform;
        }

        private void ClearGenerated()
        {
            for (int i = generatedRoot.childCount - 1; i >= 0; i--)
            {
                var child = generatedRoot.GetChild(i).gameObject;
                if (Application.isPlaying) Destroy(child); else DestroyImmediate(child);
            }
        }
    }
}