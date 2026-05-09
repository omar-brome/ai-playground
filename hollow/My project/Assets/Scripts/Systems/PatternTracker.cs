using System.Collections.Generic;
using UnityEngine;

/// <summary>Lightweight behavioral log for analytics or future ML features.</summary>
public class PatternTracker : MonoBehaviour
{
    public int noiseEventsHeard;
    public int timesSpotted;
    public readonly List<Vector3> RecentPositions = new();
    public int maxSamples = 100;

    public void RegisterNoiseHeard()
    {
        noiseEventsHeard++;
    }

    public void RegisterSpotted()
    {
        timesSpotted++;
    }

    public void SamplePosition(Vector3 pos)
    {
        RecentPositions.Add(pos);
        if (RecentPositions.Count > maxSamples)
            RecentPositions.RemoveAt(0);
    }
}
