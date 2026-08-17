using System.Collections.Generic;
using UnityEngine;

namespace ProceduralRPG.Characters
{
    /// <summary>
    /// Generic procedural locomotion. FABRIK solves each three-joint leg against
    /// raycast ground targets; sine phases create a walk cycle without Animator
    /// or imported clips. The body centre follows a figure-eight path.
    /// </summary>
    [ExecuteAlways]
    public sealed class FabrikFootIK : MonoBehaviour
    {
        [Header("Motion")]
        [SerializeField, Range(0f, 7f)] private float movementSpeed = 2.4f;
        [SerializeField, Range(.4f, 4f)] private float stepFrequency = 1.8f;
        [SerializeField, Range(.02f, .45f)] private float stepLength = .24f;
        [SerializeField, Range(.01f, .3f)] private float stepHeight = .13f;
        [SerializeField, Range(.01f, .35f)] private float hipSway = .08f;
        [SerializeField] private LayerMask groundMask = ~0;
        [SerializeField, Range(2, 16)] private int fabrikIterations = 8;

        private ProceduralCharacter character;
        private Transform[] leftLeg;
        private Transform[] rightLeg;
        private Transform[] leftArm;
        private Transform[] rightArm;
        private Vector3[] leftLengths;
        private Vector3[] rightLengths;
        private Vector3 rootLocal;
        private float phase;
        private Vector3 lastPosition;

        public void Configure(ProceduralCharacter source)
        {
            character = source;
            leftLeg = new[] { source.LeftHip, source.LeftKnee, source.LeftAnkle };
            rightLeg = new[] { source.RightHip, source.RightKnee, source.RightAnkle };
            leftArm = new[] { source.LeftShoulder, source.LeftElbow, source.LeftHand };
            rightArm = new[] { source.RightShoulder, source.RightElbow, source.RightHand };
            leftLengths = CacheLengths(leftLeg);
            rightLengths = CacheLengths(rightLeg);
            rootLocal = source.Hips.localPosition;
            lastPosition = transform.position;
        }

        private void LateUpdate()
        {
            if (character == null || leftLeg == null) return;
            float dt = Application.isPlaying ? Time.deltaTime : .016f;
            float actualSpeed = (transform.position - lastPosition).magnitude / Mathf.Max(dt, .0001f);
            lastPosition = transform.position;
            float normalizedSpeed = Mathf.Clamp01(actualSpeed / Mathf.Max(movementSpeed, .001f));
            phase += dt * stepFrequency * Mathf.Lerp(.2f, 1f, normalizedSpeed);

            // Centre of mass moves on a figure-eight: lateral sin, vertical sin*2.
            character.Hips.localPosition = rootLocal + new Vector3(Mathf.Sin(phase * 2f) * hipSway * normalizedSpeed, Mathf.Sin(phase * 4f) * hipSway * .22f * normalizedSpeed, 0);
            SolveLeg(leftLeg, leftLengths, phase, -1f, normalizedSpeed);
            SolveLeg(rightLeg, rightLengths, phase + Mathf.PI, 1f, normalizedSpeed);
            AnimateArm(leftArm, phase + Mathf.PI, -1f, normalizedSpeed);
            AnimateArm(rightArm, phase, 1f, normalizedSpeed);
        }

        private void SolveLeg(Transform[] chain, Vector3[] lengths, float phaseValue, float side, float normalizedSpeed)
        {
            Vector3 hip = chain[0].position;
            float swing = Mathf.Sin(phaseValue);
            float lift = Mathf.Max(0f, Mathf.Sin(phaseValue)) * stepHeight * normalizedSpeed;
            Vector3 desired = hip + transform.forward * (swing * stepLength * normalizedSpeed) + transform.right * side * .05f;
            desired.y = hip.y - (lengths[0].x + lengths[1].x) * .92f + lift;
            if (Physics.Raycast(desired + Vector3.up * 2f, Vector3.down, out RaycastHit hit, 5f, groundMask, QueryTriggerInteraction.Ignore))
            {
                desired.y = hit.point.y + .06f + lift;
            }
            SolveFabrik(chain, lengths, desired);
        }

        private void AnimateArm(Transform[] arm, float phaseValue, float side, float normalizedSpeed)
        {
            if (arm == null || arm.Length < 3) return;
            float swing = Mathf.Sin(phaseValue) * 34f * normalizedSpeed;
            arm[0].localRotation = Quaternion.Euler(swing, 0, side * 8f);
            arm[1].localRotation = Quaternion.Euler(-swing * .55f, 0, 0);
        }

        private void SolveFabrik(Transform[] chain, Vector3[] lengths, Vector3 target)
        {
            var positions = new Vector3[chain.Length];
            for (int i = 0; i < chain.Length; i++) positions[i] = chain[i].position;
            Vector3 root = positions[0];
            float total = lengths[0].x + lengths[1].x;
            if ((target - root).magnitude >= total)
            {
                Vector3 direction = (target - root).normalized;
                positions[1] = root + direction * lengths[0].x;
                positions[2] = positions[1] + direction * lengths[1].x;
            }
            else
            {
                for (int iteration = 0; iteration < fabrikIterations; iteration++)
                {
                    positions[2] = target;
                    for (int i = 1; i >= 0; i--)
                        positions[i] = positions[i + 1] + (positions[i] - positions[i + 1]).normalized * lengths[i].x;
                    positions[0] = root;
                    for (int i = 0; i < 2; i++)
                        positions[i + 1] = positions[i] + (positions[i + 1] - positions[i]).normalized * lengths[i].x;
                    if ((positions[2] - target).sqrMagnitude < .00001f) break;
                }
            }
            for (int i = 0; i < chain.Length - 1; i++)
            {
                Vector3 direction = positions[i + 1] - positions[i];
                chain[i].rotation = Quaternion.FromToRotation(chain[i].up, direction.normalized) * chain[i].rotation;
            }
            chain[2].position = positions[2];
        }

        private static Vector3[] CacheLengths(Transform[] chain)
        {
            return new[]
            {
                new Vector3(Vector3.Distance(chain[0].position, chain[1].position), 0, 0),
                new Vector3(Vector3.Distance(chain[1].position, chain[2].position), 0, 0)
            };
        }
    }
}