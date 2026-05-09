using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class MainMenu : MonoBehaviour
{
    public string asylumSceneName = "Level_Asylum";

    void Start()
    {
        if (Object.FindAnyObjectByType<EventSystem>() == null)
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }

        if (Object.FindAnyObjectByType<Canvas>() != null)
            return;

        var canvasGo = new GameObject("Canvas");
        var canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasGo.AddComponent<GraphicRaycaster>();

        var btnGo = new GameObject("PlayButton");
        btnGo.transform.SetParent(canvasGo.transform, false);
        var rect = btnGo.AddComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.sizeDelta = new Vector2(220f, 48f);
        var img = btnGo.AddComponent<Image>();
        img.color = new Color(0.12f, 0.12f, 0.14f, 0.95f);
        var btn = btnGo.AddComponent<Button>();
        btn.targetGraphic = img;
        btn.onClick.AddListener(PlayGame);

        var textGo = new GameObject("Text");
        textGo.transform.SetParent(btnGo.transform, false);
        var tr = textGo.AddComponent<RectTransform>();
        tr.anchorMin = Vector2.zero;
        tr.anchorMax = Vector2.one;
        tr.offsetMin = Vector2.zero;
        tr.offsetMax = Vector2.zero;
        var te = textGo.AddComponent<Text>();
        te.text = "Play — Hollow";
        te.alignment = TextAnchor.MiddleCenter;
        te.color = Color.white;
        te.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        var titleGo = new GameObject("Title");
        titleGo.transform.SetParent(canvasGo.transform, false);
        var titleRect = titleGo.AddComponent<RectTransform>();
        titleRect.anchorMin = new Vector2(0.5f, 0.72f);
        titleRect.anchorMax = new Vector2(0.5f, 0.72f);
        titleRect.sizeDelta = new Vector2(800f, 120f);
        var title = titleGo.AddComponent<Text>();
        title.text = "Hollow";
        title.alignment = TextAnchor.MiddleCenter;
        title.color = new Color(0.85f, 0.85f, 0.88f);
        title.fontSize = 56;
        title.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
    }

    public void PlayGame()
    {
        SceneManager.LoadScene(asylumSceneName);
    }
}
