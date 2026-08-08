using System;
using System.Collections.Generic;
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace ProceduralRPG.World
{
    public enum SdfPrimitiveType { Sphere, Box, Cylinder }

    [Serializable]
    public struct SdfPrimitiveSettings
    {
        public SdfPrimitiveType type;
        public Vector3 localPosition;
        [Min(0.01f)] public Vector3 size;
        [Range(0f, 3f)] public float smoothUnion;
        [Range(0f, 1.2f)] public float noiseAmplitude;
        [Range(0.1f, 0.5f)] public float noiseFrequency;
    }

    /// <summary>
    /// Code-only SDF world mesh generator. Burst samples the signed-distance
    /// field; the main thread turns the completed scalar grid into triangles.
    /// Marching tetrahedra is deliberately used instead of a giant 256-case
    /// marching-cubes table: it is compact, robust, and easy to art-direct.
    /// </summary>
    [ExecuteAlways]
    [RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
    public sealed class SdfWorldGenerator : MonoBehaviour
    {
        [Header("Volume")]
        [SerializeField] private Vector3 volumeSize = new Vector3(36f, 18f, 36f);
        [SerializeField, Range(16, 96)] private int resolution = 54;
        [SerializeField] private bool closeBottom = true;

        [Header("SDF forms")]
        [SerializeField] private List<SdfPrimitiveSettings> primitives = new List<SdfPrimitiveSettings>();
        [SerializeField] private Material generatedMaterial;

        [Header("Organic finish")]
        [SerializeField, Range(0f, 0.8f)] private float finalVertexNoise = 0.08f;
        [SerializeField, Range(0.1f, 0.5f)] private float finalNoiseFrequency = 0.22f;
        [SerializeField] private int deterministicSeed = 1307;

        private MeshFilter meshFilter;
        private MeshRenderer meshRenderer;
        private NativeArray<SdfPrimitiveData> nativePrimitives;
        private NativeArray<float> field;

        private static readonly int[,] Tetrahedra =
        {
            { 0, 5, 1, 6 }, { 0, 1, 2, 6 }, { 0, 2, 3, 6 },
            { 0, 3, 7, 6 }, { 0, 7, 4, 6 }, { 0, 4, 5, 6 }
        };

        private void OnEnable()
        {
            meshFilter = GetComponent<MeshFilter>();
            meshRenderer = GetComponent<MeshRenderer>();
            if (generatedMaterial != null) meshRenderer.sharedMaterial = generatedMaterial;
        }

        private void OnDisable() => DisposeNative();

        [ContextMenu("Generate SDF Mesh")]
        public void Generate()
        {
            if (meshFilter == null) OnEnable();
            DisposeNative();
            if (primitives.Count == 0) CreateRuinsPreset();

            int samplesPerAxis = resolution + 1;
            int sampleCount = samplesPerAxis * samplesPerAxis * samplesPerAxis;
            nativePrimitives = new NativeArray<SdfPrimitiveData>(primitives.Count, Allocator.TempJob);
            for (int i = 0; i < primitives.Count; i++) nativePrimitives[i] = SdfPrimitiveData.From(primitives[i]);
            field = new NativeArray<float>(sampleCount, Allocator.TempJob, NativeArrayOptions.UninitializedMemory);

            var job = new SampleFieldJob
            {
                Resolution = resolution,
                VolumeSize = (float3)volumeSize,
                CloseBottom = closeBottom ? 1 : 0,
                Primitives = nativePrimitives,
                Field = field
            };
            job.Schedule(sampleCount, 128).Complete();

            BuildMeshFromField();
            DisposeNative();
        }

        public void ClearPrimitives() => primitives.Clear();

        public void AddPrimitive(SdfPrimitiveSettings primitive) => primitives.Add(primitive);

        public void Configure(Vector3 newVolumeSize, int newResolution, Material material, int newSeed)
        {
            volumeSize = newVolumeSize;
            resolution = Mathf.Clamp(newResolution, 16, 96);
            generatedMaterial = material;
            deterministicSeed = newSeed;
            if (meshRenderer == null) OnEnable();
            meshRenderer.sharedMaterial = generatedMaterial;
        }

        public void CreateRuinsPreset()
        {
            primitives.Clear();
            // Foundation and broken tower.
            primitives.Add(Form(SdfPrimitiveType.Box, new Vector3(0f, -3.8f, 0f), new Vector3(13f, 3.5f, 13f), 1.5f, 0.16f));
            primitives.Add(Form(SdfPrimitiveType.Cylinder, new Vector3(-3.5f, 1.4f, -2f), new Vector3(3.3f, 6.8f, 0f), 0.85f, 0.24f));
            primitives.Add(Form(SdfPrimitiveType.Cylinder, new Vector3(4.8f, 0.2f, 3.8f), new Vector3(2.5f, 4.2f, 0f), 0.7f, 0.3f));
            primitives.Add(Form(SdfPrimitiveType.Box, new Vector3(1.2f, 1.0f, -5.4f), new Vector3(7.5f, 4f, 2f), 1.2f, 0.18f));
            // Eroded cliff masses.
            primitives.Add(Form(SdfPrimitiveType.Sphere, new Vector3(-10f, -1f, 6f), new Vector3(7f, 7f, 7f), 1.7f, 0.35f));
            primitives.Add(Form(SdfPrimitiveType.Sphere, new Vector3(9.5f, -2f, -8f), new Vector3(8f, 6f, 8f), 1.8f, 0.42f));
        }

        private static SdfPrimitiveSettings Form(SdfPrimitiveType type, Vector3 pos, Vector3 size, float smooth, float noise)
        {
            return new SdfPrimitiveSettings
            {
                type = type,
                localPosition = pos,
                size = size,
                smoothUnion = smooth,
                noiseAmplitude = noise,
                noiseFrequency = 0.18f
            };
        }

        private void BuildMeshFromField()
        {
            var vertices = new List<Vector3>(resolution * resolution * 4);
            var normals = new List<Vector3>(resolution * resolution * 4);
            var triangles = new List<int>(resolution * resolution * 12);
            float3 cell = (float3)volumeSize / resolution;
            float3 min = -(float3)volumeSize * 0.5f;

            for (int z = 0; z < resolution; z++)
            for (int y = 0; y < resolution; y++)
            for (int x = 0; x < resolution; x++)
            {
                float3[] p = new float3[8];
                float[] v = new float[8];
                for (int c = 0; c < 8; c++)
                {
                    int ox = (c & 1);
                    int oy = (c >> 1) & 1;
                    int oz = (c >> 2) & 1;
                    p[c] = min + new float3(x + ox, y + oy, z + oz) * cell;
                    v[c] = field[FieldIndex(x + ox, y + oy, z + oz)];
                }

                for (int t = 0; t < 6; t++)
                {
                    int a = Tetrahedra[t, 0];
                    int b = Tetrahedra[t, 1];
                    int c = Tetrahedra[t, 2];
                    int d = Tetrahedra[t, 3];
                    EmitTetrahedron(p[a], p[b], p[c], p[d], v[a], v[b], v[c], v[d], vertices, normals, triangles);
                }
            }

            var mesh = new Mesh { name = $"SDF World ({deterministicSeed})", indexFormat = IndexFormat.UInt32 };
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetTriangles(triangles, 0, true);
            mesh.RecalculateBounds();
            if (meshFilter.sharedMesh != null)
            {
                if (Application.isPlaying) Destroy(meshFilter.sharedMesh); else DestroyImmediate(meshFilter.sharedMesh);
            }
            meshFilter.sharedMesh = mesh;
            if (generatedMaterial != null) meshRenderer.sharedMaterial = generatedMaterial;
        }

        private void EmitTetrahedron(
            float3 p0, float3 p1, float3 p2, float3 p3,
            float v0, float v1, float v2, float v3,
            List<Vector3> vertices, List<Vector3> normals, List<int> triangles)
        {
            float3[] p = { p0, p1, p2, p3 };
            float[] v = { v0, v1, v2, v3 };
            int[,] edges = { { 0, 1 }, { 0, 2 }, { 0, 3 }, { 1, 2 }, { 1, 3 }, { 2, 3 } };
            var intersections = new List<float3>(4);
            for (int e = 0; e < 6; e++)
            {
                int a = edges[e, 0];
                int b = edges[e, 1];
                if ((v[a] < 0f) == (v[b] < 0f)) continue;
                float t = v[a] / (v[a] - v[b]);
                intersections.Add(math.lerp(p[a], p[b], t));
            }
            if (intersections.Count < 3) return;
            if (intersections.Count == 3)
            {
                EmitTriangle(intersections[0], intersections[1], intersections[2], vertices, normals, triangles);
            }
            else
            {
                EmitTriangle(intersections[0], intersections[1], intersections[2], vertices, normals, triangles);
                EmitTriangle(intersections[0], intersections[2], intersections[3], vertices, normals, triangles);
            }
        }

        private void EmitTriangle(float3 a, float3 b, float3 c, List<Vector3> vertices, List<Vector3> normals, List<int> triangles)
        {
            int start = vertices.Count;
            float3[] points = { a, b, c };
            for (int i = 0; i < 3; i++)
            {
                float3 point = points[i];
                // Fine vertex perturbation avoids mathematically perfect edges.
                float n = noise.snoise(point * finalNoiseFrequency + deterministicSeed * 0.01f);
                point += EvaluateNormal(point) * n * finalVertexNoise;
                vertices.Add((Vector3)point);
                normals.Add((Vector3)EvaluateNormal(point));
            }
            // Flip to match the SDF gradient convention.
            triangles.Add(start); triangles.Add(start + 2); triangles.Add(start + 1);
        }

        private float3 EvaluateNormal(float3 p)
        {
            const float e = 0.03f;
            float dx = EvaluateSdfMain(p + new float3(e, 0, 0)) - EvaluateSdfMain(p - new float3(e, 0, 0));
            float dy = EvaluateSdfMain(p + new float3(0, e, 0)) - EvaluateSdfMain(p - new float3(0, e, 0));
            float dz = EvaluateSdfMain(p + new float3(0, 0, e)) - EvaluateSdfMain(p - new float3(0, 0, e));
            return math.normalizesafe(new float3(dx, dy, dz), new float3(0, 1, 0));
        }

        private float EvaluateSdfMain(float3 p)
        {
            float distance = 9999f;
            for (int i = 0; i < primitives.Count; i++)
            {
                var s = primitives[i];
                float3 q = p - (float3)s.localPosition;
                float d;
                if (s.type == SdfPrimitiveType.Sphere)
                    d = math.length(q) - s.size.x;
                else if (s.type == SdfPrimitiveType.Box)
                {
                    float3 b = math.abs(q) - (float3)s.size;
                    d = math.length(math.max(b, 0f)) + math.min(math.max(b.x, math.max(b.y, b.z)), 0f);
                }
                else
                {
                    float2 c = new float2(math.length(q.xz), q.y);
                    float2 b = new float2(s.size.x, s.size.y);
                    float2 w = math.abs(c) - b;
                    d = math.length(math.max(w, 0f)) + math.min(math.max(w.x, w.y), 0f);
                }
                d += noise.snoise(q * s.noiseFrequency + deterministicSeed * 0.01f) * s.noiseAmplitude;
                float k = math.max(0.0001f, s.smoothUnion);
                float h = math.clamp(0.5f + 0.5f * (d - distance) / k, 0f, 1f);
                distance = math.lerp(d, distance, h) - k * h * (1f - h);
            }
            return closeBottom ? math.max(distance, -p.y - volumeSize.y * 0.48f) : distance;
        }

        private int FieldIndex(int x, int y, int z)
        {
            int axis = resolution + 1;
            return x + axis * (y + axis * z);
        }

        private void DisposeNative()
        {
            if (nativePrimitives.IsCreated) nativePrimitives.Dispose();
            if (field.IsCreated) field.Dispose();
        }

        private struct SdfPrimitiveData
        {
            public float3 Position;
            public float3 Size;
            public int Type;
            public float Smooth;
            public float NoiseAmplitude;
            public float NoiseFrequency;

            public static SdfPrimitiveData From(SdfPrimitiveSettings source) => new SdfPrimitiveData
            {
                Position = source.localPosition,
                Size = source.size,
                Type = (int)source.type,
                Smooth = math.max(0.001f, source.smoothUnion),
                NoiseAmplitude = source.noiseAmplitude,
                NoiseFrequency = source.noiseFrequency
            };
        }

        [BurstCompile(FloatPrecision.Low, FloatMode.Fast)]
        private struct SampleFieldJob : IJobParallelFor
        {
            public int Resolution;
            public float3 VolumeSize;
            public int CloseBottom;
            [ReadOnly] public NativeArray<SdfPrimitiveData> Primitives;
            [WriteOnly] public NativeArray<float> Field;

            public void Execute(int index)
            {
                int axis = Resolution + 1;
                int x = index % axis;
                int y = (index / axis) % axis;
                int z = index / (axis * axis);
                float3 p = -VolumeSize * 0.5f + new float3(x, y, z) * (VolumeSize / Resolution);
                float distance = 9999f;
                for (int i = 0; i < Primitives.Length; i++)
                {
                    SdfPrimitiveData s = Primitives[i];
                    float3 q = p - s.Position;
                    float d;
                    if (s.Type == (int)SdfPrimitiveType.Sphere)
                        d = math.length(q) - s.Size.x;
                    else if (s.Type == (int)SdfPrimitiveType.Box)
                    {
                        float3 b = math.abs(q) - s.Size;
                        d = math.length(math.max(b, 0f)) + math.min(math.max(b.x, math.max(b.y, b.z)), 0f);
                    }
                    else
                    {
                        float2 c = new float2(math.length(q.xz), q.y);
                        float2 b = new float2(s.Size.x, s.Size.y);
                        float2 w = math.abs(c) - b;
                        d = math.length(math.max(w, 0f)) + math.min(math.max(w.x, w.y), 0f);
                    }
                    d += noise.snoise(q * s.NoiseFrequency) * s.NoiseAmplitude;
                    float h = math.clamp(0.5f + 0.5f * (d - distance) / s.Smooth, 0f, 1f);
                    distance = math.lerp(d, distance, h) - s.Smooth * h * (1f - h);
                }
                if (CloseBottom == 1) distance = math.max(distance, -p.y - VolumeSize.y * .48f);
                Field[index] = distance;
            }
        }
    }
}