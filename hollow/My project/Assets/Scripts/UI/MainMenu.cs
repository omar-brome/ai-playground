using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class MainMenu : MonoBehaviour
{
    public string asylumSceneName = "Level_Asylum";

    GameObject _controlsPanel;
    RectTransform _titlePulseTarget;

    static class SpookyTheme
    {
        public static readonly Color CameraClear = new(0.04f, 0.015f, 0.07f, 1f);
        public static readonly Color BackdropDeep = new(0.06f, 0.02f, 0.1f, 1f);
        public static readonly Color MoonMist = new(0.85f, 0.32f, 0.05f, 0.18f);
        public static readonly Color GraveMist = new(0.12f, 0.35f, 0.15f, 0.12f);
        public static readonly Color Vignette = new(0f, 0f, 0f, 0.32f);
        public static readonly Color TitlePumpkin = new(1f, 0.42f, 0.08f, 1f);
        public static readonly Color TitleBloodShadow = new(0.12f, 0.01f, 0.02f, 0.9f);
        public static readonly Color SubtitleSick = new(0.45f, 0.78f, 0.38f, 0.85f);
        public static readonly Color ButtonFace = new(0.14f, 0.05f, 0.1f, 0.96f);
        public static readonly Color ButtonBorder = new(0.95f, 0.38f, 0.1f, 0.55f);
        public static readonly Color ButtonText = new(0.98f, 0.92f, 0.82f, 1f);
        public static readonly Color PanelDim = new(0.05f, 0.02f, 0.08f, 0.97f);
        public static readonly Color PanelAccent = new(0.25f, 0.08f, 0.12f, 0.98f);
        public static readonly Color BodyText = new(0.88f, 0.84f, 0.78f, 1f);
        public static readonly Color CreditMuted = new(0.55f, 0.42f, 0.38f, 0.88f);
    }

    void Start()
    {
        EnsureSingleActiveAudioListenerForMenu();

        if (Object.FindAnyObjectByType<MainMenuAmbience>() == null)
        {
            var ambGo = new GameObject("MainMenuAmbience");
            ambGo.AddComponent<MainMenuAmbience>();
        }

        EnsureUiInputModule();

        if (Object.FindAnyObjectByType<Canvas>() != null)
            return;

        var cam = Camera.main;
        if (cam != null)
            cam.backgroundColor = SpookyTheme.CameraClear;

        var canvasGo = new GameObject("Canvas");
        var canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasGo.AddComponent<GraphicRaycaster>();

        BuildSpookyBackdrop(canvasGo.transform);
        BuildCornerRunes(canvasGo.transform);

        var titleGo = new GameObject("Title");
        titleGo.transform.SetParent(canvasGo.transform, false);
        var titleRect = titleGo.AddComponent<RectTransform>();
        titleRect.anchorMin = new Vector2(0.5f, 0.72f);
        titleRect.anchorMax = new Vector2(0.5f, 0.72f);
        titleRect.sizeDelta = new Vector2(800f, 140f);
        _titlePulseTarget = titleRect;

        void AddTitleLayer(string layerName, Color c, int size, Vector2 offset, bool outline)
        {
            var go = new GameObject(layerName);
            go.transform.SetParent(titleGo.transform, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            rt.anchoredPosition = offset;
            var tx = go.AddComponent<Text>();
            tx.raycastTarget = false;
            tx.text = "HOLLOW";
            tx.alignment = TextAnchor.MiddleCenter;
            tx.color = c;
            tx.fontSize = size;
            tx.fontStyle = FontStyle.Bold;
            tx.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (outline)
            {
                var ol = go.AddComponent<Outline>();
                ol.effectColor = new Color(0.12f, 0.03f, 0.02f, 0.7f);
                ol.effectDistance = new Vector2(1.5f, -1.5f);
            }
        }

        AddTitleLayer("TitleShadow", SpookyTheme.TitleBloodShadow, 58, new Vector2(5f, -6f), false);
        AddTitleLayer("TitleMain", SpookyTheme.TitlePumpkin, 58, Vector2.zero, true);

        var subGo = new GameObject("Subtitle");
        subGo.transform.SetParent(canvasGo.transform, false);
        var subRt = subGo.AddComponent<RectTransform>();
        subRt.anchorMin = new Vector2(0.5f, 0.62f);
        subRt.anchorMax = new Vector2(0.5f, 0.62f);
        subRt.sizeDelta = new Vector2(720f, 40f);
        var sub = subGo.AddComponent<Text>();
        sub.raycastTarget = false;
        sub.text = "They remember every footstep… every breath…";
        sub.alignment = TextAnchor.MiddleCenter;
        sub.color = SpookyTheme.SubtitleSick;
        sub.fontSize = 17;
        sub.fontStyle = FontStyle.Italic;
        sub.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        var tagGo = new GameObject("HalloweenTag");
        tagGo.transform.SetParent(canvasGo.transform, false);
        var tagRt = tagGo.AddComponent<RectTransform>();
        tagRt.anchorMin = new Vector2(0.5f, 0.56f);
        tagRt.anchorMax = new Vector2(0.5f, 0.56f);
        tagRt.sizeDelta = new Vector2(400f, 28f);
        var tag = tagGo.AddComponent<Text>();
        tag.raycastTarget = false;
        tag.text = "  ~  All Hallows  ~  ";
        tag.alignment = TextAnchor.MiddleCenter;
        tag.color = new Color(0.92f, 0.5f, 0.15f, 0.75f);
        tag.fontSize = 15;
        tag.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        AddMenuButton(canvasGo.transform, "PlayButton", "Enter the asylum", new Vector2(0f, 12f), PlayGame);
        AddMenuButton(canvasGo.transform, "ControlsButton", "Grimoire (controls)", new Vector2(0f, -52f), ShowControls);
#if HOLLOW_FMOD
        AddFmodEngineToggle(canvasGo.transform);
#endif

        _controlsPanel = BuildControlsPanel(canvasGo.transform);
        AddDeveloperCredit(canvasGo.transform);
    }

    static void AddDeveloperCredit(Transform canvas)
    {
        var go = new GameObject("DeveloperCredit");
        go.transform.SetParent(canvas, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0f);
        rt.anchorMax = new Vector2(0.5f, 0f);
        rt.pivot = new Vector2(0.5f, 0f);
        rt.anchoredPosition = new Vector2(0f, 18f);
        rt.sizeDelta = new Vector2(900f, 56f);

        var text = go.AddComponent<Text>();
        text.raycastTarget = false;
        text.text = "Developed by Omar Brome omar.brome@gmail.com";
        text.alignment = TextAnchor.MiddleCenter;
        text.color = SpookyTheme.CreditMuted;
        text.fontSize = 16;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
    }

    static Sprite WhiteUISprite()
    {
        var t = Texture2D.whiteTexture;
        return Sprite.Create(t, new Rect(0f, 0f, t.width, t.height), new Vector2(0.5f, 0.5f), 100f);
    }

    static void BuildSpookyBackdrop(Transform canvas)
    {
        void FullBleed(string name, Color color, int siblingIndex)
        {
            var go = new GameObject(name);
            go.transform.SetParent(canvas, false);
            go.transform.SetSiblingIndex(siblingIndex);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.AddComponent<Image>();
            img.sprite = WhiteUISprite();
            img.color = color;
            img.raycastTarget = false;
        }

        FullBleed("SpookyBackdrop", SpookyTheme.BackdropDeep, 0);

        var mistLow = new GameObject("OrangeMist");
        mistLow.transform.SetParent(canvas, false);
        mistLow.transform.SetSiblingIndex(1);
        var mRt = mistLow.AddComponent<RectTransform>();
        mRt.anchorMin = new Vector2(0f, 0f);
        mRt.anchorMax = new Vector2(1f, 0.38f);
        mRt.offsetMin = Vector2.zero;
        mRt.offsetMax = Vector2.zero;
        var mImg = mistLow.AddComponent<Image>();
        mImg.sprite = WhiteUISprite();
        mImg.color = SpookyTheme.MoonMist;
        mImg.raycastTarget = false;

        var mistGreen = new GameObject("FogGrave");
        mistGreen.transform.SetParent(canvas, false);
        mistGreen.transform.SetSiblingIndex(2);
        var gRt = mistGreen.AddComponent<RectTransform>();
        gRt.anchorMin = new Vector2(0f, 0.55f);
        gRt.anchorMax = new Vector2(1f, 1f);
        gRt.offsetMin = Vector2.zero;
        gRt.offsetMax = Vector2.zero;
        var gImg = mistGreen.AddComponent<Image>();
        gImg.sprite = WhiteUISprite();
        gImg.color = SpookyTheme.GraveMist;
        gImg.raycastTarget = false;

        FullBleed("Vignette", SpookyTheme.Vignette, 3);
    }

    static void BuildCornerRunes(Transform canvas)
    {
        void Corner(string name, string line, TextAnchor align, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot)
        {
            var go = new GameObject(name);
            go.transform.SetParent(canvas, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.anchoredPosition = Vector2.zero;
            rt.sizeDelta = new Vector2(220f, 120f);
            var tx = go.AddComponent<Text>();
            tx.raycastTarget = false;
            tx.text = line;
            tx.alignment = align;
            tx.color = new Color(0.75f, 0.28f, 0.12f, 0.35f);
            tx.fontSize = 13;
            tx.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        }

        Corner("RuneTL", " * . * .\n. * . *\n * . * .", TextAnchor.UpperLeft,
            new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(0f, 1f));
        Corner("RuneTR", ". * . *\n * . * .\n. * . *", TextAnchor.UpperRight,
            new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(1f, 1f));
        Corner("RuneBL", "~  bones  ~\n  rattling  ", TextAnchor.LowerLeft,
            new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(0f, 0f));
        Corner("RuneBR", "~  hollow  ~\n  moon  ", TextAnchor.LowerRight,
            new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(1f, 0f));
    }

    static void EnsureSingleActiveAudioListenerForMenu()
    {
        var cam = Camera.main;
        if (cam != null && cam.GetComponent<AudioListener>() == null)
            cam.gameObject.AddComponent<AudioListener>();

        var listeners = Object.FindObjectsByType<AudioListener>(FindObjectsInactive.Include);
        if (listeners.Length == 0)
        {
            new GameObject("AudioListener").AddComponent<AudioListener>();
            return;
        }

        AudioListener keep = null;
        if (cam != null)
            keep = cam.GetComponent<AudioListener>();
        keep ??= listeners[0];

        foreach (var al in listeners)
        {
            if (al == null)
                continue;
            if (al == keep)
                continue;
            Object.Destroy(al);
        }
    }

#if HOLLOW_FMOD
    static void AddFmodEngineToggle(Transform canvas)
    {
        var row = new GameObject("FmodToggleRow");
        row.transform.SetParent(canvas, false);
        var rowRt = row.AddComponent<RectTransform>();
        rowRt.anchorMin = new Vector2(0.5f, 0.5f);
        rowRt.anchorMax = new Vector2(0.5f, 0.5f);
        rowRt.anchoredPosition = new Vector2(0f, -132f);
        rowRt.sizeDelta = new Vector2(420f, 36f);

        var bg = row.AddComponent<Image>();
        bg.sprite = WhiteUISprite();
        bg.color = new Color(0.1f, 0.04f, 0.08f, 0.72f);
        bg.raycastTarget = true;

        var toggleGo = new GameObject("Toggle");
        toggleGo.transform.SetParent(row.transform, false);
        var tRt = toggleGo.AddComponent<RectTransform>();
        tRt.anchorMin = new Vector2(0f, 0.5f);
        tRt.anchorMax = new Vector2(0f, 0.5f);
        tRt.pivot = new Vector2(0f, 0.5f);
        tRt.anchoredPosition = new Vector2(14f, 0f);
        tRt.sizeDelta = new Vector2(28f, 28f);
        var tBg = toggleGo.AddComponent<Image>();
        tBg.sprite = WhiteUISprite();
        tBg.color = new Color(0.18f, 0.08f, 0.12f, 1f);
        var toggle = toggleGo.AddComponent<Toggle>();
        toggle.targetGraphic = tBg;
        toggle.isOn = HollowAudioPreferences.UseFmodEngine;
        toggle.onValueChanged.AddListener(v => HollowAudioPreferences.UseFmodEngine = v);

        var check = new GameObject("Checkmark");
        check.transform.SetParent(toggleGo.transform, false);
        var cRt = check.AddComponent<RectTransform>();
        cRt.anchorMin = new Vector2(0.5f, 0.5f);
        cRt.anchorMax = new Vector2(0.5f, 0.5f);
        cRt.sizeDelta = new Vector2(18f, 18f);
        var cImg = check.AddComponent<Image>();
        cImg.sprite = WhiteUISprite();
        cImg.color = new Color(0.35f, 0.82f, 0.4f, 1f);
        toggle.graphic = cImg;

        var labelGo = new GameObject("Label");
        labelGo.transform.SetParent(row.transform, false);
        var lRt = labelGo.AddComponent<RectTransform>();
        lRt.anchorMin = new Vector2(0f, 0f);
        lRt.anchorMax = new Vector2(1f, 1f);
        lRt.offsetMin = new Vector2(52f, 2f);
        lRt.offsetMax = new Vector2(-8f, -2f);
        var label = labelGo.AddComponent<Text>();
        label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        label.fontSize = 14;
        label.alignment = TextAnchor.MiddleLeft;
        label.color = SpookyTheme.BodyText;
        label.raycastTarget = false;
        label.text =
            "FMOD Studio audio (needs banks + events). Off = Unity procedural audio (default).";
    }
#endif

    void Update()
    {
        if (_titlePulseTarget != null)
        {
            var wobble = 1f + Mathf.Sin(Time.unscaledTime * 1.15f) * 0.012f;
            _titlePulseTarget.localScale = new Vector3(wobble, wobble, 1f);
        }

        if (_controlsPanel == null || !_controlsPanel.activeSelf)
            return;
        var kb = Keyboard.current;
        if (kb != null && kb.escapeKey.wasPressedThisFrame)
            _controlsPanel.SetActive(false);
    }

    static void EnsureUiInputModule()
    {
        var es = Object.FindAnyObjectByType<EventSystem>();
        if (es == null)
        {
            var esGo = new GameObject("EventSystem");
            es = esGo.AddComponent<EventSystem>();
        }

        if (es.GetComponent<InputSystemUIInputModule>() != null)
            return;

        var standalone = es.GetComponent<StandaloneInputModule>();
        if (standalone != null)
            Object.Destroy(standalone);

        if (es.GetComponent<InputSystemUIInputModule>() == null)
            es.gameObject.AddComponent<InputSystemUIInputModule>();
    }

    static void AddMenuButton(Transform parent, string name, string label, Vector2 anchoredPos, UnityEngine.Events.UnityAction onClick)
    {
        var btnGo = new GameObject(name);
        btnGo.transform.SetParent(parent, false);
        var rect = btnGo.AddComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.anchoredPosition = anchoredPos;
        rect.sizeDelta = new Vector2(260f, 48f);
        var img = btnGo.AddComponent<Image>();
        img.sprite = WhiteUISprite();
        img.color = SpookyTheme.ButtonFace;
        var outline = btnGo.AddComponent<Outline>();
        outline.effectColor = SpookyTheme.ButtonBorder;
        outline.effectDistance = new Vector2(2f, -2f);
        var btn = btnGo.AddComponent<Button>();
        btn.targetGraphic = img;
        var colors = btn.colors;
        colors.highlightedColor = new Color(0.28f, 0.1f, 0.16f, 1f);
        colors.pressedColor = new Color(0.35f, 0.12f, 0.08f, 1f);
        colors.selectedColor = colors.highlightedColor;
        btn.colors = colors;
        btn.onClick.AddListener(onClick);

        var textGo = new GameObject("Text");
        textGo.transform.SetParent(btnGo.transform, false);
        var tr = textGo.AddComponent<RectTransform>();
        tr.anchorMin = Vector2.zero;
        tr.anchorMax = Vector2.one;
        tr.offsetMin = Vector2.zero;
        tr.offsetMax = Vector2.zero;
        var te = textGo.AddComponent<Text>();
        te.raycastTarget = false;
        te.text = label;
        te.alignment = TextAnchor.MiddleCenter;
        te.color = SpookyTheme.ButtonText;
        te.fontSize = 17;
        te.fontStyle = FontStyle.Bold;
        te.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        var txOl = textGo.AddComponent<Outline>();
        txOl.effectColor = new Color(0.08f, 0.02f, 0.04f, 0.9f);
        txOl.effectDistance = new Vector2(1f, -1f);
    }

    GameObject BuildControlsPanel(Transform canvas)
    {
        var panel = new GameObject("ControlsPanel");
        panel.transform.SetParent(canvas, false);
        var prt = panel.AddComponent<RectTransform>();
        prt.anchorMin = Vector2.zero;
        prt.anchorMax = Vector2.one;
        prt.offsetMin = Vector2.zero;
        prt.offsetMax = Vector2.zero;
        var dim = panel.AddComponent<Image>();
        dim.sprite = WhiteUISprite();
        dim.color = SpookyTheme.PanelDim;
        dim.raycastTarget = true;
        panel.SetActive(false);

        var backGo = new GameObject("BackFromControls");
        backGo.transform.SetParent(panel.transform, false);
        var backRt = backGo.AddComponent<RectTransform>();
        backRt.anchorMin = new Vector2(0.5f, 1f);
        backRt.anchorMax = new Vector2(0.5f, 1f);
        backRt.pivot = new Vector2(0.5f, 1f);
        backRt.anchoredPosition = new Vector2(0f, -18f);
        backRt.sizeDelta = new Vector2(280f, 52f);
        var backImg = backGo.AddComponent<Image>();
        backImg.sprite = WhiteUISprite();
        backImg.color = SpookyTheme.PanelAccent;
        var backOl = backGo.AddComponent<Outline>();
        backOl.effectColor = SpookyTheme.ButtonBorder;
        backOl.effectDistance = new Vector2(2f, -2f);
        var backBtn = backGo.AddComponent<Button>();
        backBtn.targetGraphic = backImg;
        backBtn.onClick.AddListener(() => panel.SetActive(false));

        var backLabelGo = new GameObject("Text");
        backLabelGo.transform.SetParent(backGo.transform, false);
        var backLabelRt = backLabelGo.AddComponent<RectTransform>();
        backLabelRt.anchorMin = Vector2.zero;
        backLabelRt.anchorMax = Vector2.one;
        backLabelRt.offsetMin = Vector2.zero;
        backLabelRt.offsetMax = Vector2.zero;
        var backTe = backLabelGo.AddComponent<Text>();
        backTe.raycastTarget = false;
        backTe.text = "Back  (Esc)";
        backTe.alignment = TextAnchor.MiddleCenter;
        backTe.color = SpookyTheme.ButtonText;
        backTe.fontSize = 18;
        backTe.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        var body = new GameObject("Body");
        body.transform.SetParent(panel.transform, false);
        var bodyRt = body.AddComponent<RectTransform>();
        bodyRt.anchorMin = new Vector2(0.5f, 0.5f);
        bodyRt.anchorMax = new Vector2(0.5f, 0.5f);
        bodyRt.pivot = new Vector2(0.5f, 0.5f);
        bodyRt.sizeDelta = new Vector2(680f, 480f);
        bodyRt.anchoredPosition = new Vector2(0f, -28f);

        var txtGo = new GameObject("ControlsText");
        txtGo.transform.SetParent(body.transform, false);
        var txtRt = txtGo.AddComponent<RectTransform>();
        txtRt.anchorMin = Vector2.zero;
        txtRt.anchorMax = Vector2.one;
        txtRt.offsetMin = new Vector2(12f, 12f);
        txtRt.offsetMax = new Vector2(-12f, -12f);
        var bodyText = txtGo.AddComponent<Text>();
        bodyText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        bodyText.fontSize = 17;
        bodyText.alignment = TextAnchor.UpperLeft;
        bodyText.color = SpookyTheme.BodyText;
        bodyText.lineSpacing = 1.15f;
        bodyText.horizontalOverflow = HorizontalWrapMode.Wrap;
        bodyText.verticalOverflow = VerticalWrapMode.Overflow;
        bodyText.raycastTarget = false;
        bodyText.text =
            "Movement & look\n" +
            "  WASD — walk\n" +
            "  Mouse — look (click Game view to lock cursor)\n" +
            "  Left Ctrl — crouch (quieter, slower)\n" +
            "  Left Shift — sprint while moving (louder)\n\n" +
            "Interaction\n" +
            "  E — hide in locker / exit hide\n" +
            "  F — flashlight on/off (uses battery while on)\n\n" +
            "Menus\n" +
            "  Esc — close this screen / pause in-game\n" +
            "  R — resume when paused\n" +
            "  T — restart level (pause or end screen)\n\n" +
            "Goals\n" +
            "  Reach the cyan exit on the north wall, or survive until the timer ends.\n" +
            "  Lockers along the south wall (green strip) are hiding spots.\n\n" +
            "Note: the asylum layout is randomly generated each time you press Play.";

        return panel;
    }

    void ShowControls()
    {
        if (_controlsPanel != null)
            _controlsPanel.SetActive(true);
    }

    public void PlayGame()
    {
        HollowLevelSession.BeginNewRun();
        SceneManager.LoadScene(asylumSceneName);
    }
}
