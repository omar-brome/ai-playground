using UnityEngine;

/// <summary>
/// Win by surviving <see cref="surviveWinSeconds"/> (in addition to <see cref="ExitTrigger"/>).
/// </summary>
public class HollowLevelObjective : MonoBehaviour
{
    public float surviveWinSeconds = 150f;

    float _elapsed;

    void Update()
    {
        if (GameStateManager.Instance == null || GameStateManager.Instance.IsLevelComplete)
            return;
        if (GameStateManager.Instance.IsPaused)
            return;

        _elapsed += Time.deltaTime;
        if (_elapsed >= surviveWinSeconds)
            GameStateManager.Instance.RegisterSurvivalWin();
    }

    public float ElapsedSeconds => _elapsed;
    public float RemainingSeconds => Mathf.Max(0f, surviveWinSeconds - _elapsed);
}
