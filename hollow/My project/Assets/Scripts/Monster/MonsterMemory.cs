using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[System.Serializable]
public class HidingSpotRecord
{
    public Vector3 position;
    public string spotName;
    public int timesPlayerHidHere;
    public float lastSeenTime;
    public float suspicionWeight;
}

public class MonsterMemory : MonoBehaviour
{
    [Header("Memory Settings")]
    public int maxRememberedSpots = 20;
    public float memoryDecayRate = 0.01f;
    public float learningRate = 0.3f;

    readonly List<HidingSpotRecord> _hidingMemory = new();
    readonly List<Vector3> _playerPathHistory = new();
    public int maxPathHistory = 500;

    public void RecordPlayerHiding(HidingSpot spot)
    {
        if (spot == null)
            return;

        var existing = _hidingMemory.FirstOrDefault(r => r.spotName == spot.spotName);

        if (existing != null)
        {
            existing.timesPlayerHidHere++;
            existing.lastSeenTime = Time.time;
            existing.suspicionWeight = Mathf.Clamp01(
                existing.suspicionWeight + learningRate *
                (1f + existing.timesPlayerHidHere * 0.2f));
        }
        else
        {
            if (_hidingMemory.Count >= maxRememberedSpots)
                _hidingMemory.RemoveAt(0);

            _hidingMemory.Add(new HidingSpotRecord
            {
                position = spot.transform.position,
                spotName = spot.spotName,
                timesPlayerHidHere = 1,
                lastSeenTime = Time.time,
                suspicionWeight = learningRate
            });
        }
    }

    public void RecordPlayerPosition(Vector3 pos)
    {
        _playerPathHistory.Add(pos);
        if (_playerPathHistory.Count > maxPathHistory)
            _playerPathHistory.RemoveAt(0);
    }

    public float GetSuspicion(HidingSpot spot)
    {
        if (spot == null)
            return 0f;
        var record = _hidingMemory.FirstOrDefault(r => r.spotName == spot.spotName);
        return record?.suspicionWeight ?? 0f;
    }

    public HidingSpotRecord GetMostSuspiciousSpot()
    {
        return _hidingMemory.OrderByDescending(r => r.suspicionWeight).FirstOrDefault();
    }

    public Vector3? PredictPlayerPosition()
    {
        if (_playerPathHistory.Count < 10)
            return null;

        Vector3 predicted = Vector3.zero;
        float totalWeight = 0f;

        for (var i = 0; i < _playerPathHistory.Count; i++)
        {
            var weight = (float)i / _playerPathHistory.Count;
            predicted += _playerPathHistory[i] * weight;
            totalWeight += weight;
        }

        return totalWeight > 0f ? predicted / totalWeight : (Vector3?)null;
    }

    void Update()
    {
        foreach (var record in _hidingMemory)
        {
            record.suspicionWeight = Mathf.Max(0f,
                record.suspicionWeight - memoryDecayRate * Time.deltaTime);
        }
    }
}
