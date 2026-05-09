using UnityEngine;

/// <summary>
/// Periodically feeds <see cref="PatternTracker"/> and <see cref="MonsterMemory"/> with player position for route learning.
/// </summary>
public class PlayerPatternEmitter : MonoBehaviour
{
    public float intervalSeconds = 2f;
    public PatternTracker tracker;
    public MonsterMemory monsterMemory;

    float _timer;

    void Update()
    {
        if (GameStateManager.Instance != null &&
            (GameStateManager.Instance.IsLevelComplete || GameStateManager.Instance.IsPaused))
            return;

        _timer += Time.deltaTime;
        if (_timer < intervalSeconds)
            return;
        _timer = 0f;

        var p = transform.position;
        tracker?.SamplePosition(p);
        monsterMemory?.RecordPlayerPosition(p);
    }
}
