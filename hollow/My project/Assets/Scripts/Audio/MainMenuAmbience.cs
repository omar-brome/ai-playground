using UnityEngine;

/// <summary>
/// 2D menu drone. Created at runtime from <see cref="MainMenu"/> if missing — requires an <see cref="AudioListener"/> in the scene.
/// </summary>
public class MainMenuAmbience : MonoBehaviour
{
    public float volume = 0.4f;

    void Awake()
    {
        var src = gameObject.AddComponent<AudioSource>();
        src.loop = true;
        src.spatialBlend = 0f;
        src.priority = 0;
        src.volume = volume;
        src.ignoreListenerPause = true;
        src.clip = ProceduralAudio.MenuAmbience(4f, 44100);
        src.Play();
    }
}
