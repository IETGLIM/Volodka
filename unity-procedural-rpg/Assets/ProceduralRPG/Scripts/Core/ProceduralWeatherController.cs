using UnityEngine;

namespace ProceduralRPG.Core
{
    /// <summary>Global weather clock used by shaders, dirt, fog and ambience.</summary>
    public sealed class ProceduralWeatherController : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float rain = 0f;
        [SerializeField] private bool cycleRain = true;
        [SerializeField, Range(25f, 240f)] private float rainCycleSeconds = 95f;
        [SerializeField] private Light sun;
        [SerializeField, Range(.02f, 1f)] private float sunIntensityInRain = .35f;

        private float phase;
        private float clearSunIntensity = 1f;

        private void Awake()
        {
            if (sun != null) clearSunIntensity = sun.intensity;
        }

        public void Configure(Light sourceSun)
        {
            sun = sourceSun;
            if (sun != null) clearSunIntensity = sun.intensity;
        }

        private void Update()
        {
            if (cycleRain && Application.isPlaying)
            {
                phase += Time.deltaTime / rainCycleSeconds;
                // Long dry periods, short rain fronts; no abrupt pop.
                float cloud = Mathf.SmoothStep(0f, 1f, Mathf.Sin(phase * Mathf.PI * 2f) * .5f + .5f);
                rain = Mathf.Clamp01((cloud - .67f) * 3f);
            }
            Shader.SetGlobalFloat("_ProceduralRain", rain);
            if (sun != null) sun.intensity = Mathf.Lerp(clearSunIntensity, clearSunIntensity * sunIntensityInRain, rain);
        }

        public void SetRain(float value) => rain = Mathf.Clamp01(value);
    }
}