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
        DrawAdaptationHud();

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
                "Lockers (south): E hide. Ctrl crouch (quiet), Shift sprint (loud). F flashlight (battery).",
                hintStyle);
        }

        if (gsm == null || !gsm.IsPaused)
            return;

        var cx = Screen.width / 2f;
        var cy = Screen.height / 2f;
        GUI.Box(new Rect(cx - 150, cy - 90, 300, 224), "Paused");

        if (GUI.Button(new Rect(cx - 110, cy - 40, 220, 30), "Resume (R)"))
        {
            gsm.SetPaused(false);
            Cursor.lockState = CursorLockMode.Locked;
        }

        if (GUI.Button(new Rect(cx - 110, cy - 2, 220, 30), "Restart level (T)"))
            gsm.ReloadCurrent();

        if (GUI.Button(new Rect(cx - 110, cy + 36, 220, 30), "Main menu"))
            gsm.LoadSceneByName("MainMenu");

        var micVal = GUI.HorizontalSlider(new Rect(cx - 110, cy + 76, 220, 18),
            HollowSettings.MicSensitivity, 0.05f, 2f);
        if (Mathf.Abs(micVal - HollowSettings.MicSensitivity) > 0.0001f)
            HollowSettings.MicSensitivity = micVal;
        var small = new GUIStyle(GUI.skin.label)
        {
            fontSize = 12,
            alignment = TextAnchor.MiddleCenter,
            normal = { textColor = new Color(0.82f, 0.84f, 0.88f) }
        };
        GUI.Label(new Rect(cx - 110, cy + 96, 220, 20),
            $"Mic sensitivity: {HollowSettings.MicSensitivity:0.00}", small);

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
        var obj = Object.FindAnyObjectByType<HollowLevelObjective>();
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

        var player = GameObject.FindGameObjectWithTag("Player");
        var inv = player != null ? player.GetComponent<PlayerInventory>() : null;
        if (inv != null)
        {
            var pct = Mathf.RoundToInt(inv.Battery01 * 100f);
            var lamp = inv.FlashlightOn ? "on" : "off";
            var small = new GUIStyle(style) { fontSize = 13, fontStyle = FontStyle.Normal };
            GUI.Label(new Rect(16f, 54f, 420f, 22f), $"Flashlight: {lamp}  ·  Battery {pct}%", small);
        }

        var seedStyle = new GUIStyle(GUI.skin.label)
        {
            fontSize = 11,
            alignment = TextAnchor.LowerRight,
            normal = { textColor = new Color(0.55f, 0.56f, 0.6f, 0.85f) }
        };
        GUI.Label(new Rect(Screen.width - 200f - 16f, Screen.height - 26f, 200f, 22f),
            $"Layout seed {HollowLevelSession.GenerationSeed}", seedStyle);
    }

    static void DrawAdaptationHud()
    {
        var pt = PatternTracker.Instance;
        if (pt == null)
            return;

        var style = new GUIStyle(GUI.skin.label)
        {
            fontSize = 11,
            alignment = TextAnchor.LowerLeft,
            normal = { textColor = new Color(0.5f, 0.62f, 0.55f, 0.9f) }
        };
        var y = Screen.height - 72f;
        GUI.Label(new Rect(16f, y, 520f, 18f),
            $"Creature adaptation · noise {pt.noiseEventsHeard} · spotted {pt.timesSpotted} · investigate {pt.investigationEvents} · patrol legs {pt.patrolLegsLogged}",
            style);
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
