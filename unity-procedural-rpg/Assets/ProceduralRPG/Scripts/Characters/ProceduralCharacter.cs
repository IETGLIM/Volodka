using System;
using UnityEngine;
using UnityEngine.Rendering;

namespace ProceduralRPG.Characters
{
    /// <summary>
    /// Authorial runtime character. The body uses Unity primitive topology only;
    /// the face is an authored harmonic deformation of an UV sphere. A generic
    /// transform rig is created so FABRIK can animate every generated variant.
    /// </summary>
    [ExecuteAlways]
    public sealed class ProceduralCharacter : MonoBehaviour
    {
        [Header("Identity and silhouette")]
        [SerializeField, Range(1.35f, 2.25f)] private float height = 1.78f;
        [SerializeField, Range(.7f, 1.5f)] private float shoulderWidth = 1.05f;
        [SerializeField, Range(.75f, 1.25f)] private float armProportion = 1f;
        [SerializeField, Range(.75f, 1.25f)] private float legProportion = 1f;
        [SerializeField, Range(-18f, 18f)] private float spineLeanDegrees = 3f;
        [SerializeField] private int faceSeed = 42;

        [Header("Face harmonic controls")]
        [SerializeField, Range(0f, .16f)] private float cheekboneStrength = .07f;
        [SerializeField, Range(0f, .16f)] private float noseStrength = .11f;
        [SerializeField, Range(0f, .12f)] private float eyeSocketStrength = .06f;

        [Header("Materials")]
        [SerializeField] private Material skinMaterial;
        [SerializeField] private Material clothMaterial;
        [SerializeField] private Material bootMaterial;
        [SerializeField] private bool generateOnStart = true;

        public Transform Hips { get; private set; }
        public Transform Spine { get; private set; }
        public Transform Head { get; private set; }
        public Transform LeftShoulder { get; private set; }
        public Transform RightShoulder { get; private set; }
        public Transform LeftElbow { get; private set; }
        public Transform RightElbow { get; private set; }
        public Transform LeftHand { get; private set; }
        public Transform RightHand { get; private set; }
        public Transform LeftHip { get; private set; }
        public Transform RightHip { get; private set; }
        public Transform LeftKnee { get; private set; }
        public Transform RightKnee { get; private set; }
        public Transform LeftAnkle { get; private set; }
        public Transform RightAnkle { get; private set; }

        private void Start()
        {
            if (generateOnStart && Application.isPlaying) Generate();
        }

        public void Configure(Material skin, Material cloth, Material boots, int newSeed)
        {
            skinMaterial = skin;
            clothMaterial = cloth;
            bootMaterial = boots;
            faceSeed = newSeed;
        }

        [ContextMenu("Generate Character")]
        public void Generate()
        {
            ClearChildren();
            float scale = height / 1.78f;
            Hips = Joint("Hips", transform, new Vector3(0, height * .51f, 0));
            Spine = Joint("Spine", Hips, new Vector3(0, height * .18f, 0));
            Spine.localRotation = Quaternion.Euler(spineLeanDegrees, 0, 0);
            Head = Joint("Head", Spine, new Vector3(0, height * .30f, 0));

            // Torso uses a capsule and a slightly wider shoulder mass.
            AddPrimitive("Torso", PrimitiveType.Capsule, Spine, new Vector3(0, height * .09f, 0), new Vector3(.43f * shoulderWidth, height * .38f, .31f), clothMaterial);
            AddPrimitive("Shoulders", PrimitiveType.Sphere, Spine, new Vector3(0, height * .25f, 0), new Vector3(.58f * shoulderWidth, .22f, .31f), clothMaterial);
            AddPrimitive("Neck", PrimitiveType.Capsule, Head, new Vector3(0, -.06f * scale, 0), new Vector3(.13f, .18f, .13f), skinMaterial);
            CreateFace(Head, scale);

            float shoulderY = height * .24f;
            float shoulderX = .48f * shoulderWidth;
            LeftShoulder = Joint("LeftShoulder", Spine, new Vector3(-shoulderX, shoulderY, 0));
            RightShoulder = Joint("RightShoulder", Spine, new Vector3(shoulderX, shoulderY, 0));
            CreateArm(true, scale);
            CreateArm(false, scale);

            float hipX = .20f * shoulderWidth;
            LeftHip = Joint("LeftHip", Hips, new Vector3(-hipX, 0, 0));
            RightHip = Joint("RightHip", Hips, new Vector3(hipX, 0, 0));
            CreateLeg(true, scale);
            CreateLeg(false, scale);

            var ik = GetComponent<FabrikFootIK>();
            if (ik == null) ik = gameObject.AddComponent<FabrikFootIK>();
            ik.Configure(this);
        }

        private void CreateArm(bool left, float scale)
        {
            float side = left ? -1f : 1f;
            Transform shoulder = left ? LeftShoulder : RightShoulder;
            Transform elbow = Joint(left ? "LeftElbow" : "RightElbow", shoulder, new Vector3(side * .02f, -.37f * armProportion * scale, .03f));
            Transform hand = Joint(left ? "LeftHand" : "RightHand", elbow, new Vector3(side * .02f, -.34f * armProportion * scale, .01f));
            AddPrimitive("UpperArm", PrimitiveType.Capsule, shoulder, new Vector3(side * .02f, -.19f * armProportion * scale, 0), new Vector3(.12f, .39f * armProportion * scale, .12f), clothMaterial);
            AddPrimitive("Forearm", PrimitiveType.Capsule, elbow, new Vector3(side * .02f, -.18f * armProportion * scale, 0), new Vector3(.10f, .36f * armProportion * scale, .10f), clothMaterial);
            AddPrimitive("Hand", PrimitiveType.Sphere, hand, new Vector3(0, -.02f, .02f), new Vector3(.11f, .13f, .08f), skinMaterial);
            if (left) { LeftElbow = elbow; LeftHand = hand; } else { RightElbow = elbow; RightHand = hand; }
        }

        private void CreateLeg(bool left, float scale)
        {
            float side = left ? -1f : 1f;
            Transform hip = left ? LeftHip : RightHip;
            Transform knee = Joint(left ? "LeftKnee" : "RightKnee", hip, new Vector3(side * .01f, -.48f * legProportion * scale, .05f));
            Transform ankle = Joint(left ? "LeftAnkle" : "RightAnkle", knee, new Vector3(side * .01f, -.47f * legProportion * scale, -.05f));
            AddPrimitive("Thigh", PrimitiveType.Capsule, hip, new Vector3(0, -.24f * legProportion * scale, 0), new Vector3(.16f, .48f * legProportion * scale, .16f), clothMaterial);
            AddPrimitive("Shin", PrimitiveType.Capsule, knee, new Vector3(0, -.23f * legProportion * scale, 0), new Vector3(.13f, .46f * legProportion * scale, .13f), clothMaterial);
            AddPrimitive("Boot", PrimitiveType.Cube, ankle, new Vector3(0, -.06f, .10f), new Vector3(.19f, .12f, .36f), bootMaterial);
            if (left) { LeftKnee = knee; LeftAnkle = ankle; } else { RightKnee = knee; RightAnkle = ankle; }
        }

        private void CreateFace(Transform parent, float scale)
        {
            var face = new GameObject("Harmonic Face");
            face.transform.SetParent(parent, false);
            face.transform.localPosition = new Vector3(0, height * .085f, .015f);
            face.transform.localScale = new Vector3(.215f * scale, .255f * scale, .205f * scale);
            var filter = face.AddComponent<MeshFilter>();
            var renderer = face.AddComponent<MeshRenderer>();
            filter.sharedMesh = BuildHarmonicFace(28, 20);
            renderer.sharedMaterial = skinMaterial;
        }

        private Mesh BuildHarmonicFace(int longitude, int latitude)
        {
            var vertices = new Vector3[(longitude + 1) * (latitude + 1)];
            var triangles = new int[longitude * latitude * 6];
            for (int y = 0; y <= latitude; y++)
            for (int x = 0; x <= longitude; x++)
            {
                float u = x / (float)longitude;
                float v = y / (float)latitude;
                float theta = u * Mathf.PI * 2f;
                float phi = v * Mathf.PI;
                Vector3 n = new Vector3(Mathf.Sin(phi) * Mathf.Cos(theta), Mathf.Cos(phi), Mathf.Sin(phi) * Mathf.Sin(theta));
                // Harmonic face deformation. Cheeks are lateral gaussians, nose
                // pushes the frontal lobe, sockets carve shallow negative bowls.
                float front = Mathf.Max(0f, n.z);
                float cheeks = cheekboneStrength * Mathf.Exp(-Mathf.Pow((Mathf.Abs(n.x) - .55f) * 4f, 2f)) * Mathf.Exp(-Mathf.Pow((n.y + .05f) * 3f, 2f)) * front;
                float nose = noseStrength * Mathf.Exp(-Mathf.Pow(n.x * 7f, 2f)) * Mathf.Exp(-Mathf.Pow((n.y + .02f) * 5f, 2f)) * front;
                float eyeSockets = eyeSocketStrength * Mathf.Exp(-Mathf.Pow((Mathf.Abs(n.x) - .32f) * 7f, 2f)) * Mathf.Exp(-Mathf.Pow((n.y - .16f) * 8f, 2f)) * front;
                float asymmetry = Mathf.Sin(theta * 3f + faceSeed * .19f) * Mathf.Sin(phi * 4f) * .012f;
                float radius = 1f + cheeks + nose - eyeSockets + asymmetry;
                vertices[y * (longitude + 1) + x] = n * radius;
            }
            int t = 0;
            for (int y = 0; y < latitude; y++)
            for (int x = 0; x < longitude; x++)
            {
                int i = y * (longitude + 1) + x;
                triangles[t++] = i; triangles[t++] = i + longitude + 1; triangles[t++] = i + 1;
                triangles[t++] = i + 1; triangles[t++] = i + longitude + 1; triangles[t++] = i + longitude + 2;
            }
            var mesh = new Mesh { name = "Harmonic Face" };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static Transform Joint(string name, Transform parent, Vector3 localPosition)
        {
            var joint = new GameObject(name).transform;
            joint.SetParent(parent, false);
            joint.localPosition = localPosition;
            return joint;
        }

        private static void AddPrimitive(string name, PrimitiveType type, Transform parent, Vector3 localPosition, Vector3 localScale, Material material)
        {
            var part = GameObject.CreatePrimitive(type);
            part.name = name;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = localPosition;
            part.transform.localScale = localScale;
            var collider = part.GetComponent<Collider>();
            if (collider != null)
            {
                if (Application.isPlaying) Destroy(collider); else DestroyImmediate(collider);
            }
            var renderer = part.GetComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
        }

        private void ClearChildren()
        {
            for (int i = transform.childCount - 1; i >= 0; i--)
            {
                var child = transform.GetChild(i).gameObject;
                if (Application.isPlaying) Destroy(child); else DestroyImmediate(child);
            }
        }
    }
}