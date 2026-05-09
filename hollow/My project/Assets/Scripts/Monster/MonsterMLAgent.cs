using Unity.MLAgents;
using Unity.MLAgents.Actuators;
using Unity.MLAgents.Policies;
using Unity.MLAgents.Sensors;
using UnityEngine;

/// <summary>
/// Biases <see cref="MonsterBrain"/> aggression / intelligence / spot-check priority only.
/// NavMesh movement stays on <see cref="MonsterNavigation"/>. Enable only when <see cref="BehaviorParameters"/> match <see cref="RequiredVectorObservationSize"/> and discrete branch size.
/// </summary>
public class MonsterMLAgent : Agent
{
    public const int RequiredVectorObservationSize = 8;
    public const int RequiredDiscreteBranch0Size = 25;

    public MonsterBrain brain;

    Transform _player;

    public override void Initialize()
    {
        var p = GameObject.FindGameObjectWithTag("Player");
        if (p != null)
            _player = p.transform;
    }

    /// <summary>Call after <see cref="BehaviorParameters"/> exist on this GameObject (e.g. from bootstrap).</summary>
    public void ConfigureAndEnableIfValid()
    {
        if (!TryValidateConfiguration(out var err))
        {
            enabled = false;
            Debug.Log($"[Hollow] MonsterMLAgent left disabled: {err}");
            return;
        }

        enabled = true;
    }

    public bool TryValidateConfiguration(out string error)
    {
        error = null;
        var bp = GetComponent<BehaviorParameters>();
        if (bp == null)
        {
            error = "missing BehaviorParameters on monster";
            return false;
        }

        var b = bp.BrainParameters;
        if (b.VectorObservationSize != RequiredVectorObservationSize)
        {
            error =
                $"VectorObservationSize is {b.VectorObservationSize}, expected {RequiredVectorObservationSize}";
            return false;
        }

        if (b.NumStackedVectorObservations != 1)
        {
            error =
                $"NumStackedVectorObservations is {b.NumStackedVectorObservations}, expected 1";
            return false;
        }

        var spec = b.ActionSpec;
        if (spec.NumContinuousActions != 0)
        {
            error = "continuous actions must be 0 (policy only modulates brain weights)";
            return false;
        }

        if (spec.BranchSizes == null || spec.BranchSizes.Length != 1 ||
            spec.BranchSizes[0] < RequiredDiscreteBranch0Size)
        {
            error =
                $"need one discrete branch with size ≥ {RequiredDiscreteBranch0Size} (got {spec.BranchSizes?[0] ?? -1})";
            return false;
        }

        return true;
    }

    public override void CollectObservations(VectorSensor sensor)
    {
        var dist = 0f;
        if (_player != null)
            dist = Vector3.Distance(transform.position, _player.position);

        sensor.AddObservation(dist / 40f);
        sensor.AddObservation(brain != null ? (float)brain.currentState / 5f : 0f);
        sensor.AddObservation(brain != null ? brain.aggressionLevel : 0f);
        sensor.AddObservation(brain != null ? brain.intelligenceLevel : 0f);

        var noiseDir = Vector3.zero;
        if (NoiseSystem.Instance != null &&
            NoiseSystem.Instance.TryGetLoudestNoiseNear(transform.position, 30f, out var ev))
        {
            noiseDir = (ev.position - transform.position).normalized;
        }

        sensor.AddObservation(noiseDir.x);
        sensor.AddObservation(noiseDir.z);

        var top = brain != null && brain.memory != null ? brain.memory.GetMostSuspiciousSpot() : null;
        sensor.AddObservation(top != null ? top.suspicionWeight : 0f);
        sensor.AddObservation(brain != null ? Mathf.Clamp01(brain.mlSpotCheckPriority / 2f) : 0.5f);
    }

    public override void OnActionReceived(ActionBuffers actions)
    {
        if (brain == null)
            return;

        var code = actions.DiscreteActions[0];
        brain.mlAggressionDelta = (code % 5) * 0.05f - 0.1f;
        brain.mlIntelligenceDelta = ((code / 5) % 5) * 0.05f - 0.1f;
        brain.mlSpotCheckPriority = 0.75f + (code % 3) * 0.12f;
    }

    public override void Heuristic(in ActionBuffers actionsOut)
    {
        actionsOut.DiscreteActions.Array[0] = 0;
    }
}
