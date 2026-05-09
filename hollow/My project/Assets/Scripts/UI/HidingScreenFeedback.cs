using UnityEngine;

/// <summary>
/// Vignette-style dim + low-pass when the player is hiding.
/// </summary>
[RequireComponent(typeof(AudioLowPassFilter))]
public class HidingScreenFeedback : MonoBehaviour
{
    PlayerHiding _playerHiding;
    AudioLowPassFilter _lowPass;

    void Awake()
    {
        _lowPass = GetComponent<AudioLowPassFilter>();
        _lowPass.cutoffFrequency = 22000f;
        _lowPass.lowpassResonanceQ = 1.1f;
    }

    void Start()
    {
        var p = GameObject.FindGameObjectWithTag("Player");
        if (p != null)
            _playerHiding = p.GetComponent<PlayerHiding>();
    }

    void Update()
    {
        if (_lowPass == null || _playerHiding == null)
            return;

        var hide = _playerHiding.IsHiding;
        var target = hide ? 750f : 22000f;
        _lowPass.cutoffFrequency = Mathf.MoveTowards(_lowPass.cutoffFrequency, target, Time.deltaTime * 14000f);
    }

    void OnGUI()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;
        if (_playerHiding == null || !_playerHiding.IsHiding)
            return;

        var a = 0.4f;
        GUI.color = new Color(0f, 0f, 0f, a);
        GUI.DrawTexture(new Rect(0f, 0f, Screen.width, Screen.height), Texture2D.whiteTexture, ScaleMode.StretchToFill);

        var edge = Mathf.Min(Screen.width, Screen.height) * 0.12f;
        GUI.color = new Color(0f, 0f, 0f, a * 1.15f);
        GUI.DrawTexture(new Rect(0f, 0f, Screen.width, edge), Texture2D.whiteTexture, ScaleMode.StretchToFill);
        GUI.DrawTexture(new Rect(0f, Screen.height - edge, Screen.width, edge), Texture2D.whiteTexture,
            ScaleMode.StretchToFill);
        GUI.DrawTexture(new Rect(0f, 0f, edge, Screen.height), Texture2D.whiteTexture, ScaleMode.StretchToFill);
        GUI.DrawTexture(new Rect(Screen.width - edge, 0f, edge, Screen.height), Texture2D.whiteTexture,
            ScaleMode.StretchToFill);

        GUI.color = Color.white;
        var style = new GUIStyle(GUI.skin.label)
        {
            fontSize = 22,
            alignment = TextAnchor.MiddleCenter,
            fontStyle = FontStyle.Bold
        };
        style.normal.textColor = new Color(0.75f, 0.82f, 0.78f);
        GUI.Label(new Rect(Screen.width / 2f - 200f, Screen.height * 0.72f, 400f, 40f), "HIDDEN — E to leave", style);
    }
}
