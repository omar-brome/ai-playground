using UnityEngine;

/// <summary>Read-only façade over <see cref="MonsterMemory"/> for hiding-spot suspicion.</summary>
public class HidingSpotMemory : MonoBehaviour
{
    public MonsterMemory monsterMemory;

    public float GetSuspicion(HidingSpot spot)
    {
        return monsterMemory != null ? monsterMemory.GetSuspicion(spot) : 0f;
    }
}
