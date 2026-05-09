using System.Collections.Generic;
using UnityEngine;

public enum NoiseType
{
    Footstep,
    Microphone,
    Object,
    Distraction
}

public struct NoiseEvent
{
    public Vector3 position;
    public float radius;
    public NoiseType type;
    public float timestamp;
    /// <summary>1 = baseline loudness; crouch &lt; 1, sprint &gt; 1 for footsteps.</summary>
    public float intensity;
}

public class NoiseSystem : MonoBehaviour
{
    public static NoiseSystem Instance { get; private set; }

    readonly List<NoiseEvent> _activeNoises = new();
    public float noiseDecayTime = 3f;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    public void EmitNoise(Vector3 position, float radius, NoiseType type, float intensity = 1f)
    {
        _activeNoises.Add(new NoiseEvent
        {
            position = position,
            radius = radius,
            type = type,
            timestamp = Time.time,
            intensity = Mathf.Max(0f, intensity)
        });
    }

    public bool TryGetLoudestNoiseNear(Vector3 listenerPos, float maxRange, out NoiseEvent loudest)
    {
        return TryGetLoudestNoiseNear(listenerPos, maxRange, out loudest, out _);
    }

    public bool TryGetLoudestNoiseNear(Vector3 listenerPos, float maxRange, out NoiseEvent loudest,
        out float strength)
    {
        loudest = default;
        strength = 0f;
        var maxStrength = 0f;
        var found = false;

        foreach (var noise in _activeNoises)
        {
            var age = Time.time - noise.timestamp;
            if (age > noiseDecayTime)
                continue;

            var dist = Vector3.Distance(listenerPos, noise.position);
            if (dist > maxRange)
                continue;

            var s = (1f - dist / maxRange) * (1f - age / noiseDecayTime) * noise.intensity;
            if (s > maxStrength)
            {
                maxStrength = s;
                loudest = noise;
                found = true;
            }
        }

        strength = maxStrength;
        return found;
    }

    void Update()
    {
        _activeNoises.RemoveAll(n => Time.time - n.timestamp > noiseDecayTime);
    }
}
