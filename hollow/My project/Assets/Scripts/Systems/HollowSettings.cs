using UnityEngine;

/// <summary>
/// Player-facing settings persisted with <see cref="PlayerPrefs"/>.
/// </summary>
public static class HollowSettings
{
    const string MicSensitivityKey = "Hollow_MicSensitivity";

    /// <summary>Scales microphone RMS before thresholds and noise emission (0.05–2).</summary>
    public static float MicSensitivity
    {
        get => PlayerPrefs.GetFloat(MicSensitivityKey, 1f);
        set
        {
            PlayerPrefs.SetFloat(MicSensitivityKey, Mathf.Clamp(value, 0.05f, 2f));
            PlayerPrefs.Save();
        }
    }
}
