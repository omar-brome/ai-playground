using UnityEngine;

public class HUDController : MonoBehaviour
{
    float _levelHintUntil;

    void Start()
    {
        _levelHintUntil = Time.time + 16f;
    }

    void OnGUI()
    {
        if (Time.time < _levelHintUntil &&
            (GameStateManager.Instance == null || !GameStateManager.Instance.IsPaused))
        {
            var hintStyle = new GUIStyle(GUI.skin.box)
            {
                fontSize = 15,
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = new Color(0.9f, 0.92f, 0.95f) }
            };
            GUI.Box(
                new Rect(Screen.width / 2f - 300f, 12f, 600f, 62f),
                "South wall: three dark lockers with a green strip — walk into the volume, then press E to hide.\n" +
                "The creature starts in the far corner; use pillars for cover.",
                hintStyle);
        }

        if (GameStateManager.Instance == null || !GameStateManager.Instance.IsPaused)
            return;

        var cx = Screen.width / 2f;
        var cy = Screen.height / 2f;
        GUI.Box(new Rect(cx - 150, cy - 90, 300, 180), "Paused");

        if (GUI.Button(new Rect(cx - 110, cy - 40, 220, 30), "Resume (R)"))
        {
            GameStateManager.Instance.SetPaused(false);
            Cursor.lockState = CursorLockMode.Locked;
        }

        if (GUI.Button(new Rect(cx - 110, cy - 2, 220, 30), "Restart level (T)"))
            GameStateManager.Instance.ReloadCurrent();

        if (GUI.Button(new Rect(cx - 110, cy + 36, 220, 30), "Main menu"))
            GameStateManager.Instance.LoadSceneByName("MainMenu");

        if (Event.current.type == EventType.KeyDown)
        {
            if (Event.current.keyCode == KeyCode.R)
            {
                GameStateManager.Instance.SetPaused(false);
                Cursor.lockState = CursorLockMode.Locked;
                Event.current.Use();
            }
            else if (Event.current.keyCode == KeyCode.T)
            {
                GameStateManager.Instance.ReloadCurrent();
                Event.current.Use();
            }
        }
    }
}
