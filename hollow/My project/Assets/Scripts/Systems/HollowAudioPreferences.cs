using UnityEngine;

/// <summary>
/// Persisted player choice: use FMOD event engine vs Unity-only procedural SFX.
/// Default is Unity-only so the game is audible without banks or Studio setup.
/// </summary>
public static class HollowAudioPreferences
{
    const string KeyUseFmod = "Hollow_UseFmodEngine";

    /// <summary>When true and HOLLOW_FMOD is defined, FMODManager may start Studio events and a Studio Listener is added.</summary>
    public static bool UseFmodEngine
    {
        get => PlayerPrefs.GetInt(KeyUseFmod, 0) == 1;
        set
        {
            PlayerPrefs.SetInt(KeyUseFmod, value ? 1 : 0);
            PlayerPrefs.Save();
        }
    }
}
