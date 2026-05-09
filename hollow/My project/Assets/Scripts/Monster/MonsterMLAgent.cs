using Unity.MLAgents;
using Unity.MLAgents.Actuators;
using Unity.MLAgents.Sensors;
using UnityEngine;

/// <summary>
/// Modulates <see cref="MonsterBrain"/> fields from a discrete policy. Disable this component until Behavior Parameters are configured for training or heuristic play.
/// </summary>
public class MonsterMLAgent : Agent
{
    public MonsterBrain brain;

    Transform _player;

    public override void Initialize()
    {
        var p = GameObject.FindGameObjectWithTag("Player");
        if (p != null)
            _player = p.transform;
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
