using UnityEngine;

namespace ProceduralRPG.Materials
{
    /// <summary>Accumulates dust over time, then lets rain wash it away.</summary>
    [ExecuteAlways]
    [RequireComponent(typeof(Renderer))]
    public sealed class SurfaceDirtController : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float initialDirt = .2f;
        [SerializeField, Range(0f, .1f)] private float dustPerSecond = .004f;
        [SerializeField, Range(0f, .5f)] private float rainWashPerSecond = .12f;
        [SerializeField] private float objectHeight = 2f;
        [SerializeField] private string rainGlobalName = "_ProceduralRain";

        private Renderer targetRenderer;
        private MaterialPropertyBlock block;
        private float dirt;

        private void OnEnable()
        {
            targetRenderer = GetComponent<Renderer>();
            block = new MaterialPropertyBlock();
            dirt = initialDirt;
        }

        private void Update()
        {
            float rain = Shader.GetGlobalFloat(rainGlobalName);
            float dt = Application.isPlaying ? Time.deltaTime : .016f;
            dirt = Mathf.Clamp01(dirt + dustPerSecond * dt - rain * rainWashPerSecond * dt);
            targetRenderer.GetPropertyBlock(block);
            block.SetFloat("_Dirt", dirt);
            block.SetFloat("_Rain", rain);
            block.SetFloat("_ObjectBaseY", transform.position.y);
            block.SetFloat("_ObjectHeight", Mathf.Max(.01f, objectHeight));
            targetRenderer.SetPropertyBlock(block);
        }
    }
}