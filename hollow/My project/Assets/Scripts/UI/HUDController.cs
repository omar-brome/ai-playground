using UnityEngine;

public class HUDController : MonoBehaviour
{
    float _levelHintUntil;

    void Start()
    {
        _levelHintUntil = Time.time + 18f;
    }

    void OnGUI()
    {
        var gsm = GameStateManager.Instance;
        if (gsm != null && gsm.IsLevelComplete)
        {
            DrawEndScreen(gsm);
            return;
        }

        DrawObjectiveHud();

        if (Time.time < _levelHintUntil &&
            (gsm == null || !gsm.IsPaused))
        {
            var hintStyle = new GUIStyle(GUI.skin.box)
            {
                fontSize = 15,
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = new Color(0.9f, 0.92f, 0.95f) }
            };
            GUI.Box(
                new Rect(Screen.width / 2f - 300f, 52f, 600f, 72f),
                "Goals: reach the cyan EXIT at the north wall, OR survive until the timer hits zero.\n" +
                "South wall: dark lockers with green strip — E to hide. Creature starts far away; use pillars.",
                hintStyle);
        }

        if (gsm == null || !gsm.IsPaused)
            return;

        var cx = Screen.width / 2f;
        var cy = Screen.height / 2f;
        GUI.Box(new Rect(cx - 150, cy - 90, 300, 180), "Paused");

        if (GUI.Button(new Rect(cx - 110, cy - 40, 220, 30), "Resume (R)"))
        {
            gsm.SetPaused(false);
            Cursor.lockState = CursorLockMode.Locked;
        }

        if (GUI.Button(new Rect(cx - 110, cy - 2, 220, 30), "Restart level (T)"))
            gsm.ReloadCurrent();

        if (GUI.Button(new Rect(cx - 110, cy + 36, 220, 30), "Main menu"))
            gsm.LoadSceneByName("MainMenu");

        if (Event.current.type == EventType.KeyDown)
        {
            if (Event.current.keyCode == KeyCode.R)
            {
                gsm.SetPaused(false);
                Cursor.lockState = CursorLockMode.Locked;
                Event.current.Use();
            }
            else if (Event.current.keyCode == KeyCode.T)
            {
                gsm.ReloadCurrent();
                Event.current.Use();
            }
        }
    }

    static void DrawObjectiveHud()
    {
        var obj = FindFirstObjectByType<HollowLevelObjective>();
        if (obj == null)
            return;

        var rem = obj.RemainingSeconds;
        var m = Mathf.FloorToInt(rem / 60f);
        var s = Mathf.FloorToInt(rem % 60f);
        var style = new GUIStyle(GUI.skin.label)
        {
            fontSize = 18,
            fontStyle = FontStyle.Bold,
            alignment = TextAnchor.UpperLeft
        };
        style.normal.textColor = new Color(0.88f, 0.9f, 0.93f);
        GUI.Label(new Rect(16f, 12f, 420f, 28f), $"Survive: {m:0}:{s:00}", style);
        GUI.Label(new Rect(16f, 34f, 420f, 24f), "Exit: north — cyan gate", new GUIStyle(style) { fontSize = 14, fontStyle = FontStyle.Normal });
    }

    static void DrawEndScreen(GameStateManager gsm)
    {
        GUI.color = new Color(0f, 0f, 0f, 0.82f);
        GUI.DrawTexture(new Rect(0f, 0f, Screen.width, Screen.height), Texture2D.whiteTexture, ScaleMode.StretchToFill);
        GUI.color = Color.white;

        var title = gsm.LevelOutcome switch
        {
            HollowLevelOutcome.ReachedExit => "Escaped",
            HollowLevelOutcome.SurvivedTimer => "You survived",
            HollowLevelOutcome.CaughtByMonster => "Caught",
            _ => "Ended"
        };

        var sub = gsm.LevelOutcome switch
        {
            HollowLevelOutcome.ReachedExit => "You reached the exit.",
            HollowLevelOutcome.SurvivedTimer => "You outlasted the hollow.",
            HollowLevelOutcome.CaughtByMonster => "The creature caught you.",
            _ => ""
        };

        var big = new GUIStyle(GUI.skin.label)
        {
            fontSize = 36,
            fontStyle = FontStyle.Bold,
            alignment = TextAnchor.MiddleCenter
        };
        big.normal.textColor = new Color(0.92f, 0.92f, 0.95f);

        var small = new GUIStyle(GUI.skin.label)
        {
            fontSize = 18,
            alignment = TextAnchor.MiddleCenter
        };
        small.normal.textColor = new Color(0.75f, 0.78f, 0.82f);

        var cx = Screen.width / 2f;
        var cy = Screen.height / 2f;
        GUI.Label(new Rect(cx - 260f, cy - 110f, 520f, 50f), title, big);
        GUI.Label(new Rect(cx - 260f, cy - 48f, 520f, 36f), sub, small);

        if (GUI.Button(new Rect(cx - 110f, cy + 24f, 220f, 40f), "Restart (T)"))
            gsm.ReloadCurrent();
        if (GUI.Button(new Rect(cx - 110f, cy + 72f, 220f, 40f), "Main menu"))
            gsm.LoadSceneByName("MainMenu");

        if (Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.T)
        {
            gsm.ReloadCurrent();
            Event.current.Use();
        }
    }
}
