using UnityEngine;

namespace ProceduralRPG.Audio
{
    public enum ProceduralAudioMaterial { Stone, Metal, Wood, Cloth, Water, Wind }

    /// <summary>
    /// Creates deterministic PCM ambience from physical object information. Each
    /// object gets a subtly different harmonic fingerprint from size/material.
    /// The global spectrum pulse drives procedural shader shimmer.
    /// </summary>
    [ExecuteAlways]
    [RequireComponent(typeof(AudioSource))]
    public sealed class ProceduralSoundscape : MonoBehaviour
    {
        [SerializeField] private ProceduralAudioMaterial materialType = ProceduralAudioMaterial.Stone;
        [SerializeField, Range(.2f, 20f)] private float physicalSize = 2f;
        [SerializeField, Range(0f, 1f)] private float volume = .18f;
        [SerializeField] private int seed = 91;
        [SerializeField] private bool playOnEnable = true;
        [SerializeField, Range(.1f, 4f)] private float shaderPulseGain = 1.2f;

        private AudioSource source;
        private readonly float[] spectrum = new float[128];

        private void OnEnable()
        {
            source = GetComponent<AudioSource>();
            source.loop = true;
            source.spatialBlend = .7f;
            source.rolloffMode = AudioRolloffMode.Logarithmic;
            source.clip = BuildClip();
            source.volume = volume;
            if (playOnEnable && Application.isPlaying) source.Play();
        }

        public void Configure(ProceduralAudioMaterial newMaterial, float size, int newSeed, float newVolume)
        {
            materialType = newMaterial;
            physicalSize = size;
            seed = newSeed;
            volume = newVolume;
        }

        private void Update()
        {
            if (!Application.isPlaying || source == null || !source.isPlaying) return;
            source.GetSpectrumData(spectrum, 0, FFTWindow.BlackmanHarris);
            float energy = 0f;
            for (int i = 2; i < 24; i++) energy += spectrum[i] * (1f - i / 28f);
            Shader.SetGlobalFloat("_AudioPulse", Mathf.Clamp01(energy * 65f) * shaderPulseGain);
        }

        [ContextMenu("Regenerate PCM Clip")]
        public void Regenerate()
        {
            if (source == null) source = GetComponent<AudioSource>();
            if (source.clip != null)
            {
                if (Application.isPlaying) Destroy(source.clip); else DestroyImmediate(source.clip);
            }
            source.clip = BuildClip();
            if (Application.isPlaying) source.Play();
        }

        private AudioClip BuildClip()
        {
            const int sampleRate = 44100;
            const int seconds = 12;
            int count = sampleRate * seconds;
            var data = new float[count];
            var rng = new System.Random(seed);
            float baseFrequency = BaseFrequency() / Mathf.Sqrt(Mathf.Max(.2f, physicalSize));
            float phaseA = (float)rng.NextDouble() * Mathf.PI * 2f;
            float phaseB = (float)rng.NextDouble() * Mathf.PI * 2f;
            float noiseState = 0f;
            for (int i = 0; i < count; i++)
            {
                float t = i / (float)sampleRate;
                float slow = Mathf.Sin(t * .17f + phaseA) * .5f + .5f;
                float harmonic = Mathf.Sin(t * baseFrequency * Mathf.PI * 2f + phaseA) * .36f;
                harmonic += Mathf.Sin(t * baseFrequency * 1.997f * Mathf.PI * 2f + phaseB) * .18f;
                float white = ((float)rng.NextDouble() * 2f - 1f);
                noiseState = Mathf.Lerp(noiseState, white, .025f + slow * .035f);
                float noiseAmount = materialType == ProceduralAudioMaterial.Wind ? .5f : materialType == ProceduralAudioMaterial.Water ? .35f : .12f;
                float materialEnvelope = MaterialEnvelope(t, slow);
                data[i] = Mathf.Clamp((harmonic + noiseState * noiseAmount) * materialEnvelope, -.85f, .85f);
            }
            var clip = AudioClip.Create($"PCM {materialType} {seed}", count, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private float BaseFrequency()
        {
            switch (materialType)
            {
                case ProceduralAudioMaterial.Metal: return 170f;
                case ProceduralAudioMaterial.Wood: return 95f;
                case ProceduralAudioMaterial.Water: return 220f;
                case ProceduralAudioMaterial.Wind: return 48f;
                case ProceduralAudioMaterial.Cloth: return 70f;
                default: return 62f;
            }
        }

        private float MaterialEnvelope(float t, float slow)
        {
            if (materialType == ProceduralAudioMaterial.Water) return .12f + slow * .2f;
            if (materialType == ProceduralAudioMaterial.Wind) return .08f + slow * .17f;
            if (materialType == ProceduralAudioMaterial.Metal) return .05f + Mathf.Pow(slow, 4f) * .3f;
            return .06f + slow * .12f;
        }
    }
}