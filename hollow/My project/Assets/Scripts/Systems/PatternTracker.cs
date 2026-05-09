using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Tracks player movement samples, investigations, and patrol legs so the creature can lean on visible "adaptation".
/// Wired into <see cref="MonsterBrain"/> and <see cref="MonsterNavigation"/>.
/// </summary>
public class PatternTracker : MonoBehaviour
{
    public static PatternTracker Instance { get; private set; }

    [Header("Counters (read-only in play mode)")]
    public int noiseEventsHeard;
    public int timesSpotted;
    public int investigationEvents;
    public int patrolLegsLogged;

    public int maxPositionSamples = 120;
    public readonly List<Vector3> RecentPositions = new();
    public readonly List<Vector3> RecentInvestigationSites = new();
    const int MaxInvestigationSites = 48;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    public void RegisterNoiseHeard()
    {
        noiseEventsHeard++;
    }

    public void RegisterSpotted()
    {
        timesSpotted++;
    }

    public void RegisterInvestigation(Vector3 worldPos)
    {
        investigationEvents++;
        RecentInvestigationSites.Add(worldPos);
        if (RecentInvestigationSites.Count > MaxInvestigationSites)
            RecentInvestigationSites.RemoveAt(0);
    }

    public void RegisterPatrolLeg(Vector3 fromXZ, Vector3 toXZ)
    {
        patrolLegsLogged++;
        SamplePosition(Vector3.Lerp(fromXZ, toXZ, 0.5f));
    }

    public void SamplePosition(Vector3 pos)
    {
        RecentPositions.Add(pos);
        if (RecentPositions.Count > maxPositionSamples)
            RecentPositions.RemoveAt(0);
    }

    /// <summary>Weighted centroid of recent player samples (XZ), or null if not enough data.</summary>
    public Vector3? GetPlayerMovementHotspot()
    {
        var n = RecentPositions.Count;
        if (n < 8)
            return null;

        var start = Mathf.Max(0, n - 28);
        Vector3 sum = Vector3.zero;
        float wsum = 0f;
        for (var i = start; i < n; i++)
        {
            var w = (float)(i - start + 1);
            sum += RecentPositions[i] * w;
            wsum += w;
        }

        if (wsum < 1e-4f)
            return null;
        var p = sum / wsum;
        p.y = 0f;
        return p;
    }

    /// <summary>Biases investigation target toward where the player has been spending time.</summary>
    public Vector3 GetNoiseInvestigationBias(Vector3 noiseWorld)
    {
        var hot = GetPlayerMovementHotspot();
        if (!hot.HasValue)
            return Vector3.zero;

        var delta = hot.Value - noiseWorld;
        delta.y = 0f;
        return Vector3.ClampMagnitude(delta * 0.24f, 4.5f);
    }
}
