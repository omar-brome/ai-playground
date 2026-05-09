using UnityEngine;
using UnityEngine.SceneManagement;

public enum HollowLevelOutcome
{
    Ongoing,
    ReachedExit,
    SurvivedTimer,
    CaughtByMonster
}

public class GameStateManager : MonoBehaviour
{
    public static GameStateManager Instance { get; private set; }

    public bool IsPaused { get; private set; }
    public HollowLevelOutcome LevelOutcome { get; private set; } = HollowLevelOutcome.Ongoing;

    public bool IsLevelComplete => LevelOutcome != HollowLevelOutcome.Ongoing;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    public void SetPaused(bool paused)
    {
        if (IsLevelComplete)
            return;
        IsPaused = paused;
        Time.timeScale = paused ? 0f : 1f;
    }

    public void RegisterExitReached()
    {
        if (LevelOutcome != HollowLevelOutcome.Ongoing)
            return;
        LevelOutcome = HollowLevelOutcome.ReachedExit;
        Time.timeScale = 1f;
        IsPaused = false;
        Cursor.lockState = CursorLockMode.None;
    }

    public void RegisterSurvivalWin()
    {
        if (LevelOutcome != HollowLevelOutcome.Ongoing)
            return;
        LevelOutcome = HollowLevelOutcome.SurvivedTimer;
        Time.timeScale = 1f;
        IsPaused = false;
        Cursor.lockState = CursorLockMode.None;
    }

    public void RegisterPlayerCaught()
    {
        if (LevelOutcome != HollowLevelOutcome.Ongoing)
            return;
        LevelOutcome = HollowLevelOutcome.CaughtByMonster;
        Time.timeScale = 1f;
        IsPaused = false;
        Cursor.lockState = CursorLockMode.None;
        Object.FindAnyObjectByType<AdaptiveDifficulty>()?.OnPlayerCaught();
    }

    public void ReloadCurrent()
    {
        Time.timeScale = 1f;
        var scene = SceneManager.GetActiveScene();
        if (scene.name == "Level_Asylum")
            HollowLevelSession.BeginNewRun();
        SceneManager.LoadScene(scene.buildIndex);
    }

    public void LoadSceneByName(string sceneName)
    {
        Time.timeScale = 1f;
        SceneManager.LoadScene(sceneName);
    }
}
